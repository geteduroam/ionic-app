import Foundation
import Capacitor
import NetworkExtension
import SystemConfiguration.CaptiveNetwork
import UIKit
import Security


@objc(WifiEapConfigurator)
public class WifiEapConfigurator: CAPPlugin {

    
    func getAuthType(authType : Int) -> NEHotspotEAPSettings.TTLSInnerAuthenticationType? {
        switch authType {
        case 1:
            return .eapttlsInnerAuthenticationCHAP
        case 2:
            return .eapttlsInnerAuthenticationEAP
        case 3:
            return .eapttlsInnerAuthenticationMSCHAP
        case 4:
            return .eapttlsInnerAuthenticationMSCHAPv2
        case 5:
            return .eapttlsInnerAuthenticationPAP
        default:
            return nil
        }
    }
    
    @available(iOS 12.0, *)
    @objc func configureAP(_ call: CAPPluginCall) {
        
        guard let ssid = call.getString("ssid") else {
           return call.reject("You must provide a SSID.")
        }
        
        guard let username = call.getString("username") else {
            return call.reject("You must provide an username.")
        }
        
        guard let password = call.getString("password") else {
            return call.reject("You must provide a password.")
        }
        
        guard let eapType = call.get("eap", NSNumber.self) else {
            return call.reject("You must provide an EAP Type.")
        }
        
        guard let server = call.getString("servername") else {
            return call.reject("You must provide a servername.")
        }
        
        guard let authType = call.getInt("auth") else {
            return call.reject("You must provide a authentication type.")
        }
        
        guard let certificate = call.getString("caCertificate") else {
            return call.reject("You must provide a authentication certificate.")
         }
        
        /*
          13 = EAP-TLS
          21 = EAP-TTLS
          25 = EAP-PEAP
          43 = EAP-FAST
        */
        
        let eapSettings = NEHotspotEAPSettings()
        eapSettings.isTLSClientCertificateRequired = true
        eapSettings.supportedEAPTypes = [eapType]
        eapSettings.ttlsInnerAuthenticationType = self.getAuthType(authType: authType)!
        eapSettings.trustedServerNames = [server]
        eapSettings.username = username
        eapSettings.password = password
              
        let config = NEHotspotConfiguration(ssid: ssid, eapSettings: eapSettings)
        config.joinOnce = false
        config.lifeTimeInDays = 1
        
//        let mainbun = Bundle.main.path(forResource: "cppm-eval", ofType: "cer")
//        let mainbun = Bundle.main.path(forResource: "RADIUS.US.ES", ofType: "cer")
//        let dataCert: NSData = NSData(contentsOfFile: mainbun!)!
//        var turntocert: SecCertificate = SecCertificateCreateWithData(kCFAllocatorDefault, dataCert as CFData)!
//
//
//        eapSettings.setTrustedServerCertificates([turntocert])
  
        
        
        let mainbun = Bundle.main.path(forResource: "RADIUS.US.ES", ofType: "cer")

        
        NEHotspotConfigurationManager.shared.apply(config) { (error) in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                if self.currentSSIDs().first == ssid {
                    call.success([
                        "message": "The user has been logged into the network successfully.",
                        "ssid": ssid,
                    ])
                } else {
                    call.reject("Unable to connect to " + ssid + ". Please try again later.")
                }
            }
        }
    }
    
    func currentSSIDs() -> [String] {
        guard let interfaceNames = CNCopySupportedInterfaces() as? [String] else {
            return []
        }
        
        return interfaceNames.compactMap { name in
            guard let info = CNCopyCurrentNetworkInfo(name as CFString) as? [String:AnyObject] else {
                return nil
            }
            guard let ssid = info[kCNNetworkInfoKeySSID as String] as? String else {
                return nil
            }
            return ssid
        }
    }
}
