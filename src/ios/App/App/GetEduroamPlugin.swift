//
//  GetEduroamPlugin.swift
//  App
//
//  Created by Mac Mini Desarrollo iOS on 27/11/2019.
//

import Foundation
import Capacitor

@objc(GetEduroamPlugin)
public class GetEduroamPlugin: CAPPlugin {
    @objc func test(_ call: CAPPluginCall) {
        guard let ssid = call.getString("ssid") else {
            return call.reject("Debes pasar algún ssid por parámetro.")
        }

        call.success([
            "ssid": ssid
        ])
    }
}
