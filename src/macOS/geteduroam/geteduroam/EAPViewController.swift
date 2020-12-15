//
//  EAPViewController.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 14/12/20.
//

import Foundation
import Cocoa


class EAPViewController: NSViewController {
    
    let appDelegate = NSApplication.shared.delegate as! AppDelegate
    var eapObject: EAP? = nil
    @IBOutlet weak var IDfield: NSTextField!
    @IBOutlet weak var serverField: NSTextField!
    @IBOutlet weak var validField: NSTextField!
    @IBOutlet weak var imageView: NSImageView!

    override func viewDidLoad() {
        super.viewDidLoad()
        eapObject = appDelegate.eapObject
       
        // Do any additional setup after loading the view.
        // Fill values
        IDfield.stringValue = (eapObject?.EAPIdentityProvider.ID)!
        serverField.stringValue = (eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.ServerSideCredential.ServerID)!
       
        if (eapObject?.EAPIdentityProvider?.ValidUntil != nil) {
            validField.stringValue = (eapObject?.EAPIdentityProvider?.ValidUntil?.date)! as String
        } else {
            validField.stringValue = "Not exist"
        }
        
        if(eapObject?.EAPIdentityProvider?.ProviderInfo.ProviderLogo != nil){
            let logo = (eapObject?.EAPIdentityProvider?.ProviderInfo.ProviderLogo?.logo)!
            provideLogo(image: logo ?? "")
        }
        
        print("Data extract")
        print("----------------")
        print("ID: ", eapObject?.EAPIdentityProvider?.ID as Any)
        print("validUntil: ", eapObject?.EAPIdentityProvider?.ValidUntil?.date as Any)
        print("eapType: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.EAPMethod?.EapType.eap as Any)
        print("ServerID: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.ServerSideCredential.ServerID as Any)
        print("CA: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.ServerSideCredential?.CA?.first?.CACert as Any)
    }

    override var representedObject: Any? {
        didSet {
        // Update the view, if already loaded.
        }
    }
    
    func provideLogo(image: String) {
        if (image != ""){
            let imageData = NSData(base64Encoded: image)

            let image = NSImage(data: imageData as! Data)
           
            imageView.image = image
        }
    }
    
}
