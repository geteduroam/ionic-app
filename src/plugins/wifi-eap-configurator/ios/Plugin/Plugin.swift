import Foundation
import Capacitor
import NetworkExtension
import SystemConfiguration.CaptiveNetwork
import UIKit
import CoreLocation

@objc(WifiEapConfigurator)
public class WifiEapConfigurator: CAPPlugin {
	
	/**
	@function getInnerAuthMethod
	@abstract Convert inner auth method integer to NEHotspotEAPSettings.TTLSInnerAuthenticationType enum
	@param innerAuthMethod Integer representing an auth method
	@result NEHotspotEAPSettings.TTLSInnerAuthenticationType representing the given auth method
	*/
	func getInnerAuthMethod(innerAuthMethod: Int?) -> NEHotspotEAPSettings.TTLSInnerAuthenticationType? {
		switch innerAuthMethod {
		case 5: // should be 1
			return .eapttlsInnerAuthenticationPAP
		case 3: // should be 2
			return .eapttlsInnerAuthenticationMSCHAP
		case 4: // should be 3
			return .eapttlsInnerAuthenticationMSCHAPv2
		/*
		case _: // not in XSD
		return .eapttlsInnerAuthenticationCHAP
		case _: // not in XSD
		return .eapttlsInnerAuthenticationEAP
		*/
		default:
			return nil
		}
	}
	
	/**
	@function getOuterEapType
	@abstract Convert outer EAP type integer to NEHotspotEAPSettings enum
	@param outerEapType Integer representing an EAP type
	@result NEHotspotEAPSettings.EAPType representing the given EAP type
	*/
	func getOuterEapType(outerEapType: Int) -> NEHotspotEAPSettings.EAPType? {
		switch outerEapType {
		case 13:
			return NEHotspotEAPSettings.EAPType.EAPTLS
		case 21:
			return NEHotspotEAPSettings.EAPType.EAPTTLS
		case 25:
			return NEHotspotEAPSettings.EAPType.EAPPEAP
		case 43:
			return NEHotspotEAPSettings.EAPType.EAPFAST
		default:
			return nil
		}
	}
	
	/**
	@function resetKeychain
	@abstract Clear all items in this app's Keychain
	*/
	func resetKeychain() {
		deleteAllKeysForSecClass(kSecClassGenericPassword)
		deleteAllKeysForSecClass(kSecClassInternetPassword)
		deleteAllKeysForSecClass(kSecClassCertificate)
		deleteAllKeysForSecClass(kSecClassKey)
		deleteAllKeysForSecClass(kSecClassIdentity)
	}
	
	/**
	@function deleteAllKeysForSecClass
	@abstract Clear Keychain for given class
	@param secClass Class to clear
	*/
	func deleteAllKeysForSecClass(_ secClass: CFTypeRef) {
		let dict: [NSString: CFTypeRef] = [kSecClass: secClass]
		let result = SecItemDelete(dict as CFDictionary)
		assert(result == noErr || result == errSecItemNotFound, "Error deleting keychain data (\(result))")
	}
	
	/**
	@function configureAP
	@abstract Capacitor call to configure networks
	@param call Capacitor call object
	*/
	@objc func configureAP(_ call: CAPPluginCall) {
		let configurations = createNetworkConfigurations(
			id: call.getString("id")!,
			domain: call.getString("domain") ?? call.getString("id")!,
			ssids: call.getArray("ssid", String.self) ?? [],
			oids: call.getArray("oid", String.self) ?? [],
			outerIdentity: call.getString("anonymous") ?? "",
			serverNames: call.getArray("servername", String.self) ?? [],
			outerEapTypes: call.hasOption("eap") ? [getOuterEapType(outerEapType: call.get("eap", Int.self)!)!] : [],
			innerAuthType: getInnerAuthMethod(innerAuthMethod: call.get("auth", Int.self)),
			clientCertificate: call.getString("clientCertificate"),
			passphrase: call.getString("passPhrase"),
			username: call.getString("username") ?? "",
			password: call.getString("password") ?? "",
			caCertificates: call.getArray("caCertificate", String.self)!
		)
		
		guard configurations.count != 0 else {
			return call.success([
				"message": "plugin.wifieapconfigurator.error.config.invalid",
				"success": false
			])
		}
        
        // At this point, we're reasonably certain that this configuration can work,
        // so break old configurations here
        // TODO only remove keychain items that match these networks
        removeNetwork(call)
        resetKeychain()

		applyConfigurations(configurations: configurations) { messages, success in
			return call.success([
				"message": messages.joined(separator: ";"),
				"success": success
			])
		}
	}
	
	/**
	@function createNetworkConfigurations
	@abstract Create network configuration objects
	@param id ID for this configuration
	@param domain HS20 home domain
	@param ssids List of SSIDs
	@param oids List of OIDs
	@param outerIdentity Outer identity
	@param serverNames Accepted server names
	@param outerEapTypes Outer eap types
	@param innerAuthType Inner auth types
	@param clientCertificate Client certificate as encrypted PKCS12
	@param passphrase Passphrase for the encrypted PKCS12
	@param username Username for PEAP/TTLS
	@param password Password for PEAP/TTLS
	@param caCertificates Accepted CA certificates for server certificate
	@result Network configuration object
	*/
	func createNetworkConfigurations(
		id: String,
		domain: String,
		ssids: [String],
		oids: [String],
		outerIdentity: String,
		serverNames: [String],
		outerEapTypes: [NEHotspotEAPSettings.EAPType],
		innerAuthType: NEHotspotEAPSettings.TTLSInnerAuthenticationType?,
		clientCertificate: String?,
		passphrase: String?,
		username: String?,
		password: String?,
		caCertificates: [String]
	) -> [NEHotspotConfiguration] {
		guard oids.count != 0 || ssids.count != 0 else {
			NSLog("☠️ createNetworkConfigurations: No OID or SSID in configuration")
			return []
		}

		guard let eapSettings = buildSettings(
			outerEapTypes: outerEapTypes,
			innerAuthType: innerAuthType,
			clientCertificate: clientCertificate,
			passphrase: passphrase,
			username: username,
			password: password,
			caCertificates: caCertificates
		) else {
			NSLog("☠️ createNetworkConfigurations: Unable to build a working ")
			return []
		}
		
		if serverNames.count > 0 {
			eapSettings.trustedServerNames = serverNames
		}
		if outerIdentity != "" {
			// only works with EAP-TTLS, EAP-PEAP, and EAP-FAST
			// https://developer.apple.com/documentation/networkextension/nehotspoteapsettings/2866691-outeridentity
			eapSettings.outerIdentity = outerIdentity
		}
		eapSettings.setTrustedServerCertificates(importCACertificates(certificateStrings: caCertificates))
		eapSettings.isTLSClientCertificateRequired = false
		eapSettings.supportedEAPTypes = outerEapTypes.map() { outerEapType in NSNumber(value: outerEapType.rawValue) }
		
		var configurations: [NEHotspotConfiguration] = []
		if oids.count != 0 {
			let hs20 = NEHotspotHS20Settings(
				domainName: domain,
				roamingEnabled: true)
			hs20.roamingConsortiumOIs = oids;
			configurations.append(NEHotspotConfiguration(hs20Settings: hs20, eapSettings: eapSettings))
		}
		for ssid in ssids {
			configurations.append(NEHotspotConfiguration(ssid: ssid, eapSettings: eapSettings))
		}
		
		return configurations
	}
	
	/**
	@function applyConfigurations
	@abstract Write the provided configurations to the OS (most will trigger a user consent each)
	@param configurations Configuration objects to apply
	@param callback Function to report back whether configuraiton succeeded
	*/
	func applyConfigurations(configurations: [NEHotspotConfiguration], callback: @escaping ([String], Bool) -> Void) {
		var counter = -1 /* we will call the worker with a constructed "nil" (no)error, which is configuration -1 */
		var errors: [String] = []
		func handler(error: Error?) -> Void {
			counter += 1
			switch(error?.code) {
			case nil:
				break;
			case NEHotspotConfigurationError.alreadyAssociated.rawValue:
				errors.append("plugin.wifieapconfigurator.error.network.alreadyAssociated")
				break
			case NEHotspotConfigurationError.userDenied.rawValue:
				errors.append("plugin.wifieapconfigurator.error.network.userCancelled")
				break
			default:
				errors.append("plugin.wifieapconfigurator.error.network.other." + String(error!.code))
			}
			
			if (counter < configurations.count) {
				let config = configurations[counter]
				// this line is needed in iOS 13 because there is a reported bug with iOS 13.0 until 13.1.0
				// https://developer.apple.com/documentation/networkextension/nehotspotconfiguration/2887518-joinonce
				config.joinOnce = false
				// TODO set to validity of client certificate
				//config.lifeTimeInDays = NSNumber(integerLiteral: 825)
				
				NEHotspotConfigurationManager.shared.apply(config, completionHandler: handler)
			} else {
				callback(
					/* message: */ errors.count > 0 ? errors : ["plugin.wifieapconfigurator.success.network.linked"],
					/* success: */ errors.count == 0 // indicate success if all configurations succeed
				)
			}
		}
		
		handler(error: nil)
	}
	
	/**
	@function buildSettingsWithClientCertificate
	@abstract Create NEHotspotEAPSettings object for client certificate authentication
	@param pkcs12 Base64 encoded client certificate
	@param passphrase Passphrase to decrypt the pkcs12, Apple doesn't like password-less
	@result NEHotspotEAPSettings configured with the provided credentials
	*/
	func buildSettingsWithClientCertificate(pkcs12: String, passphrase: String) -> NEHotspotEAPSettings? {
		let eapSettings = NEHotspotEAPSettings()
		//NSLog("🦊 configureAP: Start handling clientCertificate")
		
		// TODO certName should be the CN of the certificate,
		// but this works as long as we have only one (which we currently do)
		guard let identity = addClientCertificate(certName: "app.eduroam.geteduroam", certificate: pkcs12, passphrase: passphrase) else {
			NSLog("☠️ configureAP: addClientCertificate: nil")
			return nil
		}
		let id = identity
		guard eapSettings.setIdentity(id) else {
			return nil
		}
		
		//NSLog("🦊 configureAP: Handled clientCertificate")
		return eapSettings
	}
	
	/**
	@function buildSettings
	@abstract Build a Hotspot EAP settings object
	@param outerIdentity Outer identity
	@param innerAuthType Inner auth types
	@param clientCertificate Client certificate as encrypted PKCS12
	@param passphrase Passphrase for the encrypted PKCS12
	@param username Username for PEAP/TTLS
	@param password Password for PEAP/TTLS
	@param caCertificates Accepted CA certificates for server certificate
	@result Hotspot EAP settings object
	*/
	func buildSettings(
		outerEapTypes: [NEHotspotEAPSettings.EAPType],
		innerAuthType: NEHotspotEAPSettings.TTLSInnerAuthenticationType?,
		clientCertificate: String?,
		passphrase: String?,
		username: String?,
		password: String?,
		caCertificates: [String]
	) -> NEHotspotEAPSettings? {
		for outerEapType in outerEapTypes {
			switch(outerEapType) {
			case NEHotspotEAPSettings.EAPType.EAPTLS:
				if clientCertificate != nil && passphrase != nil {
					return buildSettingsWithClientCertificate(
						pkcs12: clientCertificate!,
						passphrase: passphrase!
					)!
				}
			case NEHotspotEAPSettings.EAPType.EAPTTLS:
				fallthrough
			case NEHotspotEAPSettings.EAPType.EAPPEAP:
				fallthrough
			case NEHotspotEAPSettings.EAPType.EAPFAST:
				if username != nil && password != nil && innerAuthType != nil {
					return buildSettingsWithUsernamePassword(
						username: username!,
						password: password!,
						innerAuthType: innerAuthType!
					)!
				}
			}
		}
		return nil
	}
	
	/**
	@function buildSettingsWithUsernamePassword
	@abstract Create NEHotspotEAPSettings object for username/pass authentication
	@param username username for PEAP/TTLS authentication
	@param password password for PEAP/TTLS authentication
	@param innerAuthType Inner authentication type (only used for TTLS)
	@result NEHotspotEAPSettings configured with the provided credentials
	*/
	func buildSettingsWithUsernamePassword(username: String, password: String, innerAuthType: NEHotspotEAPSettings.TTLSInnerAuthenticationType) -> NEHotspotEAPSettings? {
		let eapSettings = NEHotspotEAPSettings()
		
		guard username != "" && password != "" else{
			NSLog("☠️ configureAP: empty user/pass")
			return nil
		}
		
		eapSettings.username = username
		eapSettings.password = password
		eapSettings.ttlsInnerAuthenticationType = innerAuthType
		return eapSettings
	}
	
	/**
	@function isNetworkAssociated
	@abstract Capacitor call to check if SSID is connect, doesn't work for HS20
	@param call Capacitor call object containing array "ssid"
	*/
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
	
	
	/**
	@function removeNetwork
	@abstract Capacitor call to remove a network
	@param call Capacitor call object containing array "ssid" and/or string "domain"
	*/
	@objc func removeNetwork(_ call: CAPPluginCall) {
		let ssids = call.getArray("ssid", String.self) ?? []
		let domain = call.getString("domain") ?? call.getString("id")
		
		call.success([
			"message": "plugin.wifieapconfigurator.success.network.removed",
			"success": true,
		])
		
		for ssid in ssids {
			NEHotspotConfigurationManager.shared.removeConfiguration(forSSID: ssid)
		}
		if domain != nil {
			NEHotspotConfigurationManager.shared.removeConfiguration(forHS20DomainName: domain!)
		}
	}
	
	/**
	@function importCACertificates
	@abstract Import an array of Base64 encoded certificates and return an corresponding array of SecCertificate objects
	@param certificateStrings Array of Base64 CA certificates
	@result Array of SecCertificate certificates
	*/
	func importCACertificates(certificateStrings: [String]) -> [SecCertificate] {
		// supporting multiple CAs
		var index: Int = 0
		var certificates = [SecCertificate]();
		//NSLog("🦊 configureAP: Start handling caCertificateStrings")
		certificateStrings.forEach { caCertificateString in
			//NSLog("🦊 configureAP: caCertificateString " + caCertificateString)
			// building the name for the cert that will be installed
			let certName: String = "getEduroamCertCA" + String(index);
			// adding the certificate
			guard addCertificate(certName: certName, certificate: caCertificateString) else {
				NSLog("☠️ configureAP: CA certificate not added");
				return
			}
			
			let getquery: [String: Any] = [
				kSecClass as String: kSecClassCertificate,
				kSecAttrLabel as String: certName,
				kSecReturnRef as String: kCFBooleanTrue
			]
			var item: CFTypeRef?
			let status = SecItemCopyMatching(getquery as CFDictionary, &item)
			guard status == errSecSuccess else {
				NSLog("☠️ configureAP: CA certificate not saved");
				return
			}
			let savedCert = item as! SecCertificate
			certificates.append(savedCert);
			
			index += 1
		}
		//NSLog("🦊 configureAP: All caCertificateStrings handled")
		return certificates
	}
	
	/**
	@function addCertificate
	@abstract Import Base64 encoded DER to keychain.
	@param certName Name of the certificate
	@param certificate Base64 encoded DER encoded X.509 certificate
	@result Whether importing succeeded
	*/
	func addCertificate(certName: String, certificate: String) -> Bool {
		let certBase64 = certificate
		
		guard let data = Data(base64Encoded: certBase64, options: Data.Base64DecodingOptions.ignoreUnknownCharacters) else {
			NSLog("☠️ Unable to base64 decode certificate data")
			return false;
		}
		guard let certRef = SecCertificateCreateWithData(kCFAllocatorDefault, data as CFData) else {
			NSLog("☠️ addCertificate: SecCertificateCreateWithData: false")
			return false;
		}
		
		let addquery: [String: Any] = [
			kSecClass as String: kSecClassCertificate,
			kSecValueRef as String: certRef,
			kSecAttrLabel as String: certName
		]
		let status = SecItemAdd(addquery as CFDictionary, nil)
		guard status == errSecSuccess || status == errSecDuplicateItem else {
			NSLog("☠️ addCertificate: SecItemAdd " + String(status));
			return false;
		}
		return true
	}
	
	/**
	@function addClientCertificate
	@abstract Import a PKCS12 to the keychain and return a handle to the imported item.
	@param certName Name of the certificate
	@param certificate Base64 encoded PKCS12
	@param passphrase Passphrase needed to decrypt the PKCS12, required as Apple doesn't like password-less PKCS12s
	@result Whether importing succeeded
	*/
	func addClientCertificate(certName: String, certificate: String, passphrase: String) -> SecIdentity? {
		let options = [ kSecImportExportPassphrase as String: passphrase ]
		var rawItems: CFArray?
		let certBase64 = certificate
		let data = Data(base64Encoded: certBase64)!
		let statusImport = SecPKCS12Import(data as CFData, options as CFDictionary, &rawItems)
		guard statusImport == errSecSuccess else {
			NSLog("☠️ addClientCertificate: SecPKCS12Import: " + String(statusImport))
			return nil
		}
		let items = rawItems! as! Array<Dictionary<String, Any>>
		let firstItem = items[0]
		if (items.count > 1) {
			NSLog("😱 addClientCertificate: SecPKCS12Import: more than one result - using only first one")
		}
		
		// Get the chain from the imported certificate
		let chain = firstItem[kSecImportItemCertChain as String] as! [SecCertificate]
		for (index, cert) in chain.enumerated() {
			let certData = SecCertificateCopyData(cert) as Data
			
			if let certificateData = SecCertificateCreateWithData(nil, certData as CFData) {
				let addquery: [String: Any] = [
					kSecClass as String: kSecClassCertificate,
					kSecValueRef as String:  certificateData,
					kSecAttrLabel as String: "getEduroamCertificate" + "\(index)"
				]
				
				let statusUpload = SecItemAdd(addquery as CFDictionary, nil)
				
				guard statusUpload == errSecSuccess || statusUpload == errSecDuplicateItem else {
					NSLog("☠️ addServerCertificate: SecItemAdd: " + String(statusUpload))
					return nil
				}
			}
		}
		
		// Get the identity from the imported certificate
		let identity = firstItem[kSecImportItemIdentity as String] as! SecIdentity
		let addquery: [String: Any] = [
			kSecValueRef as String: identity,
			kSecAttrLabel as String: certName
		]
		let status = SecItemAdd(addquery as CFDictionary, nil)
		guard status == errSecSuccess || status == errSecDuplicateItem else {
			NSLog("☠️ addClientCertificate: SecPKCS12Import: " + String(status))
			return nil
		}
		return identity
	}
	
	/**
	@function isConnectedSSID
	@abstract capacitor call to check if SSID is connected
	@param certName Name of the certificate
	@param certificate Base64 encoded PKCS12
	@param passphrase Passphrase needed to decrypt the PKCS12, required as Apple doesn't like password-less PKCS12s
	@result Whether importing succeeded
	*/
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

public class SSID {
	class func fetchNetworkInfo() -> [NetworkInfo]? {
		if let interfaces: NSArray = CNCopySupportedInterfaces() {
			var networkInfos = [NetworkInfo]()
			for interface in interfaces {
				let interfaceName = interface as! String
				var networkInfo = NetworkInfo(
					interface: interfaceName,
					success: false,
					ssid: nil,
					bssid: nil
				)
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
