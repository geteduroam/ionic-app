# Building Android app

There are 2 options to build the app in Android: one automatic and another manual.
 

## Automatic APK generation for Android

Make sure that both __docker__ and __docker-compose__ are available in the machine.
If needed, [`install-docker.sh`](contrib/install-docker.sh) will install both.

	./contrib/install-docker.sh


* Generate the APK using [Makefile]:

		make apk

	* The APK is generated and signed with the key `contrib/release-key.jks`
	* The new apk will be available in the folder `apk`


## Manual building

### Requirements

* [Node.js](https://nodejs.org/en/)
* [Android-SDK](https://developer.android.com/studio#downloads)

NOTE: If you're developing on MacOS, check the guide for
[installing Android Studion on MacOS](ANDROID_STUDIO_MAC.md)


### Building

NOTE: It's easier to build with Docker using `make apk`  
This describes how to build manually.

* Navigate to **geteduroam** folder

		cd geteduroam

* Install Dependencies and build (nodeJS dependencies)

		npm i
		npm run build

* Create `android` folder and config gradle

		npx cap add android

* Synchronize the `android` folder

		npx cap sync android

* (If you want to open this in Android Studio, run `npx cap open android`)

* Access the new generated `android` folder

		cd android

* Create APK

		./gradlew assembleDebug

* Access the folder in which the APK is available

		cd app/build/outputs/apk/debug/

* Align APK

		zipalign -v -p 4 app-debug.apk app-debug-aligned.apk

* Sign APK

		apksigner sign \
			--ks /release-key.jks \
			--ks-pass pass:KEY_PASSWORD \
			--key-pass pass:KEY_PASSWORD \
			--out geteduroam.apk app-debug-aligned.apk
