# geteduroam ionic-based mobile app

Application for configuring 802.1X Wi-Fi networks from eap-config profiles.

Pre-built versions are available on the [App Store](https://apps.apple.com/no/app/geteduroam/id1504076137)
and the [Play Store](https://play.google.com/store/apps/details?id=app.eduroam.geteduroam).


## Building

The Android app can be built using Docker via the [Makefile]

	make apk

Without Docker, you can also set up the project using the Makefile

	make open-android # To start Android Studio
	make open-xcode # To start XCode on MacOS

If you want to ensure you're rebuilding the project,
remove all generated files using

	make clean


### Manual building

If you want to build manually, follow these instructions

* [Manually build Android app](DEV-ANDROID.md)
* [Manually build iOS app](DEV-IOS.md)
