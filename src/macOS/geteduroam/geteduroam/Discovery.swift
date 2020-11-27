//
//  Discovery.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 27/11/20.
//

import Foundation
import CoreWLAN

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
