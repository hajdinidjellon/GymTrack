import ExpoModulesCore
import Foundation

#if canImport(AlarmKit) && canImport(AppIntents)
import AlarmKit
#endif

/**
 * The end of the rest as a real alarm, the one of the Clock app's timer:
 * full screen over any app, rings on silent and in Focus, with "Stop" and
 * "Open Okilo". iOS 26 and later only; elsewhere every call does nothing.
 */
public class OkiloAlarmModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OkiloAlarm")

    Function("isSupported") { () -> Bool in
      #if canImport(AlarmKit) && canImport(AppIntents)
      if #available(iOS 26.0, *) { return true }
      #endif
      return false
    }

    /// "authorized", "denied", "notDetermined" or "unsupported".
    AsyncFunction("requestAuthorization") { () async -> String in
      #if canImport(AlarmKit) && canImport(AppIntents)
      if #available(iOS 26.0, *) {
        let manager = AlarmManager.shared
        if manager.authorizationState != .notDetermined {
          return OkiloAlarm.describe(manager.authorizationState)
        }
        let state = (try? await manager.requestAuthorization()) ?? .denied
        return OkiloAlarm.describe(state)
      }
      #endif
      return "unsupported"
    }

    /// Rings at `at` (ms since epoch). False when it could not be scheduled.
    AsyncFunction("schedule") { (id: String, at: Double, title: String, stopLabel: String, openLabel: String) async -> Bool in
      #if canImport(AlarmKit) && canImport(AppIntents)
      if #available(iOS 26.0, *), let uuid = UUID(uuidString: id) {
        return await OkiloAlarm.schedule(
          id: uuid,
          date: Date(timeIntervalSince1970: at / 1000),
          title: title,
          stopLabel: stopLabel,
          openLabel: openLabel
        )
      }
      #endif
      return false
    }

    /// The "Valider" tapped on the lock screen while the app's JS was not running (OkiloLockScreenTaps).
    Function("takeLockScreenTaps") { () -> [[String: Any]] in
      OkiloLockScreenTaps.take()
    }

    AsyncFunction("cancel") { (id: String) in
      #if canImport(AlarmKit) && canImport(AppIntents)
      if #available(iOS 26.0, *), let uuid = UUID(uuidString: id) {
        OkiloAlarm.cancel(id: uuid)
      }
      #endif
    }
  }
}
