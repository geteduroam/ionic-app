#!/bin/bash

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

npm install --save @capacitor/core @capacitor/cli

#build wifi-eap-configurator plugin
cd plugins/wifi-eap-configurator
npm install

cd ../..
npm install ./plugins/wifi-eap-configurator --save

# Build the application
echo "npm run build"
npm run build

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
$ANDROID_HOME/build-tools/28.0.3/zipalign -v -p 4 app-debug.apk app-debug-aligned.apk

#Sign the APK
#TODO take password as parameter
$ANDROID_HOME/build-tools/28.0.3/apksigner sign --ks /release-key.jks --ks-pass pass:${PASS_PHRASE} --key-pass pass:${PASS_PHRASE} --out geteduroam.apk app-debug-aligned.apk

cp geteduroam.apk /home/gradle/final-apk/




