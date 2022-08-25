
  Pod::Spec.new do |s|
    s.name = 'WifiEapConfigurator'
    s.version = '0.0.1'
    s.summary = 'Wifi EAP Configurator'
    s.license = 'MIT'
    s.homepage = 'http://localhost/'
    s.author = 'Christopher Genao'
    s.source = { :git => 'http://localhost/', :tag => s.version.to_s }
    s.ios.deployment_target  = '12.0'
    s.dependency 'Capacitor'
    s.source_files = 'ios/Plugin/**/*.{swift,h,m,c,cc,mm,cpp}'
  end
