//
//  AppDelegate.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 26/11/20.
//

import Cocoa

@NSApplicationMain
class AppDelegate: NSObject, NSApplicationDelegate {
   
    var eapObject: EAP? = nil

    func application(_ sender: NSApplication, openFile filename: String) -> Bool {
        // Parsing file
        let string = try! String(contentsOfFile: filename, encoding: String.Encoding.utf8)

        // Class EAP defining eapObject
        eapObject = EAP(XMLString: string)
        
        let mainStoryboard : NSStoryboard = NSStoryboard(name: "Main", bundle: nil)
        let initialViewController : NSViewController = mainStoryboard.instantiateController(identifier: "EAPView")
        self.window = NSWindow(frame: NSScreen.main, )
        self.window?.rootViewController = initialViewController
               self.window?.makeKeyAndVisible()
        
        print("Data extract")
        print("----------------")
        print("ID: ", eapObject?.EAPIdentityProvider?.ID as Any)
        print("validUntil: ", eapObject?.EAPIdentityProvider?.ValidUntil?.date as Any)
        print("eapType: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.EAPMethod?.EapType.eap as Any)
        print("ServerID: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.ServerSideCredential.ServerID as Any)
        print("CA: ", eapObject?.EAPIdentityProvider.AuthenticationMethods.AuthenticationMethod?.first?.ServerSideCredential?.CA?.first?.CACert as Any)
        
        return true
    }
    
    func getEAPConfig() -> EAP? {
        if (eapObject != nil) {
            return eapObject
        } else {
            return nil
        }
    }

    func applicationDidFinishLaunching(_ aNotification: Notification) {
        // Insert code here to initialize your application
    }

    func applicationWillTerminate(_ aNotification: Notification) {
        // Insert code here to tear down your application
    }


}

