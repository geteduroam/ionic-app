#!/bin/bash

cd /home/gradle/myApp

echo "executing entrypoint.sh ..."
#rebuild npm
echo "npm install"
npm install

echo "npm rebuild node-sass"
npm rebuild node-sass

echo "npm run build"
npm run build

#Check if android folder already exists to delete it
if [ -d "/home/gradle/myApp/andriod" ]; then
    echo "Removing android dir"
    rm -rf /home/gradle/myApp/andriod
fi

npm install --save @capacitor/core @capacitor/cli

echo "npx cap add android"
npx cap add android

# Enter the new created android directory
cd android

#generate dbug apk
./gradlew assembleDebug

# Go to the new generated APK directory
cd app/build/outputs/apk/debug/

#Check if app-debug-aligned.apk already exists to delete it
if [ -f "/home/gradle/myApp/andriod/app/build/outputs/apk/debug/app-debug-aligned.apk" ]; then
    echo "Removing app-debug-aligned.apk"
    rm -f /home/gradle/myApp/andriod/app/build/outputs/apk/debug/app-debug-aligned.apk
fi

#Align the APK
$ANDROID_HOME/build-tools/28.0.3/zipalign -v -p 4 app-debug.apk app-debug-aligned.apk

#Sign the APK
#TODO take password as parameter
$ANDROID_HOME/build-tools/28.0.3/apksigner sign --ks /release-key.jks --ks-pass pass:${PASS_PHRASE} --key-pass pass:${PASS_PHRASE} --out geteduroam.apk app-debug-aligned.apk

cp geteduroam.apk /home/gradle/final-apk/




