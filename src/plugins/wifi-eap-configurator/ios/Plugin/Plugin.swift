import Foundation
import Capacitor

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(WifiEapConfigurator)
public class WifiEapConfigurator: CAPPlugin {
    
    @objc func test(_ call: CAPPluginCall) {
        guard let ssid = call.getString("ssid") else {
           return call.reject("Debes enviar algún parametro")
        }
        
        call.success([
            "ssid": ssid
        ])
    }
}
