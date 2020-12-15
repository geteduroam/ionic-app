//
//  AppDelegate.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 26/11/20.
//

import Cocoa


@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
    // Object defined by EAP Class
    var eapObject: EAP? = nil
    
    // Initialized by eap-config file.
    func application(_ sender: NSApplication, openFile filename: String) -> Bool {
        // Parsing file to EAP Class
        let string = try! String(contentsOfFile: filename, encoding: String.Encoding.utf8)
        eapObject = EAP(XMLString: string)
        
        // Load eapView Scene
        var eapView: NSWindow? = nil
        let storyboard = NSStoryboard(name: NSStoryboard.Name("Main"),bundle: nil)
        var controller: NSViewController
        
        // Filter view connection with client certificate or CA certificate
        if(eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ClientSideCredential.ClientCertificate != nil){
            controller = storyboard.instantiateController(withIdentifier: NSStoryboard.SceneIdentifier("PassphraseViewController")) as! NSViewController
            eapView = NSWindow(contentViewController: controller)
      
        } else if(eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod.first?.ServerSideCredential.CA  != nil){
            controller = storyboard.instantiateController(withIdentifier: NSStoryboard.SceneIdentifier("CAViewController")) as! NSViewController
            eapView = NSWindow(contentViewController: controller)
        }
        
        let vc = NSWindowController(window: eapView)
        vc.showWindow(self)

        return true
    }


    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Insert code here to initialize your application
    }

    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }


}

