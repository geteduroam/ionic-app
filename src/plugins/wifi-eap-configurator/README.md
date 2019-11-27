## HOW TO BUILD  ##
 
 - Requirements
    * Java 
    * Node.js
    * CocoaPods ( for building iOs in a Mac )
    
1. Go to ``/plugins/wifi-eap-configurator`` and make a ``npm install``

2. Go to ``/src`` and make a ``npm install``, just in case you didnt save the wifi-eap-configurator package, make a ``npm install ./plugins/wifi-eap-configurator --save``.

3. Make the command ``npm run build``.

4. For:

- Android
```bash
    npx cap add android -> Create android folder and config gradle
    npx cap sync android -> Synchronyze android folder
    npx cap open android -> Open Android Studio and build app
```

- iOS 
```bash
    1. npx cap add ios -> Create ios folder
    2. npx cap sync ios -> Synchronyze ios folder
    3. In folder /ios/App throw command:
           pod install -> Install dependencies with CocoaPods.
```

5. (Android Only) Go to ``MainActivity.java`` in ``src/android/app/src/main/java/com/emergya/geteduroam``, inside the ``onCreated`` method there is a function called ``this.init()`` inside that function  add the following line:

```Android
add(WifiEapConfigurator.class)
```