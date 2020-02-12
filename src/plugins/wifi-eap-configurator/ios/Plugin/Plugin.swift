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
    @objc func configureAP(_ call: CAPPluginCall) {
        guard let ssid = call.getString("ssid") else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.ssid.missing",
                "success": false,
            ])
        }
        
        guard let eapType = call.get("eap", NSNumber.self) else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.auth.invalid",
                "success": false,
            ])
        }
        
        
        let eapSettings = NEHotspotEAPSettings()
        eapSettings.isTLSClientCertificateRequired = true
        eapSettings.supportedEAPTypes = [eapType]
        
        if let server = call.getString("servername"){
            eapSettings.trustedServerNames = [server]
        }
        if let anonymous = call.getString("anonymous") {
            eapSettings.outerIdentity = anonymous
        }
        
        var username:String? = nil
        var password:String? = nil
        var authType:Int? = nil
        
        if let clientCertificate = call.getString("clientCertificate"){
            if let passPhrase = call.getString("passPhrase"){
                if addClientCertificate(certName: "ce" + ssid, certificate: clientCertificate, password: passPhrase)
                {
                    //                    let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                    //                                                   kSecAttrLabel as String: "clientcertificate" + ssid,
                    //                                                   kSecReturnRef as String: kCFBooleanTrue]
                    //                    var item: CFTypeRef?
                    //                    let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                    //                    guard status == errSecSuccess else {
                    //                        return call.success([
                    //                            "message": "plugin.wifieapconfigurator.error.clientCertificate.missing",
                    //                            "success": false,
                    //                        ])
                    //                    }
                    //                    let savedCert = item as! SecCertificate
                    //                    var identity: SecIdentity?
                    //                    let statusIdentity = SecIdentityCreateWithCertificate(nil, savedCert, &identity)
                    
                    let getquery: [String: Any] = [kSecClass as String: kSecClassIdentity,
                                                   kSecAttrLabel as String: "ce" + ssid,
                                                   kSecReturnRef as String: kCFBooleanTrue]
                    
                    
                    var item: CFTypeRef?
                    let statusIdentity = SecItemCopyMatching(getquery as CFDictionary, &item)
                    
                    
                    
                    
                    guard statusIdentity == errSecSuccess else {
                        return call.success([
                            "message": "plugin.wifieapconfigurator.error.clientIdentity.missing",
                            "success": false,
                        ])
                    }
                    
                    let identity = item as! SecIdentity
                    eapSettings.setIdentity(identity)
                }
            }else{
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.passPhrase.missing",
                    "success": false,
                ])
            }
        }
        else{
            if call.getString("username") != nil && call.getString("username") != ""{
                username = call.getString("username")
            } else {
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.username.missing",
                    "success": false,
                ])
            }
            
            if call.getString("password") != nil && call.getString("password") != ""{
                password = call.getString("password")
            }
            else{
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.password.missing",
                    "success": false,
                ])
            }
            
            if call.getInt("auth") != nil{
                authType = call.getInt("auth")
            }
            else{
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.auth.missing",
                    "success": false,
                ])
            }
            
            eapSettings.username = username ?? ""
            eapSettings.password = password ?? ""
            eapSettings.ttlsInnerAuthenticationType = self.getAuthType(authType: authType ?? 0)!
        }
        
        if call.getString("caCertificate") != nil && call.getString("caCertificate") != "" {
            if let certificate = call.getString("caCertificate") {
                if addCertificate(certName: "Certificate " + ssid, certificate: certificate)
                {  let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                                  kSecAttrLabel as String: "Certificate " + ssid,
                                                  kSecReturnRef as String: kCFBooleanTrue]
                    var item: CFTypeRef?
                    let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                    guard status == errSecSuccess else { return }
                    let savedCert = item as! SecCertificate
                    eapSettings.setTrustedServerCertificates([savedCert])
                }
            }
        }        
        
        let config = NEHotspotConfiguration(ssid: ssid, eapSettings: eapSettings)
        NEHotspotConfigurationManager.shared.apply(config) { (error) in
            if let error = error {
                call.success([
                    "message": error.localizedDescription,
                    "success": false])
            } else {
                if self.currentSSIDs().first == ssid {
                    call.success([
                        "message": "plugin.wifieapconfigurator.success.network.linked",
                        "success": true,
                    ])
                } else {
                    call.success([
                        "message": "plugin.wifieapconfigurator.error.network.notFound",
                        "success": false,
                    ])
                }
            }
        }
    }
    @available(iOS 12.0, *)
    @objc func isNetworkAssociated(_ call: CAPPluginCall) {
        guard let ssidToCheck = call.getString("ssid") else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.ssid.missing",
                "success": false,
            ])
        }
        var iterator = false
        NEHotspotConfigurationManager.shared.getConfiguredSSIDs { (ssids) in
            for ssid in ssids {
                if ssidToCheck == ssid {
                    iterator = true
                }
            }
            if(iterator){
                call.success([
                    "message": "plugin.wifieapconfigurator.error.network.alreadyAssociated",
                    "success": false,
                    "overridable": false
                ])
            }else{
                call.success([
                    "message": "plugin.wifieapconfigurator.success.network.missing",
                    "success": true
                ])
            }
        }
    }
    
    @objc func removeNetwork(_ call: CAPPluginCall) {
        guard let ssidToCheck = call.getString("ssid") else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.ssid.missing",
                "success": false,
            ])
        }
        var foundNetwork = false
        NEHotspotConfigurationManager.shared.getConfiguredSSIDs { (ssids) in
            for ssid in ssids {
                if ssidToCheck == ssid {
                    foundNetwork = true
                }
            }
        }
        
        if foundNetwork {
            NEHotspotConfigurationManager.shared.removeConfiguration(forSSID: ssidToCheck)
            var removed = true
            NEHotspotConfigurationManager.shared.getConfiguredSSIDs { (ssids) in
                for ssid in ssids {
                    if ssidToCheck == ssid {
                        removed = false
                    }
                }
            }
            
            let message = removed ?  "plugin.wifieapconfigurator.success.network.removed": "plugin.wifieapconfigurator.error.network.removed"
            call.success([
                "message": message,
                "success": removed
            ])
        }
        else{
            call.success([
                "message": "plugin.wifieapconfigurator.error.network.notFound",
                "success": false
            ])
        }
    }
    
    func addCertificate(certName: String, certificate: String) -> Bool {
        let certBase64 = certificate
        let data = Data(base64Encoded: certBase64)!
        let certRef = SecCertificateCreateWithData(kCFAllocatorDefault, data as CFData)!
        let addquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                       kSecValueRef as String: certRef,
                                       kSecAttrLabel as String: certName]
        let status = SecItemAdd(addquery as CFDictionary, nil)
        guard status == errSecSuccess else {
            if status == errSecDuplicateItem {
                let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                               kSecAttrLabel as String: certName,
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
    
    func addClientCertificate(certName: String, certificate: String, password: String) -> Bool {
        let options = [ kSecImportExportPassphrase as String: password ]
        var rawItems: CFArray?
        let certBase64 = certificate
        let data = Data(base64Encoded: certBase64)!
        let statusImport = SecPKCS12Import(data as CFData,
                                           options as CFDictionary,
                                           &rawItems)
        guard statusImport == errSecSuccess else { return false }
        let items = rawItems! as! Array<Dictionary<String, Any>>
        let firstItem = items[0]
        let identity = firstItem[kSecImportItemIdentity as String] as! SecIdentity?
        let addquery: [String: Any] = [kSecValueRef as String: identity,
                                       kSecAttrLabel as String: certName]
        let status = SecItemAdd(addquery as CFDictionary, nil)
        guard status == errSecSuccess else {
            if status == errSecDuplicateItem {
                let getquery: [String: Any] = [kSecAttrLabel as String: certName,
                                               kSecReturnRef as String: kCFBooleanTrue]
                var item: CFTypeRef?
                let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                let statusDelete = SecItemDelete(getquery as CFDictionary)
                guard statusDelete == errSecSuccess || status == errSecItemNotFound else { return false }
                return addClientCertificate(certName: certName, certificate: certificate, password: password)
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
    
    @objc func isConnectedSSID(_ call: CAPPluginCall) {
        guard let ssidToCheck = call.getString("ssid") else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.ssid.missing",
                "success": false,
            ])
        }
        guard let interfaceNames = CNCopySupportedInterfaces() as? [String] else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.network.notConnected",
                "success": false,
                "isConnected": false
            ])
        }
        for i in 0...interfaceNames.count {
            guard let info = CNCopyCurrentNetworkInfo(interfaceNames[i] as CFString) as? [String: AnyObject] else {
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.network.notConnected",
                    "success": false,
                    "isConnected": false
                ])
            }
            guard let ssid = info[kCNNetworkInfoKeySSID as String] as? String else {
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.network.notConnected",
                    "success": false,
                    "isConnected": false
                ])
            }
            return call.success([
                "message": "plugin.wifieapconfigurator.success.network.connected",
                "success": true,
                "isConnected": true
            ])
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
