import Foundation
import Capacitor
import NetworkExtension
import SystemConfiguration.CaptiveNetwork
import UIKit



@objc(WifiEapConfigurator)
public class WifiEapConfigurator: CAPPlugin {

    
    func getAuthType(authType : Int) -> NEHotspotEAPSettings.TTLSInnerAuthenticationType? {
        switch authType {
        case 1:
            return .eapttlsInnerAuthenticationCHAP
        case 2:
            return .eapttlsInnerAuthenticationEAP
        case 3:
            return .eapttlsInnerAuthenticationMSCHAP
        case 4:
            return .eapttlsInnerAuthenticationMSCHAPv2
        case 5:
            return .eapttlsInnerAuthenticationPAP
        default:
            return nil
        }
    }
    
    @available(iOS 12.0, *)
    @objc func configureAP(_ call: CAPPluginCall) {
        
        guard let ssid = call.getString("ssid") else {
           return call.reject("You must provide a SSID.")
        }
        
        guard let username = call.getString("username") else {
            return call.reject("You must provide an username.")
        }
        
        guard let password = call.getString("password") else {
            return call.reject("You must provide a password.")
        }
        
        guard let eapType = call.get("eap", NSNumber.self) else {
            return call.reject("You must provide an EAP Type.")
        }
        
        guard let server = call.getString("servername") else {
            return call.reject("You must provide a servername.")
        }
        
        guard let authType = call.getInt("auth") else {
            return call.reject("You must provide a authentication type.")
        }
        
        guard let certificate = call.getString("caCertificate") else {
            return call.reject("You must provide a authentication certificate.")
        }
        
        
        /*
          13 = EAP-TLS
          21 = EAP-TTLS
          25 = EAP-PEAP
          43 = EAP-FAST
        */
        
        let eapSettings = NEHotspotEAPSettings()
        eapSettings.isTLSClientCertificateRequired = true
        eapSettings.supportedEAPTypes = [eapType]
        eapSettings.ttlsInnerAuthenticationType = self.getAuthType(authType: authType)!
        eapSettings.trustedServerNames = [server]
        eapSettings.username = username
        eapSettings.password = password
        
//        let base64_1 = "MIIEbzCCA1egAwIBAgIJAJAhu7l6dg+nMA0GCSqGSIb3DQEBBQUAMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTAeFw0xMDAyMDYwMDEyMzBaFw0yMDAyMDQwMDEyMzBaMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK2+21jlJLycaCgg6TBo+i37DkWvW4UR3ptLzQAQfBuOSfPBPG9zXhmn0z/gNWfpbAwETiW+2oTcSKz/XJ0Ej1dFnySNWBnNb6rOY7GrTAvkRfDbpacQATPwg9RnvBs4xR+6TGNLcYjcyEnjF+Xd29aRzH/rFkJHq2pM6rT5BpScQ4n1DrB2y+E812UjDYhx8KnD9Zh+83wpa3tMRI5J9n7AuqrBThS4xudCAcJLMyu3KTEnBpRMRfduVyndPTJe+EVcp3XBip41Biza73ZFScqMDFfskc2jT3XV3Tz+0Actg56m+JirRtcQc8lP7o/P6BXTRmIfeXbHuX7/BSE+AXECAwEAAaOCAVYwggFSMB0GA1UdDgQWBBQlxqCOiIgff64MlbIUojA2QgTzTjB6BgNVHSMEczBxgBQlxqCOiIgff64MlbIUojA2QgTzTqFOpEwwSjELMAkGA1UEBhMCTk8xEzARBgNVBAoTClVOSU5FVFQgQVMxJjAkBgNVBAMTHVVOSU5FVFQgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ggkAkCG7uXp2D6cwDAYDVR0TBAUwAwEB/zAbBgNVHREEFDASgRBkcmlmdEB1bmluZXR0Lm5vMDgGA1UdHwQxMC8wLaAroCmGJ2h0dHA6Ly9jYS51bmluZXR0Lm5vL3VuaW5ldHQtY2EtY3JsLnBlbTAzBggrBgEFBQcBAQQnMCUwIwYIKwYBBQUHMAGGF2h0dHA6Ly9vY3NwLnVuaW5ldHQubm8vMBsGA1UdEgQUMBKBEGRyaWZ0QHVuaW5ldHQubm8wDQYJKoZIhvcNAQEFBQADggEBAA9/27nksOl8d7uwi8Ce0u8WOpwDnwUUdYu0/1U91bG+bVxFL/rmenLVJJ9vaU0jxa/xHG2r8Q1RvIz1OqGX8XpbzB9cIB2Bj4kIJ+wg+pHroH9hmhJkf1gxMphtcZL3B2KAAc1B27ZchEJifFJuvL+wghAWVh0iwxhul5JOgDH0cXwvNyjRJjR70uvpU2YmRhNunqhU6hd89HPZpSybq5LU939i5HSnSgAsqQmOSCt0APlJNlJ/y5UWxMBO9ayycIuSHbORBJ8ZnXHw3yScbIEioqvAaDJNQUTNw8Pnn/dq6ffTELCFs/4QBOz7av0IxjnemYuCzgUZmb+YPhYKW+c="
//        
//        let base64_2 = "MIIEbzCCA1egAwIBAgIJAJAhu7l6dg+nMA0GCSqGSIb3DQEBBQUAMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTAeFw0xMDAyMDYwMDEyMzBaFw0yMDAyMDQwMDEyMzBaMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK2+21jlJLycaCgg6TBo+i37DkWvW4UR3ptLzQAQfBuOSfPBPG9zXhmn0z/gNWfpbAwETiW+2oTcSKz/XJ0Ej1dFnySNWBnNb6rOY7GrTAvkRfDbpacQATPwg9RnvBs4xR+6TGNLcYjcyEnjF+Xd29aRzH/rFkJHq2pM6rT5BpScQ4n1DrB2y+E812UjDYhx8KnD9Zh+83wpa3tMRI5J9n7AuqrBThS4xudCAcJLMyu3KTEnBpRMRfduVyndPTJe+EVcp3XBip41Biza73ZFScqMDFfskc2jT3XV3Tz+0Actg56m+JirRtcQc8lP7o/P6BXTRmIfeXbHuX7/BSE+AXECAwEAAaOCAVYwggFSMB0GA1UdDgQWBBQlxqCOiIgff64MlbIUojA2QgTzTjB6BgNVHSMEczBxgBQlxqCOiIgff64MlbIUojA2QgTzTqFOpEwwSjELMAkGA1UEBhMCTk8xEzARBgNVBAoTClVOSU5FVFQgQVMxJjAkBgNVBAMTHVVOSU5FVFQgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ggkAkCG7uXp2D6cwDAYDVR0TBAUwAwEB/zAbBgNVHREEFDASgRBkcmlmdEB1bmluZXR0Lm5vMDgGA1UdHwQxMC8wLaAroCmGJ2h0dHA6Ly9jYS51bmluZXR0Lm5vL3VuaW5ldHQtY2EtY3JsLnBlbTAzBggrBgEFBQcBAQQnMCUwIwYIKwYBBQUHMAGGF2h0dHA6Ly9vY3NwLnVuaW5ldHQubm8vMBsGA1UdEgQUMBKBEGRyaWZ0QHVuaW5ldHQubm8wDQYJKoZIhvcNAQEFBQADggEBAA9/27nksOl8d7uwi8Ce0u8WOpwDnwUUdYu0/1U91bG+bVxFL/rmenLVJJ9vaU0jxa/xHG2r8Q1RvIz1OqGX8XpbzB9cIB2Bj4kIJ+wg+pHroH9hmhJkf1gxMphtcZL3B2KAAc1B27ZchEJifFJuvL+wghAWVh0iwxhul5JOgDH0cXwvNyjRJjR70uvpU2YmRhNunqhU6hd89HPZpSybq5LU939i5HSnSgAsqQmOSCt0APlJNlJ/y5UWxMBO9ayycIuSHbORBJ8ZnXHw3yScbIEioqvAaDJNQUTNw8Pnn/dq6ffTELCFs/4QBOz7av0IxjnemYuCzgUZmb+YPhYKW+c="
//        
//        
//        let dataCert1 = Data(base64Encoded: base64_1)!
//        let dataCert2 = Data(base64Encoded: base64_2)!
//        
//        guard let certificate_1 = SecCertificateCreateWithData(nil, dataCert1 as CFData) else {
//            return print("error cert1")
//        }
//        
//        guard let certificate_2 = SecCertificateCreateWithData(nil, dataCert2 as CFData) else {
//            return print("error cert2")
//        }
//        
//        eapSettings.setTrustedServerCertificates([certificate_1, certificate_2])
//        
        let config = NEHotspotConfiguration(ssid: ssid, eapSettings: eapSettings)
        config.joinOnce = false
        config.lifeTimeInDays = 1

        NEHotspotConfigurationManager.shared.apply(config) { (error) in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                if self.currentSSIDs().first == ssid {
                    call.success([
                        "message": "The user has been logged into the network successfully.",
                        "ssid": ssid,
                    ])
                } else {
                    call.reject("Unable to connect to " + ssid + ". Please try again later.")
                }
            }
        }
    }
    
    func currentSSIDs() -> [String] {
        guard let interfaceNames = CNCopySupportedInterfaces() as? [String] else {
            return []
        }
        
        return interfaceNames.compactMap { name in
            guard let info = CNCopyCurrentNetworkInfo(name as CFString) as? [String:AnyObject] else {
                return nil
            }
            guard let ssid = info[kCNNetworkInfoKeySSID as String] as? String else {
                return nil
            }
            return ssid
        }
    }
}
