Pod::Spec.new do |s|
  s.name           = 'OkiloAlarm'
  s.version        = '1.0.0'
  s.summary        = 'The end of the rest as a real alarm (AlarmKit, iOS 26+), lock screen taps with the app closed'
  s.author         = 'Okilo'
  s.homepage       = 'https://github.com/hajdinidjellon/GymTrack'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  # Older iOS versions launch without AlarmKit: linked weakly, used behind #available
  s.weak_frameworks = 'AlarmKit', 'AppIntents', 'ActivityKit'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
