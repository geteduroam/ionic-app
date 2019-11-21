# GetEduroam [![standard-readme compliant](https://img.shields.io/badge/readme%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

## HOW TO BUILD  ##
 
 - Requirements
    * Java 
    * Node.js
    * CocoaPods ( for building iOs in a Mac )
    
 - Install Dependencies and build   
     ```
    npm i
    npm run build
    ```
- Android
    ```
    npx cap add android -> Create android folder and config gradle
    npx cap sync android -> Synchronyze android folder
    npx cap open android -> Open Android Studio and build app
  
- iOs 
    ```
    npx cap add ios -> Create ios folder
    npx cap sync ios -> Synchronyze ios folder
    npx cap open ios -> Open xCode
   
    In folder /ios/App throw command:
           - pod install -> Install dependencies with CocoaPods. 
