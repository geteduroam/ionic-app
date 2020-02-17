import Foundation
import Capacitor
import NetworkExtension
import SystemConfiguration.CaptiveNetwork
import UIKit

@available(iOS 13.0, *)
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
    
    func getEAPType(eapType: Int) -> NSNumber? {
        switch eapType {
        case 43:
            return NSNumber(value: NEHotspotEAPSettings.EAPType.EAPFAST.rawValue)
        case 29:
            return NSNumber(value: NEHotspotEAPSettings.EAPType.EAPPEAP.rawValue)
        case 13:
            return NSNumber(value: NEHotspotEAPSettings.EAPType.EAPTLS.rawValue)
        case 21:
            return NSNumber(value: NEHotspotEAPSettings.EAPType.EAPTTLS.rawValue)
        default:
            return nil
        }
    }
    
    var eapCertificates : [SecCertificate]? = nil
    
    
    
    @objc func configureAP(_ call: CAPPluginCall) {
        guard let ssid = call.getString("ssid") else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.ssid.missing",
                "success": false,
            ])
        }
        
        guard let eapType = call.get("eap", Int.self) else {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.auth.invalid",
                "success": false,
            ])
        }
        
        
        
        
        let eapSettings = NEHotspotEAPSettings()
        eapSettings.isTLSClientCertificateRequired = true
        eapSettings.supportedEAPTypes = [getEAPType(eapType: eapType)!]
        
        
        if let server = call.getString("servername"){
            eapSettings.trustedServerNames = [server]
        }
        
        
        if let anonymous = call.getString("anonymous") {
            eapSettings.outerIdentity = anonymous //Necesario para clientCertificate (no se si para los demás)
        }
        
        var username:String? = nil
        var password:String? = nil
        var authType:Int? = nil
        
        var certificates: [SecCertificate]? = nil
        
        if let clientCertificate = call.getString("clientCertificate"){
            if let passPhrase = call.getString("passPhrase"){
                if let queries = addClientCertificate(certificate: clientCertificate, passPhrase: passPhrase) {
                    certificates = []
                    
                    for query in ((queries as? [[String: Any]])?.enumerated())! {
                        
                        var item: CFTypeRef?
                        let statusCertificate = SecItemCopyMatching(query as! CFDictionary, &item)
                        
                        guard statusCertificate == errSecSuccess else {
                            return call.success([
                                "message": "plugin.wifieapconfigurator.error.clientIdentity.missing",
                                "success": false,
                            ])
                        }
                        
                        let certificate = item as! SecCertificate
                        
                        certificates?.append(certificate)
                        
                    }
                    
                    eapSettings.setTrustedServerCertificates(certificates!)
                }else {
                    return call.success(["messsage": "plugin.wifieapconfigurator.error.clientCertificate.couldNotBeAdded",
                                         "success": false])
                }
                
                if let identity = addClientIdentity(certName: "client" + ssid, certificate: clientCertificate, password: passPhrase)
                {
                    let id = identity as! SecIdentity
                    eapSettings.setIdentity(id)
                    eapSettings.isTLSClientCertificateRequired = true
                }
                else {
                    return call.success(["messsage": "plugin.wifieapconfigurator.error.identity.couldNotBeAdded",
                                         "success": false])
                }
            }else{
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.passPhrase.missing",
                    "success": false,
                ])
            }
        }
        else{
            if call.getString("username") != nil && call.getString("username") != "" {
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
                if (addCertificate(certName: "caCert" + ssid, certificate: certificate) as? Bool ?? false)
                {
                    let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                                   kSecAttrLabel as String: "caCert" + ssid,
                                                   kSecReturnRef as String: kCFBooleanTrue]
                    var item: CFTypeRef?
                    let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                    guard status == errSecSuccess else { return }
                    let savedCert = item as! SecCertificate
                    
                    certificates?.append(savedCert)
                    
                    if let certificates = certificates {
                        eapSettings.setTrustedServerCertificates(certificates)
                    }
                }
                else {
                    return call.success(addCertificate(certName: "caCert" + ssid, certificate: certificate) as! Dictionary<String, AnyObject>)
                }
            }
        }
        
        let config = NEHotspotConfiguration(ssid: ssid, eapSettings: eapSettings)
        NEHotspotConfigurationManager.shared.apply(config) { (error) in
            if let error = error {
                if error.code == 13 {
                    call.success([
                        "message": "plugin.wifieapconfigurator.error.network.alreadyAssociated",
                        "success": false,
                    ])
                }
                
                if error.code == 7 {
                    call.success([
                        "message": "plugin.wifieapconfigurator.error.network.userCancelled",
                        "success": false,
                    ])
                }
            } else {
                if self.currentSSIDs().first == ssid {
                    call.success([
                        "message": "plugin.wifieapconfigurator.success.network.linked",
                        "success": true,
                    ])
                } else {
                    call.success([
                        "message": "plugin.wifieapconfigurator.error.network.notLinked",
                        "success": false,
                    ])
                }
            }
        }
    }
    
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
            
            if !iterator && ssids.count < 1 {
                call.success([
                    "message": "plugin.wifieapconfigurator.error.network.noNetworksFound",
                    "success": false,
                    "overridable": true
                ])
            }
                
            else if(iterator){
                call.success([
                    "message": "plugin.wifieapconfigurator.error.network.alreadyAssociated",
                    "success": false,
                    "overridable": true
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
            
            if foundNetwork {
                NEHotspotConfigurationManager.shared.removeConfiguration(forSSID: ssidToCheck)
                var removed = true
                NEHotspotConfigurationManager.shared.getConfiguredSSIDs { (ssids) in
                    for ssid in ssids {
                        if ssidToCheck == ssid {
                            removed = false
                        }
                    }
                    
                    let message = removed ?  "plugin.wifieapconfigurator.success.network.removed": "plugin.wifieapconfigurator.error.network.removed"
                    call.success([
                        "message": message,
                        "success": removed
                    ])
                }
            }
            else{
                call.success([
                    "message": "plugin.wifieapconfigurator.error.network.notFound",
                    "success": false
                ])
            }
        }
        
    }
    
    func cleanCertificate(certificate: String) -> String{
        let certDirty = certificate
        
        let certWithoutHeader = certDirty.replacingOccurrences(of: "-----BEGIN CERTIFICATE-----\n", with: "")
        let certWithoutBlankSpace = certWithoutHeader.replacingOccurrences(of: "\n", with: "")
        let certClean = certWithoutBlankSpace.replacingOccurrences(of: "-----END CERTIFICATE-----", with: "")
        
        return certClean
    }
    
    
    func addCertificate(certName: String, certificate: String) -> Any? {
        let certBase64 = certificate
        if let certDecoded = certBase64.base64Decoded() {
            let certDecodedClean = cleanCertificate(certificate: certDecoded)
            if let data = Data(base64Encoded: certDecodedClean) {
                if let certRef = SecCertificateCreateWithData(kCFAllocatorDefault, data as CFData) {
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
                            //                            return addCertificate(certName: certName, certificate: certificate)
                        }
                        return false
                    }
                    
                    if status == errSecSuccess {
                        return true
                    }
                    else {
                        return false
                    }
                } else {
                    return [
                        "message": "plugin.wifieapconfigurator.error.network.certificateRefConvertionFailed",
                        "success": false,
                    ]
                }
            } else {
                return [
                    "message": "plugin.wifieapconfigurator.error.network.certificateDataFailed",
                    "success": false,
                ]
            }
        } else {
            return [
                "message": "plugin.wifieapconfigurator.error.network.couldNotDecodeCertificate",
                "success": false,
            ]
        }
    }
    
    func eliminarCertificadosPrevios(ssid: String) -> Any? {
        
        //La consulta
        let getQueryCertificate: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                                  kSecAttrLabel as String: "Certificate " + ssid,
                                                  kSecReturnRef as String: kCFBooleanTrue]
        
        //La referencia
        var itemCertificate: CFTypeRef?
        
        //La respuesta, si es 0 funcionó y se lo pasa a la referencia
        let statusCertificate = SecItemCopyMatching(getQueryCertificate as CFDictionary, &itemCertificate)
        
        
        //cuida de que funcione
        guard statusCertificate == errSecSuccess else { return false }
        
        //Lo elimina
        let statusCertificateDelete = SecItemDelete(getQueryCertificate as CFDictionary)
        
        //Cuida de que funcione el eliminar, si funciona continua el flujo
        guard statusCertificateDelete == errSecSuccess else { return false }
        
        //El item del identity
        var itemIdentity: CFTypeRef?
        
        //La consulta del identity
        let getQueryIdentity: [String: Any] = [kSecClass as String: kSecClassIdentity,
                                               kSecAttrLabel as String: "ce" + ssid,
                                               kSecReturnRef as String: kCFBooleanTrue]
        
        //Busca el identity, si funcionó es 0, y se lo pasa a la referencia
        let statusIdentityFound = SecItemCopyMatching(getQueryIdentity as CFDictionary, &itemIdentity)
        
        //cuida de que funcione el buscar
        guard statusIdentityFound == errSecSuccess else { return false }
        
        
        //Lo elimina
        let statusIdentityDelete = SecItemDelete(getQueryIdentity as CFDictionary)
        
        //verifica que lo eliminó
        guard statusIdentityDelete == errSecSuccess else { return false }
        
        //Si lo eliminó retorna true.
        return true
    }
    
    func addClientCertificate(certificate: String, passPhrase: String) -> Any? {
        let options = [ kSecImportExportPassphrase as String: passPhrase ]
        var rawItems: CFArray?
        let certBase64 = certificate
        if let data = Data(base64Encoded: certBase64) {
            let statusImport = SecPKCS12Import(data as CFData, options as CFDictionary, &rawItems)
            guard statusImport == errSecSuccess else { return false }
            let items = rawItems! as! Array<Dictionary<String, Any>>
            let firstItem = items[0]
            if let chain = firstItem[kSecImportItemCertChain as String] as! [SecCertificate]? {
                var certificateQueries : [[String: Any]] = []
                
                for (index, cert) in chain.enumerated() {
                    
                    let certData = SecCertificateCopyData(cert) as Data
                    
                    if let certificateData = SecCertificateCreateWithData(nil, certData as CFData) {
                        let addquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                                       kSecValueRef as String:  certificateData,
                                                       kSecAttrLabel as String: "getEduroamCertificate" + "\(index)"]
                        
                        let statusUpload = SecItemAdd(addquery as CFDictionary, nil)
                        
                        guard statusUpload == errSecSuccess else {
                            if statusUpload == errSecDuplicateItem {
                                let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                                               kSecAttrLabel as String: "getEduroamCertificate" + "\(index)",
                                    kSecReturnRef as String: kCFBooleanTrue]
                                
                                var item: CFTypeRef?
                                let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                                let statusDelete = SecItemDelete(getquery as CFDictionary)
                                guard statusDelete == errSecSuccess || status == errSecItemNotFound else { return false }
                                return addClientCertificate(certificate: certificate, passPhrase: passPhrase)
                                
                            }
                            return false
                        }
                        
                        certificateQueries.append(
                            [kSecClass as String: kSecClassCertificate,
                             kSecAttrLabel as String: "getEduroamCertificate" + "\(index)",
                                kSecReturnRef as String: kCFBooleanTrue])
                    }
                }
                return certificateQueries
            }
        } else {
            return nil
        }
        return nil
    }
    
    func addClientIdentity(certName: String, certificate: String, password: String) -> Any? {
        
        let options = [ kSecImportExportPassphrase as String: password ]
        var rawItems: CFArray?
        let certBase64 = certificate
        //        if let certDecoded = certBase64.base64Decoded() {
        //                        let certDecodedClean = cleanCertificate(certificate: certBase64)
        if let data = Data(base64Encoded: certBase64) {
            let statusImport = SecPKCS12Import(data as CFData,
                                               options as CFDictionary,
                                               &rawItems)
            guard statusImport == errSecSuccess else { return false }
            let items = rawItems! as! Array<Dictionary<String, Any>>
            let firstItem = items[0]
            if let identity = firstItem[kSecImportItemIdentity as String] as! SecIdentity? {
                
                let addquery: [String: Any] = [kSecValueRef as String: identity,
                                               kSecAttrLabel as String: certName]
                let status = SecItemAdd(addquery as CFDictionary, nil)
                guard status == errSecSuccess else {
                    if status == errSecDuplicateItem {
                        let getquery: [String: Any] = [kSecValueRef as String: identity,
                                                       kSecAttrLabel as String: certName,
                                                       kSecReturnRef as String: kCFBooleanTrue]
                        var item: CFTypeRef?
                        let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                        let statusDelete = SecItemDelete(getquery as CFDictionary)
                        guard statusDelete == errSecSuccess || status == errSecItemNotFound else { return false }
                        return addClientIdentity(certName: certName, certificate: certificate, password: password)
                    }
                    
                    return false
                }
                
                return identity
                
            }
            
            return nil
        } else {
            return nil
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

extension Error {
    var code: Int { return (self as NSError).code }
    var domain: String { return (self as NSError).domain }
}

extension String {
    func base64Encoded() -> String? {
        return data(using: .utf8)?.base64EncodedString()
    }
    
    func base64Decoded() -> String? {
        guard let data = Data(base64Encoded: self) else { return nil }
        return String(data: data, encoding: .utf8)
    }
}
