# Setting up Android Studio on Mac OS

The procedure for setting up Android Studio on MacOS is a bit confusing.
Use these steps to get it working.

1. Download and install [Android Studio](https://developer.android.com/studio/)

2. Start Android Studio, choose to not import settings if you are asked about this

3. During the installation wizard, set things up with the default settings

4. Preferences (⌘,) and search for SDK. At the time of writing, it's under **Appearance & Behavior** -> **System Settings** -> **Android SDK**

5. Make sure that a adequate SDK is installed, if not, click Edit behind Android SDK Location and follow the installation wizard

6. Accept licenses

	export JAVA_HOME="/Applications/Android Studio.app/Contents/jre/jdk/Contents/Home"
	JAVA_HOME="/Applications/Android Studio.app/Contents/jre/jdk/Contents/Home" ~/Library/Android/sdk/tools/bin/sdkmanager --licenses

7. Run `make open-android`

*or follow the [building instructions](DEV_ANDROID.md) for manual building*
