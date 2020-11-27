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
    
    var ssidValue = ""
    var passValue = ""
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
    }

    override var representedObject: Any? {
        didSet {
        // Update the view, if already loaded.
        }
    }

    @IBAction func ssidAction(_ sender: NSTextField) {
        ssidValue = sender.stringValue
    }
    
    @IBAction func passAction(_ sender: NSTextField) {
        passValue = sender.stringValue
    }
    
    @IBAction func connect(_ sender: NSButton) {
        print("ssid: ", ssidValue)
        print("pass: ", passValue)
        var isEqual = false
        let client = CWWiFiClient.shared()
        let interface = client.interface()!
        if let discovery = Discovery() {
            print(" Wifi scan ")
            print("------------")
            for network in discovery.networks {
                let wifiSSID: String = network.ssid!.description as String
                print(wifiSSID.description)
                 isEqual = (wifiSSID.description == ssidValue)
                if(isEqual){
                    try! interface.associate(to: network, password: passValue)
                }
            }
        }
        
    }
 
    
}

class Discovery {

    var currentInterface: CWInterface
    var interfacesNames: [String] = []
    var networks: Set<CWNetwork> = []

    // Failable init using default interface
    init?() {
        if let defaultInterface = CWWiFiClient.shared().interface(),
           let name = defaultInterface.interfaceName {
            self.currentInterface = defaultInterface
            self.interfacesNames.append(name)
            self.findNetworks()
        } else {
            return nil
        }
    }

    // Init with the literal interface name, like "en1"
    init(interfaceWithName name: String) {
        self.currentInterface = CWInterface(interfaceName: name)
        self.interfacesNames.append(name)
        self.findNetworks()
    }

    // Fetch detectable WIFI networks
   func findNetworks() {
        do {
            self.networks = try currentInterface.scanForNetworks(withSSID: nil)
        } catch let error as NSError {
            print("Error: \(error.localizedDescription)")
        }
    }
}
