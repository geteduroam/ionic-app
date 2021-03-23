# geteduroam ionic-based mobile app

Application for configuring 802.1X Wi-Fi networks from eap-config profiles.

Pre-built versions are available on the [App Store](https://apps.apple.com/no/app/geteduroam/id1504076137)
and the [Play Store](https://play.google.com/store/apps/details?id=app.eduroam.geteduroam).


## Building

The Android app can be built using Docker via the [Makefile]

	make apk

Without Docker, you can also set up the project using the Makefile

You must install these dependencies before running `make`

* [Android-SDK](https://developer.android.com/studio#downloads) (for Android only)
* [Node.js](https://nodejs.org/en/) (for both Android and iOS)
* [XCode](https://developer.apple.com/xcode/) (for iOS only)
* [CocoaPods](https://cocoapods.org) (for iOS only)

Then start Android Studio or XCode

	make open-android		# To start Android Studio
	make open-xcode  		# To start XCode on MacOS


If you want to ensure you're rebuilding the project,
remove all generated files using

	make clean


### Manual building

If you want to build manually, follow these instructions

* [Manually build Android app](DEV_ANDROID.md)
* [Manually build iOS app](DEV_IOS.md)
