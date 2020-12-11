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

    @IBOutlet weak var ssidField: NSTextField!
    @IBOutlet weak var passField: NSTextField!
    @IBOutlet weak var userField: NSTextField!
    @IBOutlet weak var caField: NSTextField!
    @IBOutlet weak var clientCertField: NSTextField!
    
    var ssidValue = ""
    var passValue = ""
    var userValue = ""
    var caValue = ""
    var clientCertValue = ""

    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.

    }

    override var representedObject: Any? {
        didSet {
        // Update the view, if already loaded.
        }
    }

// FIELDS ACTIONS //
    
    @IBAction func ssidAction(_ sender: NSTextField) {
        ssidValue = sender.stringValue
        print("ssidValue: ", ssidValue)
    }
    
    @IBAction func passAction(_ sender: NSTextField) {
        passValue = sender.stringValue
        print("passValue: ", passValue)
    }
    
    @IBAction func userAction(_ sender: NSTextField) {
        userValue = sender.stringValue
        print("userValue: ", userValue)
    }
    
    @IBAction func caAction(_ sender: NSTextField) {
        caValue = sender.stringValue
        print("caValue: ", caValue)
    }
    
    @IBAction func clientCertAction(_ sender: NSTextField) {
        clientCertValue = sender.stringValue
        print("clientCertValue: ", clientCertValue)
    }
    // BUTTONS ACTIONS //
    
    @IBAction func connect(_ sender: NSButton) {
        print("ssid: ", ssidValue)
        print("pass: ", passValue)
        print("user: ", userValue)
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
                if(isEqual && userValue == "") {
                    try! interface.associate(to: network, password: passValue)
                } else if (isEqual && userValue != "") {
                    let identity = addCertificate(certificate: userValue, passphrase: passValue)
                    _ = try? interface.associate(toEnterpriseNetwork: network, identity: identity, username: userValue, password: passValue)
               
                }
            }
        }
        
    }
  
 
    @IBAction func connectWithCerts(_ sender: Any) {
        print("ssid: ", ssidValue)
        print("pass: ", passValue)
        print("ca: ", caValue)
        print("clientCertValue: ", clientCertValue)
        var isEqual = false
        let client = CWWiFiClient.shared()
        let interface = client.interface()!
       
        if let discovery = Discovery() {
            print(" Wifi scan ")
            print("------------")
            for network in discovery.networks {
                let wifiSSID: String = network.ssid!.description as String

                 isEqual = (wifiSSID.description == ssidValue)
                if(isEqual && clientCertValue == "") {
                    let identity = addCertificate(certificate: clientCertValue, passphrase: passValue)
                    _ = try? interface.associate(toEnterpriseNetwork: network, identity: identity, username: userValue, password: passValue)
                } else if (isEqual && clientCertValue != "") {
                    // TODO: CONNECT BASED ON CERTIFICATES
                    let certificates = [caValue, clientCertValue]
                    let certificate = importCACertificates(certificateStrings: certificates, pass: passValue)
                    let identity = addCertificate(certificate: clientCertValue, passphrase: passValue)
                    _ = try? interface.associate(toEnterpriseNetwork: network, identity: identity, username: userValue, password: passValue)
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
}
