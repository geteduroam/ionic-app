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
    //
    /*
     WIFI + CA
     ----------
     user = userName@domain
     CACertificate = MIIE+zCCA+OgAwIBAgIQCHC8xa8/25Wakctq7u/kZTANBgkqhkiG9w0BAQsFADBlMQswCQYDVQQGEwJVUzEVMBMGA1UEChMMRGlnaUNlcnQgSW5jMRkwFwYDVQQLExB3d3cuZGlnaWNlcnQuY29tMSQwIgYDVQQDExtEaWdpQ2VydCBBc3N1cmVkIElEIFJvb3QgQ0EwHhcNMTQxMTE4MTIwMDAwWhcNMjQxMTE4MTIwMDAwWjBkMQswCQYDVQQGEwJOTDEWMBQGA1UECBMNTm9vcmQtSG9sbGFuZDESMBAGA1UEBxMJQW1zdGVyZGFtMQ8wDQYDVQQKEwZURVJFTkExGDAWBgNVBAMTD1RFUkVOQSBTU0wgQ0EgMzCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMV2Dw/ZQyk7bG3RR63eEL8jwnioSnc18SNb4EweQefCMQC9iDdFdd25AhCAHo/tZCMERaegOTuBTc9jP8JJ/yKeiLDSlrlcinQfkioq8hLIt2hUtVhBgUBoBhpPhSn7tU08D08/QJYbzqjMXjX/ZJj1dd10VAWgNhEEEiRVY++Udy538RV27tOkWUUhn6i+0SftCuirOMo/h9Ha8Y+5Cx9E5+Ct85XCFk3shKM6ktTPxn3mvcsaQE+zVLHzj28NHuO+SaNW5Ae8jafOHbBbV1bRxBz8mGXRzUYvkZS/RYVJ+G1ShxwCVgEnFqtyLvRx5GG1IKD6JmlqCvGrn223zyUCAwEAAaOCAaYwggGiMBIGA1UdEwEB/wQIMAYBAf8CAQAwDgYDVR0PAQH/BAQDAgGGMHkGCCsGAQUFBwEBBG0wazAkBggrBgEFBQcwAYYYaHR0cDovL29jc3AuZGlnaWNlcnQuY29tMEMGCCsGAQUFBzAChjdodHRwOi8vY2FjZXJ0cy5kaWdpY2VydC5jb20vRGlnaUNlcnRBc3N1cmVkSURSb290Q0EuY3J0MIGBBgNVHR8EejB4MDqgOKA2hjRodHRwOi8vY3JsMy5kaWdpY2VydC5jb20vRGlnaUNlcnRBc3N1cmVkSURSb290Q0EuY3JsMDqgOKA2hjRodHRwOi8vY3JsNC5kaWdpY2VydC5jb20vRGlnaUNlcnRBc3N1cmVkSURSb290Q0EuY3JsMD0GA1UdIAQ2MDQwMgYEVR0gADAqMCgGCCsGAQUFBwIBFhxodHRwczovL3d3dy5kaWdpY2VydC5jb20vQ1BTMB0GA1UdDgQWBBRn/YggFCeYxwnSJRm76VERY3VQYjAfBgNVHSMEGDAWgBRF66Kv9JLLgjEtUYunpyGd823IDzANBgkqhkiG9w0BAQsFAAOCAQEAqSg1esR71tonHqyYzyc2TxEydHTmQN0dzfJodzWvs4xdxgS/FfQjZ4u5b5cE60adws3J0aSugS7JurHogNAcyTnBVnZZbJx946nw09E02DxJWYsamM6/xvLYMDX/6W9doK867mZTrqqMaci+mqege9iCSzMTyAfzd9fzZM2eY/lCJ1OuEDOJcjcV8b73HjWizsMt8tey5gvHacDlH198aZt+ziYaM0TDuncFO7pdP0GJ+hY77gRuW6xWS++McPJKe1e9GW6LNgdUJi2GCZQfXzer8CM/jyxflp5HcahE3qm5hS+1NGClXwmgmkMd1L8tRNaN2v11y18WoA5hwnA9Ng==
     
       WIFI BASED CERTS
     --------------------
     clientCert = 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
     
     CA = MIIB4DCCAYWgAwIBAgIIYfHIwpwfNKMwCgYIKoZIzj0EAwIwJzElMCMGA1UEAwwcVW5pbmV0dCBnZXRlZHVyb2FtIE5vcndheSBDQTAgFw0yMDA5MjMxMzU0NDBaGA8yMDcwMDkxMTEzNTQ0MFowJzElMCMGA1UEAwwcVW5pbmV0dCBnZXRlZHVyb2FtIE5vcndheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABGrwV9TgiUDlcsnfrxdLICAHVGkyOa75xNmYKjkcJT9jhZoQZzU712AiQbjuoKqoGxHXwakr/VNwZ9TcfSMxlYKjgZgwgZUwHQYDVR0OBBYEFLDtGckRpFehKhBnyFyGWacSsE0PMFYGA1UdIwRPME2AFLDtGckRpFehKhBnyFyGWacSsE0PoSukKTAnMSUwIwYDVQQDDBxVbmluZXR0IGdldGVkdXJvYW0gTm9yd2F5IENBgghh8cjCnB80ozAPBgNVHRMBAf8EBTADAQH/MAsGA1UdDwQEAwIBhjAKBggqhkjOPQQDAgNJADBGAiEA9heYp9RYuxTRQ+dRLzhUhS/Y+rE34mT3pboqplGQU8oCIQCDh27diORZ0S8+79Dxs5W34E6bcjlQYbW1khYk5/9VNA==
     
     pass = pkcs12
     */
    
 
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
//  print(wifiSSID.description)
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
