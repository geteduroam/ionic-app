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
                    // TODO: Fix identity, The identity to use for IEEE 802.1X authentication. Holds the corresponding client certificate.
                    try! interface.associate(toEnterpriseNetwork: network, identity: nil, username: userValue, password: passValue)
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
//  print(wifiSSID.description)
                 isEqual = (wifiSSID.description == ssidValue)
                if(isEqual && clientCertValue == "") {
                    // TODO: CONNECT WITH CA
                } else if (isEqual && clientCertValue != "") {
                    // TODO: CONNECT BASED ON CERTIFICATES
                }
            }
        }
    }
    
    
}
