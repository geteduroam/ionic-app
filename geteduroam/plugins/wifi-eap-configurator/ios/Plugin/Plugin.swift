import Foundation
import Capacitor
import NetworkExtension
import SystemConfiguration.CaptiveNetwork
import UIKit
import CoreLocation
import UserNotifications

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
		case -1: // Non-EAP PAP
			return .eapttlsInnerAuthenticationPAP
		case -2: // Non-EAP MSCHAP
			return .eapttlsInnerAuthenticationMSCHAP
		case -3: // Non-EAP MSCHAPv2
			return .eapttlsInnerAuthenticationMSCHAPv2
		/*
		case _: // not in XSD
			return .eapttlsInnerAuthenticationCHAP
		*/
		case 26: // EAP-MSCHAPv2 (Apple supports only this inner EAP type)
			return .eapttlsInnerAuthenticationEAP
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
		let domain = call.getString("domain") ?? call.getString("id")!
		let ssids = call.getArray("ssid", String.self) ?? []

		// At this point, we're not certain this configuration can work,
		// but we can't do this any step later, because createNetworkConfigurations will import things to the keychain.
		// TODO only remove keychain items that match these networks
		removeNetwork(ssids: ssids, domains: [domain])
		resetKeychain()

		let configurations = createNetworkConfigurations(
			id: call.getString("id")!,
			domain: domain,
			ssids: ssids,
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
			NSLog("☠️ createNetworkConfigurations: Unable to build a working NEHotspotEAPSettings")
			return []
		}
		
		if outerIdentity != "" {
			// only works with EAP-TTLS, EAP-PEAP, and EAP-FAST
			// https://developer.apple.com/documentation/networkextension/nehotspoteapsettings/2866691-outeridentity
			eapSettings.outerIdentity = outerIdentity
		}

		if !serverNames.isEmpty {
			eapSettings.trustedServerNames = serverNames
		}
		if !caCertificates.isEmpty {
			var caImportStatus: Bool
			if #available(iOS 15, *) {
				// iOS 15.0.* and iOS 15.1.* have a bug where we cannot call setTrustedServerCertificates,
				// or the profile will be deemed invalid.
				// Not calling it makes the profile trust the CA bundle from the OS,
				// so only server name validation is performed.
				if #available(iOS 15.2, *) {
					// The bug was fixed in iOS 15.2
					caImportStatus = eapSettings.setTrustedServerCertificates(importCACertificates(certificateStrings: caCertificates))
				} else {
					NSLog("😡 iOS 15.0 and 15.1 do not accept setTrustedServerCertificates - continuing")
					
					// On iOS 15.0 and 15.1 we pretend everything went fine while in reality we don't even attempt; it would have crashed later on
					caImportStatus = true
				}
			} else {
				// The bug was not yet present prior to iOS 15, iOS 14 and down
				caImportStatus = eapSettings.setTrustedServerCertificates(importCACertificates(certificateStrings: caCertificates))
			}
			guard caImportStatus else {
				NSLog("☠️ createNetworkConfigurations: setTrustedServerCertificates: returned false")
				return []
			}
		}
		if serverNames.isEmpty && caCertificates.isEmpty {
			NSLog("😱 No server names and no custom CAs set; there is no way to verify this network - continuing")
		}
		
		eapSettings.isTLSClientCertificateRequired = false
		
		var configurations: [NEHotspotConfiguration] = []
		// iOS 12 doesn't do Passpoint
		if #available(iOS 13, *) {
			if oids.count != 0 {
				let hs20 = NEHotspotHS20Settings(
					domainName: domain,
					roamingEnabled: true)
				hs20.roamingConsortiumOIs = oids;
				configurations.append(NEHotspotConfiguration(hs20Settings: hs20, eapSettings: eapSettings))
			}
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
			switch(error?.code) {
			case nil:
				break;
			case NEHotspotConfigurationError.alreadyAssociated.rawValue:
				if configurations[counter].ssid != "" {
					// This should not happen, since we just removed the network
					// If it happens, you have the network from a different source.
					errors.append("plugin.wifieapconfigurator.error.network.alreadyAssociated")
				} else {
					// TODO what should we do for duplicate HS20 networks?
					// It seems that duplicate RCOI fields (oid) will trigger this error
				}
				break
			case NEHotspotConfigurationError.userDenied.rawValue:
				errors.append("plugin.wifieapconfigurator.error.network.userCancelled")
				break
			case NEHotspotConfigurationError.invalidEAPSettings.rawValue:
				// Check the debug log, search for NEHotspotConfigurationHelper
				errors.append("plugin.wifieapconfigurator.error.network.invalidEap")
				break
			case NEHotspotConfigurationError.internal.rawValue:
				// Are you running in an emulator?
				errors.append("plugin.wifieapconfigurator.error.network.internal")
				break
			case NEHotspotConfigurationError.systemConfiguration.rawValue:
				// There is a conflicting mobileconfig installed
				errors.append("plugin.wifieapconfigurator.error.network.mobileconfig")
				break
			default:
				errors.append("plugin.wifieapconfigurator.error.network.other." + String(error!.code))
			}
			counter += 1

			if (counter < configurations.count) {
				let config = configurations[counter]
				// this line is needed in iOS 13 because there is a reported bug with iOS 13.0 until 13.1.0, where joinOnce was default true
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
		eapSettings.supportedEAPTypes = [NSNumber(value: NEHotspotEAPSettings.EAPType.EAPTLS.rawValue)]
		//NSLog("🦊 configureAP: Start handling clientCertificate")

		// TODO certName should be the CN of the certificate,
		// but this works as long as we have only one (which we currently do)
		guard let identity = addClientCertificate(certificate: pkcs12, passphrase: passphrase) else {
			NSLog("☠️ configureAP: buildSettingsWithClientCertificate: addClientCertificate: returned nil")
			return nil
		}
		guard eapSettings.setIdentity(identity) else {
			NSLog("☠️ configureAP: buildSettingsWithClientCertificate: cannot set identity")
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
					)
				}
				NSLog("☠️ buildSettings: Failed precondition for EAPTLS")
				break
			case NEHotspotEAPSettings.EAPType.EAPTTLS:
				fallthrough
			case NEHotspotEAPSettings.EAPType.EAPFAST:
				fallthrough
			case NEHotspotEAPSettings.EAPType.EAPPEAP:
				if username != nil && password != nil {
					return buildSettingsWithUsernamePassword(
						outerEapTypes: outerEapTypes,
						innerAuthType: innerAuthType,
						username: username!,
						password: password!
					)
				}
				NSLog("☠️ buildSettings: Failed precondition for EAPPEAP/EAPFAST")
				break
			@unknown default:
				NSLog("☠️ buildSettings: Unknown EAPType")
				break
			}
		}
		return nil
	}

	/**
	@function buildSettingsWithUsernamePassword
	@abstract Create NEHotspotEAPSettings object for username/pass authentication
	@param outerIdentity Outer identity
	@param innerAuthType Inner auth types
	@param username username for PEAP/TTLS authentication
	@param password password for PEAP/TTLS authentication
	@param innerAuthType Inner authentication type (only used for TTLS)
	@result NEHotspotEAPSettings configured with the provided credentials
	*/
	func buildSettingsWithUsernamePassword(
		outerEapTypes: [NEHotspotEAPSettings.EAPType],
		innerAuthType: NEHotspotEAPSettings.TTLSInnerAuthenticationType?,
		username: String,
		password: String
	) -> NEHotspotEAPSettings? {
		let eapSettings = NEHotspotEAPSettings()

		guard username != "" && password != "" else{
			NSLog("☠️ buildSettingsWithUsernamePassword: empty user/pass")
			return nil
		}

		eapSettings.supportedEAPTypes = outerEapTypes.map() { outerEapType in NSNumber(value: outerEapType.rawValue) }
		// TODO: Default value is EAP, should we use that or MSCHAPv2?
		eapSettings.ttlsInnerAuthenticationType = innerAuthType ?? NEHotspotEAPSettings.TTLSInnerAuthenticationType.eapttlsInnerAuthenticationMSCHAPv2
		eapSettings.username = username
		eapSettings.password = password
		//NSLog("🦊 buildSettingsWithUsernamePassword: eapSettings.ttlsInnerAuthenticationType = " + String(eapSettings.ttlsInnerAuthenticationType.rawValue))
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

		if domain == nil {
			removeNetwork(ssids: ssids)
		} else {
			removeNetwork(ssids: ssids, domains: [domain!])
		}
	}

	/**
	@function removeConfiguration
	@abstract Capacitor call to remove a network
	@param call Capacitor call object containing array "ssid" and/or string "domain"
	*/
	func removeNetwork(ssids: [String] = [], domains: [String] = []) {
		for ssid in ssids {
			NEHotspotConfigurationManager.shared.removeConfiguration(forSSID: ssid)
		}
		for domain in domains {
			NEHotspotConfigurationManager.shared.removeConfiguration(forHS20DomainName: domain)
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
		var certificates = [SecCertificate]();
		//NSLog("🦊 configureAP: Start handling caCertificateStrings")
		for caCertificateString in certificateStrings {
			//NSLog("🦊 configureAP: caCertificateString " + caCertificateString)
			guard let certificate: SecCertificate = addCertificate(certificate: caCertificateString) else {
				NSLog("☠️ importCACertificates: CA certificate not added");
				continue
			}

			certificates.append(certificate);
		}
		
		if certificates.isEmpty {
			NSLog("☠️ importCACertificates: No certificates added");
		} else {
			//NSLog("🦊 configureAP: All caCertificateStrings handled")
		}
		
		return certificates
	}

	/**
	@function addCertificate
	@abstract Import Base64 encoded DER to keychain.
	@param certificate Base64 encoded DER encoded X.509 certificate
	@result Whether importing succeeded
	*/
	func addCertificate(certificate: String) -> SecCertificate? {
		guard let data = Data(base64Encoded: certificate) else {
			NSLog("☠️ Unable to base64 decode certificate data")
			return nil;
		}
		guard let certificateRef = SecCertificateCreateWithData(kCFAllocatorDefault, data as CFData) else {
			NSLog("☠️ addCertificate: SecCertificateCreateWithData: false")
			return nil;
		}

		var commonNameRef: CFString?
		var status: OSStatus = SecCertificateCopyCommonName(certificateRef, &commonNameRef)
		guard status == errSecSuccess else {
			NSLog("☠️ addClientCertificate: unable to get common name")
			return nil
		}
		let commonName: String = commonNameRef! as String

		let addquery: [String: Any] = [
			kSecClass as String: kSecClassCertificate,
			kSecValueRef as String: certificateRef,
			kSecAttrLabel as String: commonName,
			kSecReturnRef as String: kCFBooleanTrue!,
			//kSecReturnPersistentRef as String: kCFBooleanTrue!,
			//kSecAttrAccessGroup as String: "ZYJ4TZX4UU.com.apple.networkextensionsharing",
		]
		var item: CFTypeRef?
		status = SecItemAdd(addquery as CFDictionary, &item)
		guard status == errSecSuccess || status == errSecDuplicateItem else {
			NSLog("☠️ addCertificate: SecItemAdd " + String(status))
			return nil
		}
		
		guard item != nil else {
			NSLog("☠️ addCertificate: item is nil")
			return nil;
		}
		return (item as! SecCertificate)
	}

	/**
	@function addClientCertificate
	@abstract Import a PKCS12 to the keychain and return a handle to the imported item.
	@param certificate Base64 encoded PKCS12
	@param passphrase Passphrase needed to decrypt the PKCS12, required as Apple doesn't like password-less PKCS12s
	@result Whether importing succeeded
	*/
	func addClientCertificate(certificate: String, passphrase: String) -> SecIdentity? {
		// First we call SecPKCS12Import to read the P12,
		// then we call SecItemAdd to add items to the keychain
		// https://developer.apple.com/forums/thread/31711
		// https://developer.apple.com/documentation/security/certificate_key_and_trust_services/identities/importing_an_identity

		let options = [ kSecImportExportPassphrase as String: passphrase ]
		var rawItems: CFArray?
		let certificateData = Data(base64Encoded: certificate)!
		let statusImport = SecPKCS12Import(certificateData as CFData, options as CFDictionary, &rawItems)
		guard statusImport == errSecSuccess else {
			NSLog("☠️ addClientCertificate: SecPKCS12Import: " + String(statusImport))
			return nil
		}
		let items = rawItems! as NSArray
		let item: Dictionary<String,Any> = items.firstObject as! Dictionary<String, Any>
		let identity: SecIdentity = item[kSecImportItemIdentity as String] as! SecIdentity
		let chain = item[kSecImportItemCertChain as String] as! [SecCertificate]
		if (items.count > 1) {
			NSLog("😱 addClientCertificate: SecPKCS12Import: more than one result - using only first one")
		}

		// Import the identity to the keychain
		let addquery: [String: Any] = [
			//kSecClass as String: kSecClassIdentity, // I got errSecInternal
			kSecValueRef as String: identity,
			kSecAttrLabel as String: "Identity",
			//kSecReturnPersistentRef as String: kCFBooleanTrue!,
			kSecAttrAccessGroup as String: "ZYJ4TZX4UU.com.apple.networkextensionsharing",
		]
		var status: OSStatus = SecItemAdd(addquery as CFDictionary, nil)
		guard status == errSecSuccess else {
			// -34018 = errSecMissingEntitlement
			// -26276 = errSecInternal
			NSLog("☠️ addClientCertificate: SecItemAdd: %d", status)
			return nil
		}
		
		// Import the certificate chain for this identity
		// If we don't do this, we get "failed to find the trust chain for the client certificate" when connecting
		for certificate in chain {
			let certificateRef: SecCertificate = certificate as SecCertificate
			var commonNameRef: CFString?
			var status: OSStatus = SecCertificateCopyCommonName(certificateRef, &commonNameRef)
			guard status == errSecSuccess else {
				NSLog("☠️ addClientCertificate: unable to get common name");
				continue;
			}
			let commonName: String = commonNameRef! as String

			let addquery: [String: Any] = [
				kSecClass as String: kSecClassCertificate,
				kSecValueRef as String: certificate,
				kSecAttrLabel as String: commonName,
				kSecAttrAccessGroup as String: "ZYJ4TZX4UU.com.apple.networkextensionsharing",
			]

			status = SecItemAdd(addquery as CFDictionary, nil)

			guard status == errSecSuccess || status == errSecDuplicateItem else {
				NSLog("☠️ addClientCertificate: SecItemAdd: %s: %d", commonName, status)
				return nil
			}
		}

		// Now we will retrieve the identity from the keychain again
		var newIdentity: SecIdentity
		let getquery: [String: Any] = [
			kSecClass as String: kSecClassIdentity,
			kSecAttrLabel as String: "Identity",
			kSecReturnRef as String: kCFBooleanTrue!,
			kSecAttrAccessGroup as String: "ZYJ4TZX4UU.com.apple.networkextensionsharing",
		]
		var ref: CFTypeRef?
		status = SecItemCopyMatching(getquery as CFDictionary, &ref)
		guard status == errSecSuccess else {
			NSLog("☠️ addClientCertificate: SecItemCopyMatching: retrieving identity returned %d", status)
			return nil
		}
		newIdentity = ref! as! SecIdentity

		return newIdentity
	}

	@objc func validatePassPhrase(_ call: CAPPluginCall) {
		let passPhrase = call.getString("passPhrase")
		let certificate = call.getString("certificate")
		let options = [ kSecImportExportPassphrase as String: passPhrase ]
		var rawItems: CFArray?
		let certBase64 = certificate
		/*If */let data = Data(base64Encoded: certBase64!)!

		let statusImport = SecPKCS12Import(data as CFData, options as CFDictionary, &rawItems)
		guard statusImport == errSecSuccess else {
			return call.success([
				"message": "plugin.wifieapconfigurator.error.passphrase.invalid",
				"success": false,
			])
		}
		return call.success([
			"message": "plugin.wifieapconfigurator.valid.passphrase",
			"success": true,
		])
	}

	@objc func sendNotification(_ call: CAPPluginCall) {
            let notifCenter = UNUserNotificationCenter.current()
            notifCenter.requestAuthorization(options: [.alert, .sound, .badge]) { (granted, _) in
                let stringDate = call.getString("date")!
                let title = call.getString("title")!
                let message = call.getString("message")!

                UserDefaults.standard.set(stringDate, forKey: "date")
                UserDefaults.standard.set(title, forKey: "title")
                UserDefaults.standard.set(message, forKey: "message")

                let content = UNMutableNotificationContent()
                content.title = title ?? ""
                content.body = message ?? ""
                content.sound = UNNotificationSound.default
                content.badge = 1
        
                let realDate = Int(stringDate)! - 432000000
                let date = Date(timeIntervalSince1970: Double((realDate) / 1000))
                //let triggerDate = Calendar.current.dateComponents([.year,.month,.day,.hour,.minute,.second,], from: date)

                if date.timeIntervalSinceNow > 0 {
                    let trigger = UNTimeIntervalNotificationTrigger.init(timeInterval: date.timeIntervalSinceNow, repeats: false)

                    let request = UNNotificationRequest.init(identifier: "getEduroamApp", content: content, trigger: trigger)

                    let center = UNUserNotificationCenter.current()
                    center.add(request)
                }
            }
	}

	@objc func writeToSharedPref(_ call: CAPPluginCall) {
	    let data = call.getString("id")!

	    UserDefaults.standard.set(data, forKey: "institutionId")
	}

	@objc func readFromSharedPref(_ call: CAPPluginCall) {
         let id = UserDefaults.standard.string(forKey: "institutionId") ?? ""

         if id == "" {
            return call.success([
                "message": "plugin.wifieapconfigurator.error.reading",
                "success": false
            ])
         } else {
            return call.success([
                "id": id,
                "message": "plugin.wifieapconfigurator.success.reading",
                "success": true
            ])
         }
	}

	@objc func checkIfOpenThroughNotifications(_ call: CAPPluginCall) {
	    let openFrom = UserDefaults.standard.bool(forKey: "initFromNotification")

	    return call.success([
            "fromNotification": openFrom
        ])
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
