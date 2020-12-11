//
//  EAP.swift
//  geteduroam
//
//  Created by Carlos Fierro  on 11/12/20.
//

import Foundation
import XMLMapper

class EAP: XMLMappable {
    var nodeName: String!

    var EAPIdentityProviderList: EAPIdentityProviderList!
    var EAPIdentityProvider: EAPIdentityProvider!

    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        EAPIdentityProviderList <- map["EAPIdentityProviderList"]
        EAPIdentityProvider <- map["EAPIdentityProvider"]

    }
}

class EAPIdentityProviderList: XMLMappable {
    var nodeName: String!

    var xmlns: String?
    var xsi: String?
    var EAPIdentityProvider: EAPIdentityProvider!


    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        xmlns <- map.attributes["xmlns:xsi"]
        xsi <- map.attributes["xsi:noNamespaceSchemaLocation"]

    }
}

class EAPIdentityProvider: XMLMappable {
    var nodeName: String!

    var ID: String?
    var namespace: String?
    var lang: String?
    var version: String?
    var ValidUntil: ValidUntil?
    var AuthenticationMethods: AuthenticationMethods!
    var CredentialApplicability: CredentialApplicability!
    var ProviderInfo: ProviderInfo!


    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        ID <- map.attributes["ID"]
        namespace <- map.attributes["namespace"]
        lang <- map.attributes["lang"]
        version <- map.attributes["version"]
        ValidUntil <- map["ValidUntil"]
        AuthenticationMethods <- map["AuthenticationMethods"]
        CredentialApplicability <- map["CredentialApplicability"]
        ProviderInfo <- map["ProviderInfo"]

    }
}

class ValidUntil: XMLMappable {
    var nodeName: String!

    var date: String?
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        date <- map.innerText
      
    }
}

class AuthenticationMethods: XMLMappable {
    var nodeName: String!

    var AuthenticationMethod: [AuthenticationMethod]!
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        AuthenticationMethod <- map["AuthenticationMethod"]
      
    }
}
class AuthenticationMethod: XMLMappable {
    var nodeName: String!

    var EAPMethod: EAPMethod?
    var ServerSideCredential: ServerSideCredential!
    var ClientSideCredential: ClientSideCredential!
    var InnerAuthenticationMethod: InnerAuthenticationMethod!
    
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        EAPMethod <- map["EAPMethod"]
        ServerSideCredential <- map["ServerSideCredential"]
        ClientSideCredential <- map["ClientSideCredential"]
        InnerAuthenticationMethod <- map["InnerAuthenticationMethod"]
    }
}
class EAPMethod: XMLMappable {
    var nodeName: String!

    var EapType: Type!
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        EapType <- map["Type"]
      
    }
}
class Type: XMLMappable {
    var nodeName: String!

    var eap: Int!
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        eap <- map.innerText
      
    }
}

class ServerSideCredential: XMLMappable {
    var nodeName: String!
    
    var CA: [CA]?
    var ServerID: String!
    
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        ServerID <- map["ServerID"]
        CA <- map["CA"]
    }
}

class CA: XMLMappable {
    var nodeName: String!

    var format: String!
    var encoding: String!
    var CACert: String!
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        format <- map.attributes["format"]
        encoding <- map.attributes["encoding"]
        CACert <- map.innerText
    }
}
class ClientSideCredential: XMLMappable {
    var nodeName: String!

    var InnerIdentitySuffix: String?
    var InnerIdentityHint: String?
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        InnerIdentitySuffix <- map["InnerIdentitySuffix"]
        InnerIdentityHint <- map["InnerIdentityHintx"]
    }
}
class InnerAuthenticationMethod: XMLMappable {
    var nodeName: String!
    
    var NonEAPAuthMethod: NonEAPAuthMethod?
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        NonEAPAuthMethod <- map["NonEAPAuthMethod"]
       
    }
}
class NonEAPAuthMethod: XMLMappable {
    var nodeName: String!

    var nonEAPType: Type!
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        nonEAPType <- map["Type"]
      
    }
}
class CredentialApplicability: XMLMappable {
    var nodeName: String!

    var IEEE80211: [IEEE80211]?
    var MinRSNProto: String!
   
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        IEEE80211 <- map["IEEE80211"]
      
    }
}

class IEEE80211: XMLMappable {
    var nodeName: String!

    var SSID: String!
    var MinRSNProto: String!
    var ConsortiumOID: String!
    
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        SSID <- map["SSID"]
        MinRSNProto <- map["MinRSNProto"]
        ConsortiumOID <- map["ConsortiumOID"]
    }
}
class ProviderInfo: XMLMappable {
    var nodeName: String!

    var DisplayName: String?
    var Description: String?
    var ProviderLocation: String?
    var ProviderLogo: ProviderLogo?
    var TermsOfUse: String?
    var Helpdesk: Helpdesk?
    
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        DisplayName <- map["DisplayName"]
        Description <- map["Description"]
        ProviderLocation <- map["ProviderLocation"]
        ProviderLogo <- map["ProviderLogo"]
        TermsOfUse <- map["TermsOfUse"]
        Helpdesk <- map["Helpdesk"]
    }
}
class ProviderLogo: XMLMappable {
    var nodeName: String!

    var mime: String?
    var encoding: String?
    var logo: String?
 
    
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        mime <- map.attributes["mime"]
        encoding <- map.attributes["encoding"]
        logo <- map.innerText
    }
}
class Helpdesk: XMLMappable {
    var nodeName: String!

    var EmailAddress: String?
    var Phone: String?
    var logo: String?
    var webAddress: String?
 
    
    required init?(map: XMLMap) {}

    func mapping(map: XMLMap) {
        EmailAddress <- map.attributes["EmailAddress"]
        Phone <- map.attributes["Phone"]
        logo <- map.innerText
        webAddress <- map["webAddress"]
    }
}
