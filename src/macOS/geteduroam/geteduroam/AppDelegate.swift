//
//  AppDelegate.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 26/11/20.
//

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    
    func application(_ sender: NSApplication, openFile filename: String) -> Bool {
        // Parsing file
        let string = try! String(contentsOfFile: filename, encoding: String.Encoding.utf8)
        
        // Class EAP defining eapObject
        let eapObject = EAP(XMLString: string)
        
        var myWindow: NSWindow? = nil
        let storyboard = NSStoryboard(name: NSStoryboard.Name("Main"),bundle: nil)
        let controller = storyboard.instantiateController(withIdentifier: NSStoryboard.SceneIdentifier("EAPView")) as! NSViewController
        myWindow = NSWindow(contentViewController: controller)
        let vc = NSWindowController(window: myWindow)
        vc.showWindow(self)
        
        // TODO: Catch error when parsing eap file thrown a nil value
        
        print("Data extract")
        print("----------------")
        print("ID: ", eapObject?.EAPIdentityProvider?.ID as Any)
        print("validUntil: ", eapObject?.EAPIdentityProvider?.ValidUntil?.date as Any)
        print("eapType: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.EAPMethod?.EapType.eap as Any)
        print("ServerID: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.ServerSideCredential.ServerID as Any)
        print("CA: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.ServerSideCredential?.CA?.first?.CACert as Any)
        return true
    }


    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Insert code here to initialize your application
    }

    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }


}

