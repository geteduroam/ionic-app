#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Define the plugin using the CAP_PLUGIN Macro, and
// each method the plugin supports using the CAP_PLUGIN_METHOD macro.
CAP_PLUGIN(WifiEapConfigurator, "WifiEapConfigurator",
           CAP_PLUGIN_METHOD(configureAP, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isNetworkAssociated, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(isConnectedSSID, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(removeNetwork, CAPPluginReturnPromise);
)
