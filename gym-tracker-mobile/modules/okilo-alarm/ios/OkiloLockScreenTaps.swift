import ExpoModulesCore
import Foundation
import UIKit

#if canImport(ActivityKit)
import ActivityKit
#endif

#if canImport(AlarmKit) && canImport(AppIntents)
import AlarmKit
#endif

/**
 * "Valider" on the lock screen, with the app asleep or closed.
 *
 * expo-widgets runs the button's intent in the app's process (iOS launches it
 * in the background when needed) and only posts a notification for the JS
 * listener: with no JS running, the tap was lost. Registered at launch, before
 * the intent runs, this subscriber hears that notification natively and:
 * - queues the tap (the set the screen showed, and when): the app replays it
 *   on the session when its JS runs again (`takeLockScreenTaps`);
 * - moves the lock screen on to the screen the app worked out ahead (`next`),
 *   with the rest starting now;
 * - schedules the end of that rest as an alarm (iOS 26, AlarmKit).
 */
public final class OkiloLockScreenTaps: ExpoAppDelegateSubscriber {
  static let activityName = "WorkoutActivity"
  static let validateTarget = "validate"
  /// expo-widgets' notification (WidgetsModule.swift: onUserInteractionNotification).
  static let interaction = Notification.Name("onExpoWidgetsUserInteraction")
  static let queueKey = "okilo.lockScreenTaps"
  /// The rest alarm's id: keep in sync with REST_ALARM_ID in services/alarmKit.ts.
  static let restAlarmID = "6F1C2B8E-4A3D-4E5F-9B7A-0C1D2E3F4A5B"

  private static let lock = NSLock()
  private static var observer: NSObjectProtocol?
  /// The screen just sent, before iOS reports it: a quick second tap goes on from it.
  private static var lastShown: (props: [String: Any], at: Date)?

  @MainActor
  public func subscriberDidRegister() {
    OkiloLockScreenTaps.lock.lock()
    defer { OkiloLockScreenTaps.lock.unlock() }
    guard OkiloLockScreenTaps.observer == nil else { return }
    OkiloLockScreenTaps.observer = NotificationCenter.default.addObserver(
      forName: OkiloLockScreenTaps.interaction,
      object: nil,
      queue: nil
    ) { notification in
      OkiloLockScreenTaps.handle(notification)
    }
  }

  // MARK: - The queue

  static func enqueue(exerciseId: String, setIndex: Int, at: Double) {
    lock.lock()
    defer { lock.unlock() }
    var taps = UserDefaults.standard.array(forKey: queueKey) as? [[String: Any]] ?? []
    taps.append(["exerciseId": exerciseId, "setIndex": setIndex, "at": at])
    UserDefaults.standard.set(taps, forKey: queueKey)
  }

  /// The queued taps, oldest first; the queue is emptied.
  static func take() -> [[String: Any]] {
    lock.lock()
    defer { lock.unlock() }
    let taps = UserDefaults.standard.array(forKey: queueKey) as? [[String: Any]] ?? []
    UserDefaults.standard.removeObject(forKey: queueKey)
    return taps
  }

  // MARK: - The tap

  static func handle(_ notification: Notification) {
    guard let event = notification.userInfo?["eventData"] as? [String: Any],
          event["source"] as? String == activityName,
          event["target"] as? String == validateTarget
    else { return }
    #if canImport(ActivityKit)
    if #available(iOS 16.2, *) {
      advance(at: Date())
    }
    #endif
  }

  #if canImport(ActivityKit)
  @available(iOS 16.2, *)
  static func advance(at now: Date) {
    guard let activity = Activity<LiveActivityAttributes>.activities.first(where: {
      $0.content.state.name == activityName && ($0.activityState == .active || $0.activityState == .stale)
    }) else { return }

    lock.lock()
    let recent = lastShown.flatMap { now.timeIntervalSince($0.at) < 3 ? $0.props : nil }
    let current = recent ?? parse(activity.content.state.props)
    guard let props = current,
          props["canValidate"] as? Bool == true,
          let set = props["set"] as? [String: Any],
          let exerciseId = set["exerciseId"] as? String,
          let setIndex = (set["setIndex"] as? NSNumber)?.intValue
    else {
      lock.unlock()
      return
    }
    let ms = now.timeIntervalSince1970 * 1000
    let shown = next(after: props, at: ms)
    if let shown { lastShown = (shown.props, now) }
    lock.unlock()

    enqueue(exerciseId: exerciseId, setIndex: setIndex, at: ms)
    guard let shown, let json = serialize(shown.props) else { return }

    // The intent returns right after the notification: keep the app awake for the update
    let application = UIApplication.shared
    var task = UIBackgroundTaskIdentifier.invalid
    task = application.beginBackgroundTask(withName: "okilo.lockScreenTap") {
      application.endBackgroundTask(task)
      task = .invalid
    }
    let alarm = props["alarm"] as? [String: Any]
    Task {
      let state = LiveActivityAttributes.ContentState(name: activityName, props: json)
      await activity.update(ActivityContent(state: state, staleDate: nil))
      if shown.restSeconds > 0, let alarm {
        await scheduleRestAlarm(at: now.addingTimeInterval(shown.restSeconds), words: alarm)
      }
      if task != .invalid {
        application.endBackgroundTask(task)
        task = .invalid
      }
    }
  }
  #endif

  /// The screen after the tap: `next` laid over the current one, its rest starting now.
  static func next(after props: [String: Any], at ms: Double) -> (props: [String: Any], restSeconds: Double)? {
    guard let next = props["next"] as? [String: Any] else { return nil }
    var shown = props
    for (key, value) in next { shown[key] = value }
    let restSeconds = (next["restSeconds"] as? NSNumber)?.doubleValue ?? 0
    shown.removeValue(forKey: "restSeconds")
    if restSeconds > 0 {
      shown["restStart"] = ms
      shown["restEnd"] = ms + restSeconds * 1000
    } else {
      shown["restStart"] = NSNull()
      shown["restEnd"] = NSNull()
    }
    return (shown, restSeconds)
  }

  static func scheduleRestAlarm(at date: Date, words: [String: Any]) async {
    #if canImport(AlarmKit) && canImport(AppIntents)
    if #available(iOS 26.0, *),
       let id = UUID(uuidString: restAlarmID),
       let title = words["title"] as? String,
       let stop = words["stop"] as? String,
       let open = words["open"] as? String {
      _ = await OkiloAlarm.schedule(id: id, date: date, title: title, stopLabel: stop, openLabel: open)
    }
    #endif
  }

  static func parse(_ json: String?) -> [String: Any]? {
    guard let data = json?.data(using: .utf8) else { return nil }
    return (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
  }

  static func serialize(_ props: [String: Any]) -> String? {
    guard JSONSerialization.isValidJSONObject(props),
          let data = try? JSONSerialization.data(withJSONObject: props)
    else { return nil }
    return String(data: data, encoding: .utf8)
  }
}

#if canImport(ActivityKit)
/**
 * expo-widgets' own attributes type, internal to it: ActivityKit finds an
 * activity by the attributes' type name and shape, so this twin reads and
 * updates the activities expo-widgets started. Keep it identical to
 * node_modules/expo-widgets/ios/Widgets/WidgetLiveActivity.swift.
 */
@available(iOS 16.1, *)
struct LiveActivityAttributes: ActivityAttributes {
  var url: String?

  public struct ContentState: Codable, Hashable {
    var name: String
    var props: String?
  }
}
#endif
