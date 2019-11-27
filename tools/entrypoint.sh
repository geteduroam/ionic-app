#!/bin/bash

cd /home/gradle/myApp
ls -la

echo "executing entrypoint.sh ..."
#rebuild npm
echo "npm install"
npm install

echo "npm rebuild node-sass"
npm rebuild node-sass
npm run build

#Check if android folder already exists to delete it
if [-d andriod ]; then
    echo "Removing android dir"
    rm -rf android
fi

echo "npx cap add android"
npm install --save @capacitor/core @capacitor/cli
npx cap add android

# Enter the new created android directory
cd android

#generate dbug apk
./gradlew assembleDebug

# Go to the new generated APK directory
cd app/build/outputs/apk/debug/

#Align the APK
zipalign -v -p 4 app-debug.apk app-debug-aligned.apk

#Sign the APK
#TODO take password as parameter
apksigner sign --ks /release-key.jks --ks-pass pass:emergya --key-pass pass:emergya --out geteduroam.apk app-debug-aligned.apk




