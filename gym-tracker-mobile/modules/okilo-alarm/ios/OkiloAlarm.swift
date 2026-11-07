import Foundation

#if canImport(AlarmKit) && canImport(AppIntents)
import ActivityKit
import AlarmKit
import AppIntents
import SwiftUI

@available(iOS 26.0, *)
public struct OkiloAlarmMetadata: AlarmMetadata {
  public init() {}
}

@available(iOS 26.0, *)
enum OkiloAlarm {
  /// Okilo's coral, the colour of the alarm's buttons.
  static let tint = Color(red: 1.0, green: 0.42, blue: 0.29)

  static func describe(_ state: AlarmManager.AuthorizationState) -> String {
    switch state {
    case .authorized: return "authorized"
    case .denied: return "denied"
    case .notDetermined: return "notDetermined"
    @unknown default: return "denied"
    }
  }

  static func schedule(id: UUID, date: Date, title: String, stopLabel: String, openLabel: String) async -> Bool {
    guard AlarmManager.shared.authorizationState == .authorized else { return false }
    cancel(id: id)

    let alert = AlarmPresentation.Alert(
      title: "\(title)",
      stopButton: AlarmButton(text: "\(stopLabel)", textColor: .white, systemImageName: "stop.circle"),
      secondaryButton: AlarmButton(text: "\(openLabel)", textColor: .white, systemImageName: "arrow.up.forward.app"),
      secondaryButtonBehavior: .custom
    )
    let attributes = AlarmAttributes<OkiloAlarmMetadata>(
      presentation: AlarmPresentation(alert: alert),
      metadata: OkiloAlarmMetadata(),
      tintColor: tint
    )
    let configuration = AlarmManager.AlarmConfiguration<OkiloAlarmMetadata>(
      countdownDuration: nil,
      schedule: .fixed(date),
      attributes: attributes,
      stopIntent: nil,
      secondaryIntent: OpenOkiloIntent(alarmID: id.uuidString),
      sound: .default
    )
    do {
      _ = try await AlarmManager.shared.schedule(id: id, configuration: configuration)
      return true
    } catch {
      return false
    }
  }

  static func cancel(id: UUID) {
    guard let alarms = try? AlarmManager.shared.alarms, alarms.contains(where: { $0.id == id }) else { return }
    try? AlarmManager.shared.cancel(id: id)
  }
}

/// "Open Okilo" on the alarm: stops it and brings the app to the front.
@available(iOS 26.0, *)
public struct OpenOkiloIntent: LiveActivityIntent {
  public static let title: LocalizedStringResource = "Open Okilo"
  public static let isDiscoverable = false
  public static let openAppWhenRun = true

  @Parameter(title: "Alarm ID")
  public var alarmID: String

  public init() {}

  init(alarmID: String) {
    self.alarmID = alarmID
  }

  public func perform() async throws -> some IntentResult {
    if let id = UUID(uuidString: alarmID) {
      try? AlarmManager.shared.stop(id: id)
    }
    return .result()
  }
}

/// Listed by the app target (see the config plugin): iOS finds the intent above through it.
@available(iOS 26.0, *)
public struct OkiloAlarmIntents: AppIntentsPackage {}
#endif
