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

6. (Android Only) Add two permissions to the manifest:

- <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
- <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />

## HOW TO USE ##

each time you want to use the configurator you will have to do a few steps, configurating first the whole implementation, as follows:

1. Import capacitor plugin

```TypeScript
declare var Capacitor
const { WifiEapConfigurator } = Capacitor.Plugins
```
2. With ``WifiEapConfigurator`` will bring a function called ``.configureAP()`` which has the following parameters: 
```TypeScript
WifiEapConfigurator.configureAP({ssid: String, username: String, password: String, eap: Number, servername: String, auth: Number, caCertificate: String})
```
3. With ``WifiEapConfigurator`` will bring a function called ``.networkAssociated()`` which has the following parameters: 
```TypeScript
WifiEapConfigurator.networkAssociated({ssid: String})
```
4. With ``WifiEapConfigurator`` will bring a function called ``.enableWifi()`` which has the following parameters: 
```TypeScript
WifiEapConfigurator.enableWifi()
```
5. And that's it! You should be using the library already!

## Variables

### Function Values:
So there's a couple of values that comes into this function, which are explained below:

| Variable|Type|Optional|Example|
|:---: |:---: |:---: |:---: |
|ssid|`String`|❌|eduroam|
|username|`String`|❌|Email Address  |
|password|`String`|❌|Password|
|eap|`Number`|❌|21|
|servername |`String`|✅|radius.upo.es|
|anonymous |`String`|✅|anonymousIdentity|
|auth|`Number`|❌|5|
|caCertificate|`String`|✅|Certificate Base64|

### Variables Values

There's 2 variables in specific that requires specific values for specific results and these are `eap` and `auth` explained below:

### eap

EAP is the variable that determines which EAP connection we are doing, it can go from:

- 13 <= For EAP-TLS connections
- 21 <= For EAP-TTLS connections
- 25 <= For EAP-PEAP connections

### auth

auth is the variable that determines which TTLS Auth Type we are doing, it can go from:

- 3 <= For MSCHAP connections
- 4 <= For MSCHAPv2 connections
- 5 <= For PAP connections
- 6 <= For GTC connections
