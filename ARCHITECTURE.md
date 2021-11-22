# geteduroam Ionic app architecture

## Introduction

This is the mobile app for geteduroam.  It's job is to let the user choose
their institution, and then download the appropriate .eap-config file,
and configure that file in the operating system through the native API.

There are two flows, one flow is where the .eap-config is downloaded directly,
but it lacks credentials, which the user must enter themselves.
In the other flow, the .eap-config file is behind OAuth authentication, and it will
contain credentials.  It is possible to serve a file with credentials,
even though the user did not need to log in, and it is possible to serve
a file without credentials, even after authentication, but these flows are
not tested a thoughourly.

As this app works for Android and iOS, it has native plugins for either platform.
The common flow (select institution, authenticate or enter user/pass) is done
in TypeScript code which can be executed on either platform.  When the .eap-config
is downloaded, it is parsed by TypeScript code, and its values are then passed
to native code.  There is separate native code for iOS and Android.

## The common flow

_This section lacks technical information_

The app will download a discovery list from https://discovery.eduroam.app/v1/discovery.json,
and present a searchable list of all institutions to the user.  We discovered that
the Ionic framework has performance issues showing long lists, so at first we
only show a search field and empty list, after a few characters are entered,
we start filtering.  We filter on name, keywords and abbreviation (meaning that
searching for UiO might yield "Universitetet i Oslo")

The institution might contain multiple profiles, the user gets to choose the profile
they want to use, except if there is only one, then no choice is presented.
If the profile has only an `eapconfig_endpoint` field, the .eap-config is downloaded
from that URL, without any authentication.  If the profile also has an `token_endpoint` and `authorization_endpoint`,
the application will start an OAuth Authorization Code Flow, and then download the
.eap-config file from `eapconfig_endpoint` and presenting the access token as a Bearer
token in an authorization header.

If the downloaded .eap-config file contains enough credentials to configure a Wi-Fi network,
the user is not prompted.  Otherwise, the user is presented with a user/pass screen.
This screen can impose requirements to the username set in the .eap-config,
such as that the username must end with a certain realm.

When both an .eap-config and sufficient credentials are available, the native code
is called with a JSON object, containing all relevant fields from the .eap-config
and the entered credentials, if any.

## The interaction between Ionic and native code

[_The developers have written a more technical document on this_](geteduroam/plugins/wifi-eap-configurator/README.md)

The native code is called using an Ionic-specific call.  The TypeScript code calls
a native function, and [**expects a single value back**](geteduroam/src/providers/geteduroam-services/geteduroam-services.ts).
The native code can return multiple times (through a function call, not an actual return),
but subsequent returns will be ignored by the TypeScript code.
Additionally, Ionic allows to return success and failure states from the native code back
to the TypeScript, alongside a custom JSON object, but in the way this project is implemented,
we do not use the failure states.  We always return success, with a boolean field
in the JSON payload, `success`, that indicated if things actually went well.

## iOS flow

`configureAP` is called by Ionic, with a `call` argument that contains information about the call.
We get all relevant information from the call (SSID, certificates, identities, etc.) and call the function createNetworkConfigurations to build an array of [`NEHotspotConfiguration`](https://developer.apple.com/documentation/networkextension/nehotspotconfiguration) objects.  The reason we build an array is that .eap-config
can handle multiple SSIDs and Passpoint profiles in one container, but `NEHotspotConfiguration` cannot;
in other words, we get a `NEHotspotConfiguration` object for each SSID we want to configure,
and an additional one for Passpoint (if applicable).

The `NEHotspotConfiguration` object is built by copying the textual values over
in the object (username, password, SSID) and by importing certificate material
into the operating system's KeyChain, which gives us
[`SecKeychainItem`](https://developer.apple.com/documentation/security/seckeychainitem)s.

When the `NEHotspotConfiguration` objects are built, they are installed in order,
with any Passpoint configuration first. The reason the Passpoint configuration
should come first is that each installation is prompted to the user.
When the user first is asked to install a "Hotspot configuration", it will be
less confusing to answer it as the first question than as the last question.

## Android flow

### Android APIs

Android has multiple methods to install Wi-Fi configuration profiles.
Each method has advantages and disadvantages.  We have made an
[`AbstractConfigurator`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/AbstractConfigurator.java)
class that contains the common interface for configuring Wi-Fi on Android, and we have made an
[`WifiProfile`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/WifiProfile.java)
class that contains all information that is relevant to configuring a Wi-Fi network on Android.
It has a constructor that reads a JSON payload (created in the Ionic code),
checks all values and stores all data in the class, or throws an exception if anything is off.
This way, was the idea, we can simply say [configurator.install(wifiProfile)](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/WifiEapConfigurator.java#L137),
but it turned out a bit more complicated than that.

Android has multiple native objects for configuring Wi-Fi, but some objects can be used for multiple installation methods.
So we implemented different builer methods on `WifiProfile`, such as `buildEnterpriseConfig` and `buildPasspointConfig` for building configuration objects to be used in a `WifiConfiguration`,
and `buildSSIDSuggestions` and `buildPasspointSuggestion` for building `WifiNetworkSuggestion`s from these configuration objects. 

The following table shows the different configuration methods and which API they require.

| Configuration method | Configuration object | Our implementation | API requirement | Remove/update network |
|:---------------------|:---------------------|:-------------------|----------------:|:----------------------|
| [`WifiManager`](https://developer.android.com/reference/android/net/wifi/WifiManager) | [`WifiConfiguration`](https://developer.android.com/reference/android/net/wifi/WifiConfiguration) | [`LegacyConfigurator`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/LegacyConfigurator.java) | API <= 28 | YES |
| [`ConnectivityManager`](https://developer.android.com/reference/android/net/ConnectivityManager) | [`NetworkRequest`](https://developer.android.com/reference/android/net/NetworkRequest) † | [`RequestConfigurator`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/RequestConfigurator.java) | API >= 21 | N/A |
| [`WifiManager`](https://developer.android.com/reference/android/net/wifi/WifiManager) | [`WifiNetworkSuggestion`](https://developer.android.com/reference/android/net/wifi/WifiNetworkSuggestion) | [`SuggestionConfigurator`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/SuggestionConfigurator.java) | ‡ API >= 30 | YES |
| [`Intent`](https://developer.android.com/reference/android/content/Intent) | [`WifiNetworkSuggestion`](https://developer.android.com/reference/android/net/wifi/WifiNetworkSuggestion) | [`IntentConfigurator`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/IntentConfigurator.java) | API >= 30 | Only update with user consent |

* † _This method configures "temporary" networks, the configuration cannot be saved persistently_
* ‡ _The API is available from API 29, but it asks for consent in a confusing way, which is fixed in API 30_

WifiManager with WifiConfiguration is the special case here; **it is the most user friendly and the most flexible**,
but it has a maximum API version, after which it is deprecated and won't work anymore.
The call does work on newer Android versions, **as long as the `targetSDK` is not set higher than version 28**.
It is not possible to submit apps to the Play Store with an `targetSDK` lower than 30 (may be higher now),
so using this workaround is out of the question for the Play Store.  **It might still be feasible for alternative stores**.

To make things even more complicated, WifiManager with WifiConfiguration works until API 28 for SSIDs,
but it works until API 29 for Passpoint configurations.  From API 30, this method is fully deprecated,
and only newer methods will work.

In [WifiEapConfigurator](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/WifiEapConfigurator.java),
in the `configureAP(WifiProfile)` function, **we try to find the oldest API that we still are allowed to use**,
and we configure Wi-Fi with that.

#### [LegacyConfigurator](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/LegacyConfigurator.java)

This configurator is the most straightforward and easy to use.  Sadly, it's deprecated, so we cannot use this in most cases.

Networks can be created and updated without user interaction.  Networks appear as configured in the UI.
When the app is uninstalled, the networks are removed.
It is not possible to enumerate networks the user already has, but existing networks can be overridden.

#### [`NetworkRequest`](https://developer.android.com/reference/android/net/NetworkRequest)

This is used to temporary connect to a network.  It might be useful for an app where some larger amount of data must be downloaded,
or some secured data must be retrieved from a network, but you don't want to allow the user full access to that network.

In the eduroam context, this is not so useful.

#### [`WifiNetworkSuggestion`](https://developer.android.com/reference/android/net/wifi/WifiNetworkSuggestion)

This configurator works similar to iOS from API 30, the user is asked for consent to install a new network.
The network is "managed", and will not appear as configured in the Wi-Fi settings, but it can be connected to.

Networks can be created and updated with user consent.  They can be removed without user consent.
Networks appear as unconfigured in the UI.  When the app is uninstalled, the networks are removed.

**On API 29, the consent dialog only appears when the eduroam network is the only known Wi-Fi network in the vicinity**.
Otherwise, the network looks and behaves as being unconfigured.  This causes confusion when the user taps the network
in settings, and is presented with the same configuration dialog as if they never ran the app.

#### [`Intent`](https://developer.android.com/reference/android/content/Intent)

This configurator also works similar to iOS.  It seems like this method does not work for API 29 (only tested one device where nothing happened),
but it does work on API 30.  This API adds the network as if the user created the network manually, so it is closest to the `LegacyConfigurator`.
The most important difference is that the network is not linked to the app after it's created; it's really as if the user created it themselves.

Networks can be created and updated with user consent.  They cannot be removed.
Networks appear as unconfigured in the UI.  When the app is uninstalled, the networks stay in place.

There is a problem in the current codebase, where we don't have an `Activity` object available when we configure the network,
so the way we configure it is by running `context.startActivity(intent);`, which is not the correct way to do it,
but we don't know how to get an `Activity` object from Ionic.  This has the effect that the consent dialog reads

> null wants to add eduroam

### Juggling Ionic

The workflow with Ionic is that a Java function (in our case [`configureAP`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/WifiEapConfigurator.java))
is called with a `PluginCall` object, that we're eventually supposed to call `success(JSObject)` on - also in the case of an error.

In the code that the original developers had provided, there were many cases where `success` was called on an error,
but execution was not halted.  In some cases, this could result in an error being shown in the UI, but everything working anyway.

To make the flow easier to reason about, all Ionic specific code involved in configuring a network is concentrated in [`WifiEapConfigurator`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/WifiEapConfigurator.java).
Error flow no longer uses `success` calls halfway through the code, instead [`NetworkException`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/exception/NetworkException.java)s
and [EapConfigException](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/exception/EapConfigException.java)s
are thrown when an error occurs, and caught in the same function that received the `PluginCall`.  The `PluginCall` is not passed around.

Because of this, the basic flow is:

* Ionic calls `configureAP(PluginCall)`
* `configureAP(PluginCall)` extracts JSON from call and passes to `configureAP(JSONObject)`
** When `configureAP(JSONObject)` returns, a the callback is called with success status
** When `configureAP(JSONObject)` throws an exception, the callback is called with an appropriate error string
* `configureAP(JSONObject)` creates a new [`WifiProfile`](geteduroam/plugins/wifi-eap-configurator/android/src/main/java/com/emergya/wifieapconfigurator/config/WifiProfile.java) object, and passes it to `configureAP(WifiProfile)`
** `WifiProfile` will throw an exception in its constructor if anything is wrong with the values it received
** If `WifiProfile` does not throw an exception in the constructor, the configuration is sane
* `configureAP(WifiProfile)` will attempt to configure the network using the best method available

### Notifications

TODO
