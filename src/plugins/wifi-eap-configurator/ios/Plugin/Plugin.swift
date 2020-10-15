import Foundation
import Capacitor
import NetworkExtension
import SystemConfiguration.CaptiveNetwork
import UIKit
import CoreLocation

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
        case 25:
            return NSNumber(value: NEHotspotEAPSettings.EAPType.EAPPEAP.rawValue)
        case 13:
            return NSNumber(value: NEHotspotEAPSettings.EAPType.EAPTLS.rawValue)
        case 21:
            return NSNumber(value: NEHotspotEAPSettings.EAPType.EAPTTLS.rawValue)
        default:
            return nil
        }
    }

    func resetKeychain() {
        deleteAllKeysForSecClass(kSecClassGenericPassword)
        deleteAllKeysForSecClass(kSecClassInternetPassword)
        deleteAllKeysForSecClass(kSecClassCertificate)
        deleteAllKeysForSecClass(kSecClassKey)
        deleteAllKeysForSecClass(kSecClassIdentity)
    }

    func deleteAllKeysForSecClass(_ secClass: CFTypeRef) {
        let dict: [NSString : Any] = [kSecClass : secClass]
        let result = SecItemDelete(dict as CFDictionary)
        assert(result == noErr || result == errSecItemNotFound, "Error deleting keychain data (\(result))")
    }

    @objc func configureAP(_ call: CAPPluginCall) {
        let id = call.getString("id")!
        let ssid = call.getString("ssid") ?? ""
        let oid = call.getString("oid") ?? ""

        if (oid == "") && (ssid == "") {
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


        resetKeychain()

        let eapSettings = NEHotspotEAPSettings()
        eapSettings.isTLSClientCertificateRequired = false
        eapSettings.supportedEAPTypes = [getEAPType(eapType: eapType)!]


        if let server = call.getString("servername"){
            if server != "" {
                //eapSettings.trustedServerNames = [server]
                // supporting multiple CN
                let serverNames: [String]? = server.components(separatedBy: ";")
                eapSettings.trustedServerNames = serverNames!
            }
        }

        if let anonymous = call.getString("anonymous") {
            if anonymous != "" {
                eapSettings.outerIdentity = anonymous
            }
        }

        var username:String? = nil
        var password:String? = nil
        var authType:Int? = nil

        if let clientCertificate = call.getString("clientCertificate"){
            if let passPhrase = call.getString("passPhrase"){
                if let queries = addServerCertificate(certificate: clientCertificate, passPhrase: passPhrase) {

                    for (_, query) in ((queries as? [[String: Any]])?.enumerated())! {

                        var item: CFTypeRef?
                        let statusCertificate = SecItemCopyMatching(query as CFDictionary, &item)

                        guard statusCertificate == errSecSuccess else {
                            return call.success([
                                "message": "plugin.wifieapconfigurator.error.clientIdentity.missing",
                                "success": false,
                            ])
                        }
                    }
                }
                // TODO certName should be the CN of the certificate,
                // but this works as long as we have only one (which we currently do)
                if let identity = addClientCertificate(certName: "app.eduroam.geteduroam", certificate: clientCertificate, password: passPhrase)
                {
                    let id = identity as! SecIdentity
                    if (!eapSettings.setIdentity(id)) {
                        return call.success([
                            "message": "plugin.wifieapconfigurator.error.clientCert.refused",
                            "success": false,
                        ])
                    }
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
            if let certificatesString = call.getString("caCertificate") {
                // supporting multiple CAs
                let certificatesStrings = certificatesString.components(separatedBy: ";")
                var index: Int = 0
                var certificates = [SecCertificate]();
                certificatesStrings.forEach { caCertificateString in
                    // building the name for the cert that will be installed
                    let certName: String = "getEduroamCertCA" + String(index);
                    // adding the certificate
                    if (addCertificate(certName: certName, certificate: caCertificateString) as? Bool ?? false)
                    {
                        let getquery: [String: Any] = [kSecClass as String: kSecClassCertificate,
                                                       kSecAttrLabel as String: certName,
                                                       kSecReturnRef as String: kCFBooleanTrue]
                        var item: CFTypeRef?
                        let status = SecItemCopyMatching(getquery as CFDictionary, &item)
                        guard status == errSecSuccess else { return }
                        let savedCert = item as! SecCertificate
                        certificates.append(savedCert);
                    }
                    else {
                        // return call.success(addCertificate(certName: certName, certificate: caCertificateString) as! Dictionary<String, AnyObject>)
                    }
                    index += 1
                }
                eapSettings.setTrustedServerCertificates(certificates)
            }
        }

         var config:NEHotspotConfiguration
                // If HS20 was enabled
                if oid != "" {
                    var oidStrings: [String]?
                    oidStrings = oid.components(separatedBy: ";")
                    // HS20 object settings
                    let hs20 = NEHotspotHS20Settings(
                        domainName: id,
                        roamingEnabled: true)
                    hs20.roamingConsortiumOIs = oidStrings ?? [""];
                    config = NEHotspotConfiguration(hs20Settings: hs20, eapSettings: eapSettings)
                } else {
                    config = NEHotspotConfiguration(ssid: ssid, eapSettings: eapSettings)
                }
                // this line is needed in iOS 13 because there is a reported bug with iOS 13.0 until 13.1.0
                // https://developer.apple.com/documentation/networkextension/nehotspotconfiguration/2887518-joinonce
                config.joinOnce = false
                config.lifeTimeInDays = NSNumber(integerLiteral: 825)

               let options: [String: NSObject] = [kNEHotspotHelperOptionDisplayName : "Join our WIFI" as NSObject]
               let queue: DispatchQueue = DispatchQueue(label: "app.eduroam.geteduroam", attributes: DispatchQueue.Attributes.concurrent)

               NSLog("Started wifi list scanning.")

               NEHotspotHelper.register(options: options, queue: queue) { (cmd: NEHotspotHelperCommand) in
                 NSLog("Received command: \(cmd.commandType.rawValue)")
               }

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
                        let nsError = error as NSError
                        if nsError.domain == "NEHotspotConfigurationErrorDomain" {
                            if let configError = NEHotspotConfigurationError(rawValue: nsError.code) {
                                switch configError {
                                case .invalidWPAPassphrase:
                                    print("password error: \(error.localizedDescription)")
                                case .invalid, .invalidSSIDPrefix, .invalidSSID, .invalidWEPPassphrase,
                                     .invalidEAPSettings, .invalidHS20Settings, .invalidHS20DomainName, .userDenied, .pending, .systemConfiguration, .unknown, .joinOnceNotSupported, .alreadyAssociated, .applicationIsNotInForeground, .internal:
                                    print("other error: \(error.localizedDescription)")
                                @unknown default:
                                    print("later added error: \(error.localizedDescription)")
                                }
                            }
                        } else {
                            print("some other error: \(error.localizedDescription)")
                        }
                    } else {
                            call.success([
                                "message": "plugin.wifieapconfigurator.success.network.linked",
                                "success": true,
                            ])
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
        // This function cleans up certificates that are base64-encoded PEM files,
        // so the ----BEGIN stanza was base64 encoded.  The PoC geteduroam server did this.
        // CAT doesn't, and the new geteduroam server doesn't either,
        // but keep this code here because it is valid (abeit not a good idea)
        // to present certificates this way, so let's keep supporting it.

        let certDirty = certificate

        let certWithoutHeader = certDirty.replacingOccurrences(of: "-----BEGIN CERTIFICATE-----\n", with: "")
        let certWithoutBlankSpace = certWithoutHeader.replacingOccurrences(of: "\n", with: "")
        let certClean = certWithoutBlankSpace.replacingOccurrences(of: "-----END CERTIFICATE-----", with: "")

        return certClean
    }


    func addCertificate(certName: String, certificate: String) -> Any? {
        let certBase64 = certificate
        var error: Unmanaged<CFError>?

        let attributesRSAPub: [String:Any] = [
            kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
            kSecAttrKeyClass as String: kSecAttrKeyClassPublic,
            kSecAttrKeySizeInBits as String: 2048,
            kSecAttrIsPermanent as String: false
        ]
        if var data = Data(base64Encoded: certBase64, options: Data.Base64DecodingOptions.ignoreUnknownCharacters) {
            let publicKeySec = SecKeyCreateWithData(data as CFData, attributesRSAPub as CFDictionary, &error)
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
    }

    func addServerCertificate(certificate: String, passPhrase: String) -> Any? {
        let options = [ kSecImportExportPassphrase as String: passPhrase ]
        var rawItems: CFArray?
        let certBase64 = certificate
        /*If */let data = Data(base64Encoded: certBase64)!

        let statusImport = SecPKCS12Import(data as CFData, options as CFDictionary, &rawItems)
        guard statusImport == errSecSuccess else { return false }
        let items = rawItems! as! Array<Dictionary<String, Any>>
        let firstItem = items[0]
        let identity = firstItem[kSecImportItemIdentity as String] as! SecIdentity?
        let trust = firstItem[kSecImportItemTrust as String] as! SecTrust?
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
                            return addServerCertificate(certificate: certificate, passPhrase: passPhrase)

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

        return nil
    }

    func addClientCertificate(certName: String, certificate: String, password: String) -> Any? {

        let options = [ kSecImportExportPassphrase as String: password ]
        var rawItems: CFArray?
        let certBase64 = certificate
        /*If */let data = Data(base64Encoded: certBase64)!
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
                    return addClientCertificate(certName: certName, certificate: certificate, password: password)
                }

                return false
            }

            return identity

        }

        return nil
    }

    @objc func isConnectedSSID(_ call: CAPPluginCall) {
        guard call.getString("ssid") != nil else {
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
        let infoNetwork = SSID.fetchNetworkInfo()
        for i in 0...interfaceNames.count {
        let test = interfaceNames[i] as String;
            guard (test == infoNetwork?.first?.ssid)  else {
                return call.success([
                    "message": "plugin.wifieapconfigurator.error.network.notConnected",
                    "success": false,
                    "isConnected": false
                ])
            }
            guard (test != infoNetwork?.first?.ssid) else {
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
        let networkInfo = SSID.fetchNetworkInfo()
        return interfaceNames.compactMap { name in
            guard (networkInfo?.first?.ssid) != nil else {
                return nil
            }
            guard let ssid = networkInfo?.first?.ssid else {
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
public class SSID {
    class func fetchNetworkInfo() -> [NetworkInfo]? {
        if let interfaces: NSArray = CNCopySupportedInterfaces() {
            var networkInfos = [NetworkInfo]()
            for interface in interfaces {
                let interfaceName = interface as! String
                var networkInfo = NetworkInfo(interface: interfaceName,
                                              success: false,
                                              ssid: nil,
                                              bssid: nil)
                if let dict = CNCopyCurrentNetworkInfo(interfaceName as CFString) as NSDictionary? {
                    networkInfo.success = true
                    networkInfo.ssid = dict[kCNNetworkInfoKeySSID as String] as? String
                    networkInfo.bssid = dict[kCNNetworkInfoKeyBSSID as String] as? String
                }
                networkInfos.append(networkInfo)
            }
            return networkInfos
        }
        return nil
    }
}


struct NetworkInfo {
    var interface: String
    var success: Bool = false
    var ssid: String?
    var bssid: String?
}
