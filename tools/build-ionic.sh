#!/bin/bash

PROJECT_NAME=geteduroam

# Create Gradle folder (if not exists)
if [ ! -d ~/.gradle ]; then
    echo "Creating Gradle folder in Home dir"
    mkdir ~/.gradle
fi

cd ..
echo "Building application..."
#CURRENT_UID=$(id -u):$(id -g) docker-compose up
docker-compose up

cd ./src/android/app/build/outputs/apk/debug/