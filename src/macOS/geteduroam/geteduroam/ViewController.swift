//
//  ViewController.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 26/11/20.
//

import Cocoa

class ViewController: NSViewController {

    @IBOutlet weak var ssidField: NSTextField!
    @IBOutlet weak var passField: NSSecureTextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }

    override var representedObject: Any? {
        didSet {
        // Update the view, if already loaded.
        }
    }
    
    @IBAction func connect(_ sender: NSButton) {
        NSLog(sender.stringValue)
        NSLog("ssidValue: ", ssidField.stringValue)
        NSLog("passValue: ", passField.stringValue)
    }


}

