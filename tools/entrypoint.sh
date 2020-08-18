#!/bin/bash

if [ ! -z "$1" ]; then
    exec "$@"
fi

cd /home/gradle/myApp

echo "executing entrypoint.sh ..."
#rebuild npm
echo "npm install"
npm install

echo "npm rebuild node-sass"
npm rebuild node-sass



##Check if android folder already exists to delete it NO LONGER NEEDED!!!
#if [ -d "/home/gradle/myApp/android" ]; then
#    echo "Removing android dir"
#    rm -rf /home/gradle/myApp/android
#fi

#rename android directory to override later
mv android android_bk

npm install --save @capacitor/core @capacitor/cli

#build wifi-eap-configurator plugin
cd plugins/wifi-eap-configurator
npm install

cd ../..
npm install ./plugins/wifi-eap-configurator --save

# Build the application
echo "npm run build"
npm run build

echo "npx cap add android"
npx cap add android

echo "copy from android_bk overriding"
\cp -rf android_bk/* android

echo "npx cap sync android"
npx cap sync android

# Enter the updated android directory
cd android

#generate dbug apk
./gradlew assembleDebug

# Go to the new generated APK directory
cd app/build/outputs/apk/debug/

#Check if app-debug-aligned.apk already exists to delete it
if [ -f "/home/gradle/myApp/android/app/build/outputs/apk/debug/app-debug-aligned.apk" ]; then
    echo "Removing app-debug-aligned.apk"
    rm -f /home/gradle/myApp/android/app/build/outputs/apk/debug/app-debug-aligned.apk
fi

#Align the APK
echo "Aligning the APK"
$ANDROID_HOME/build-tools/${ANDROID_SDK_VERSION}/zipalign -v -p 4 app-debug.apk app-debug-aligned.apk

#Sign the APK
#TODO take password as parameter
echo "Signing the APK"
$ANDROID_HOME/build-tools/${ANDROID_SDK_VERSION}/apksigner sign --ks /release-key.jks --ks-pass pass:${PASS_PHRASE} --key-pass pass:${PASS_PHRASE} --out geteduroam.apk app-debug-aligned.apk

cp geteduroam.apk /home/gradle/final-apk/




