Pod::Spec.new do |s|
  s.name           = 'NativeTextMeasure'
  s.version        = '0.0.1'
  s.summary        = 'Native text measurement using CoreText'
  s.homepage       = 'https://github.com/example'
  s.license        = 'MIT'
  s.author         = 'dev'
  s.source         = { git: '' }
  s.platform       = :ios, '15.1'
  s.swift_version  = '5.9'
  s.source_files   = '*.swift'

  s.dependency 'ExpoModulesCore'
end
