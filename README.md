# GetEduroam [![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

## HOW TO BUILD  ##
 
- Automatic APK generation for Android
    - Navigate to the folder called [tools](./tools)
    - Make sure that both __docker__ and __docker-compose__ are available in the machine.
        - If needed, [install-docker.sh](./tools/install-docker.sh) will install both.
             ```
             ./install-docker.sh
             ```
    - Execute [generate-apk.sh](./tools/generate-apk.sh) script.
        ```
        ./generate-apk.sh
        ```
     - The APK is generated and signed with the key __release-key.jks__
     - The new apk will be available in the folder __apk__ inside __tools__
        
- Manual Application generation
    - Requirements
       - Java 
       - Node.js
     - Navigate to __src__ folder
     - Install Dependencies and build   
       ```
       npm i
       npm run build
       ```
    - Android
        - Android specific requirements
            - Android-SDK
            - Gradle
        - Create android folder and config gradle
          ```
          npx cap add android
          ```
        - Synchronize android folder
          ```
          npx cap sync android
          ```
        - Access the new generated __android__ folder
          ```
          cd android
          ```
        - Create APK
          ```
          ./gradlew assembleDebug
          ```
        - Access the folder in which the APK is available
          ```
          cd app/build/outputs/apk/debug/
          ```
        - Align APK
          ```
          zipalign -v -p 4 app-debug.apk app-debug-aligned.apk
          ```
        - Sign APK
          ```
          apksigner sign --ks /release-key.jks --ks-pass pass:KEY_PASSWORD --key-pass pass:KEY_PASSWORD --out geteduroam.apk app-debug-aligned.apk
          ```
    - iOS
        - iOS specific requirements:
            - Xcode
            - CocoaPods
        - Execute
            ```
            npx cap add ios -> Create ios folder
            npx cap sync ios -> Synchronyze ios folder
            npx cap open ios -> Open xCode
           
            In folder /ios/App throw command:
                   - pod install -> Install dependencies with CocoaPods.
            ```       
  
   
