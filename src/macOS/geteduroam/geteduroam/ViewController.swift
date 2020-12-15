//
//  ViewController.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 26/11/20.
//
import Foundation
import Cocoa
import CoreWLAN


class ViewController: NSViewController {
    let appDelegate = NSApplication.shared.delegate as! AppDelegate
    var eapObject: EAP? = nil
    @IBOutlet weak var ssidField: NSTextField!
    @IBOutlet weak var passField: NSTextField!
    @IBOutlet weak var userField: NSTextField!
    @IBOutlet weak var caField: NSTextField!
    @IBOutlet weak var clientCertField: NSTextField!
    var ssidValue = ""
    var outerIdentity = ""
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
     if (appDelegate.eapObject != nil) {
          eapObject = appDelegate.eapObject
       
          fillInfo()
     }
    }

    override var representedObject: Any? {
        didSet {
        // Update the view, if already loaded.
        }
    }

// FIELDS ACTIONS //
    
    @IBAction func ssidAction(_ sender: NSTextField) {
        print("ssidValue: ", sender.stringValue)
        ssidValue = sender.stringValue
    }
    
    @IBAction func passAction(_ sender: NSTextField) {
        print("passValue: ", sender.stringValue)
    }
    
    @IBAction func userAction(_ sender: NSTextField) {
        print("userValue: ", sender.stringValue)
    }
    
    @IBAction func caAction(_ sender: NSTextField) {
        print("caValue: ", sender.stringValue)
    }
    
    @IBAction func clientCertAction(_ sender: NSTextField) {
        print("clientCertValue: ", sender.stringValue)
    }
    // BUTTONS ACTIONS //
    
    @IBAction func connect(_ sender: NSButton) {
        var isEqual = false
        let client = CWWiFiClient.shared()
        let interface = client.interface()!
       
        if let discovery = Discovery() {
            print(" Wifi scan ")
            print("------------")
            for network in discovery.networks {
                let wifiSSID: String = network.ssid!.description as String
//  print(wifiSSID.description)
                isEqual = (wifiSSID.description == ssidField.stringValue)
                if(isEqual && userField == nil) {
                    try! interface.associate(to: network, password: passField.stringValue)
                } else if (isEqual && userField != nil) {
                    let identity = addCertificate(certificate: userField.stringValue, passphrase: passField.stringValue)
                    _ = try? interface.associate(toEnterpriseNetwork: network, identity: identity, username: userField.stringValue, password: passField.stringValue)
               
                }
            }
        }
        
    }
    
    @IBAction func connectWithCerts(_ sender: Any) {
        var isEqual = false
        let client = CWWiFiClient.shared()
        let interface = client.interface()!
       
        if let discovery = Discovery() {
            print(" Wifi scan ")
            print("------------")
            for network in discovery.networks {
                let wifiSSID: String = network.ssid!.description as String
//  print(wifiSSID.description)
                isEqual = (wifiSSID.description == ssidValue)
                if(isEqual && clientCertField == nil) {
                    let identity = addCertificate(certificate: caField.stringValue, passphrase: passField.stringValue)
                    _ = try? interface.associate(toEnterpriseNetwork: network, identity: identity, username: userField.stringValue, password: passField.stringValue)
                } else if (isEqual && clientCertField != nil) {
                    // TODO: CONNECT BASED ON CERTIFICATES
                    if (outerIdentity == "") {
                        outerIdentity = userField.stringValue
                    }
                    let certificates = [caField.stringValue, clientCertField.stringValue]
                    let certificate = importCACertificates(certificateStrings: certificates, pass: passField.stringValue)
                    let identity = addCertificate(certificate: clientCertField.stringValue, passphrase: passField.stringValue)
                    _ = try? interface.associate(toEnterpriseNetwork: network, identity: identity, username: outerIdentity, password: passField.stringValue)
                }
            }
        }
    }
    
    func addCertificate(certificate: String, passphrase: String) -> SecIdentity? {
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
            kSecAttrLabel as String: "app.eduroam.geteduroam"
        ]
        let status = SecItemAdd(addquery as CFDictionary, nil)
        guard status == errSecSuccess || status == errSecDuplicateItem else {
            NSLog("☠️ addClientCertificate: SecPKCS12Import: " + String(status))
            return nil
        }
        return identity
    }
    
    func importCACertificates(certificateStrings: [String], pass: String) -> [SecCertificate] {
        // supporting multiple CAs
        var index: Int = 0
        var certificates = [SecCertificate]();
        //NSLog("🦊 configureAP: Start handling caCertificateStrings")
        certificateStrings.forEach { caCertificateString in
            //NSLog("🦊 configureAP: caCertificateString " + caCertificateString)
            // building the name for the cert that will be installed
            let certName: String = "getEduroamCertCA" + String(index);
            // adding the certificate
            guard (addCertificate(certificate: caCertificateString, passphrase: pass) != nil) else {
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
    
        func fillInfo() {
            // SSID
            if(eapObject?.EAPIdentityProvider.CredentialApplicability.IEEE80211?.first?.SSID != nil && ssidField != nil) {
               
                ssidField.stringValue = (eapObject?.EAPIdentityProvider.CredentialApplicability.IEEE80211?.first?.SSID) ?? ""
            }
            // Client certificate
            if(eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ClientSideCredential.ClientCertificate != nil && clientCertField != nil){
                clientCertField.stringValue = (eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ClientSideCredential.ClientCertificate?.clientCertificate)!
                
                if(eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ClientSideCredential.OuterIdentity != nil){
                    outerIdentity = (eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ClientSideCredential.OuterIdentity)!
                }
            }
       
            if(eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ClientSideCredential?.InnerIdentitySuffix != nil && userField != nil) {
                userField.stringValue = (eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ClientSideCredential?.InnerIdentitySuffix) ?? ""
            }
            
            if(eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first!.ServerSideCredential != nil && caField != nil) {
                
                caField.stringValue =  (eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first!.ServerSideCredential?.CA?.first?.CACert) ?? "Not found"
 
            }
          }
        
    
}
