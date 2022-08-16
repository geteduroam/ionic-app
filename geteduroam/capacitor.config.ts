/// <reference types="@capacitor/local-notifications" />
/// <reference types="@capacitor/push-notifications" />
/// <reference types="@capacitor/splash-screen" />

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: "app.eduroam.geteduroam",
  appName: "geteduroam",
  bundledWebRuntime: false,
  npmClient: "npm",
  webDir: "www",
  cordova: {
    preferences: {
      ScrollEnabled: "false",
      "android-minSdkVersion": "19",
      BackupWebStorage: "none",
      SplashShowOnlyFirstTime: "false",
      SplashScreen: "false"
    }
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      showSpinner: false
    }
  }
};

export default config;
