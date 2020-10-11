# Setting up Android Studio on Mac OS

The procedure for setting up Android Studio on MacOS is a bit confusing.
Use these steps to get it working.

1. Download and install [Android Studio](https://developer.android.com/studio/)

2. Start Android Studio

3. Preferences (⌘,) and search for SDK. At the time of writing, it's under **Appearance & Behavior** -> **System Settings** -> **Android SDK**.

4. Click Edit behind Android SDK Location and follow the installation wizard

5. Accept licenses

	export JAVA_HOME="/Applications/Android Studio.app/Contents/jre/jdk/Contents/Home"
	JAVA_HOME="/Applications/Android Studio.app/Contents/jre/jdk/Contents/Home" ~/Library/Android/sdk/tools/bin/sdkmanager --licenses

6. Follow the [development instructions](DEV-ANDROID.md)
