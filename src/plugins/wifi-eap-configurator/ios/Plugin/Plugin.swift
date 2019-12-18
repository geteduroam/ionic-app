import Foundation
import Capacitor
import NetworkExtension
import SystemConfiguration.CaptiveNetwork
import UIKit

@objc(WifiEapConfigurator)
public class WifiEapConfigurator: CAPPlugin {

    func getAuthType(authType : Int) -> NEHotspotEAPSettings.TTLSInnerAuthenticationType? {
        switch authType {
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
    @objc func connectAP(_ call: CAPPluginCall){
        guard let ssid = call.getString("ssid") else {
            return call.reject("You must provide a SSID.")
        }
        
        guard let config = call.get("config", NEHotspotConfiguration.self) else {
            return call.reject("You must provide a configuration")
        }
        
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
    
    @available(iOS 12.0, *)
    @objc func configureAP(_ call: CAPPluginCall) -> Any? {
        
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
        
        let eapSettings = NEHotspotEAPSettings()
        eapSettings.isTLSClientCertificateRequired = true
        eapSettings.supportedEAPTypes = [eapType]
        eapSettings.ttlsInnerAuthenticationType = self.getAuthType(authType: authType)!
        eapSettings.trustedServerNames = [server]
        eapSettings.username = username
        eapSettings.password = password
        
        if call.getString("caCertificate") != nil {
            
            if let certificate = call.getString("caCertificate") {
                if addCertificate(certName: "Certificate " + server, certificate: certificate)
                {
                    
                    let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                                   kSecAttrLabel as String: "Certificate " + server,
                                                   kSecReturnRef as String: kCFBooleanTrue]
                    var item: CFTypeRef?
                    let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                    guard status == errSecSuccess else { return false }
                    let savedCert = item as! SecCertificate
                    
                    eapSettings.setTrustedServerCertificates([savedCert])
                }
            }
        }
        
        
        let config = NEHotspotConfiguration(ssid: ssid, eapSettings: eapSettings)
        
        return config
    }
    
    func addCertificate(certName: String, certificate: String) -> Bool {
        let certBase64 = certificate
        
        let data = Data(base64Encoded: certBase64)!
                
        let certRef = SecCertificateCreateWithData(kCFAllocatorDefault, data as CFData)!
        
        let addquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
        kSecValueRef as String: certRef,
//        kSecAttrAccessGroup as String: "$(AppIdentifierPrefix)$(TeamIdentifierPrefix)com.apple.networkextensionsharing",
        kSecAttrLabel as String: certName]
        
        let status = SecItemAdd(addquery as CFDictionary, nil)
        guard status == errSecSuccess else {
            if status == errSecDuplicateItem {
                
                let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                kSecAttrLabel as String: certName,
//                kSecAttrAccessGroup as String: "$(AppIdentifierPrefix)$(TeamIdentifierPrefix)com.apple.networkextensionsharing",
                kSecReturnRef as String: kCFBooleanTrue]
                
                var item: CFTypeRef?
                let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                
                let statusDelete = SecItemDelete(getquery as CFDictionary)
                
                guard statusDelete == errSecSuccess || status == errSecItemNotFound else { return false }
                
                return addCertificate(certName: certName, certificate: certificate)
                
            }
            
            return false
        }
        
        if status == errSecSuccess {
            return true
        }
        else {
            return false
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
