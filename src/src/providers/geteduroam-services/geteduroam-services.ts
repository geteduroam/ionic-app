import { HTTP } from '@ionic-native/http/ngx';
import { Injectable } from '@angular/core';
import xml2js from 'xml2js';
import {ErrorHandlerProvider} from "../error-handler/error-handler";
import { StoringProvider } from '../storing/storing';
import {ProfileModel} from "../../shared/models/profile-model";
import {ValidatorProvider} from "../validator/validator";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {CredentialApplicability} from "../../shared/entities/credentialApplicability"
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {DictionaryServiceProvider} from "../dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../global/global";
import {isArray, isObject} from "ionic-angular/util/util";
import { oAuthModel } from '../../shared/models/oauth-model';
import { CryptoUtil } from '../util/crypto-util';
import {IEEE80211} from "../../shared/entities/iEEE80211";
declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;


/**
 *  @class GeteduroamServices provider
 */
@Injectable()
export class GeteduroamServices {
  protected id: string;

  constructor(private http: HTTP, private errorHandler : ErrorHandlerProvider, private store: StoringProvider,
              private validator: ValidatorProvider, private dictionary: DictionaryServiceProvider,
              private global: GlobalProvider) {  }

  /**
   * This discovery method retrieves all institutions and their profiles from a [json]{@link https://discovery.eduroam.app/v1/discovery.json}:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#discovery}
   */
  async discovery() {
    const url = 'https://discovery.eduroam.app/v1/discovery.json';
    const params = {};
    const headers = {};

    try {
        const response = await this.http.get(url, params, headers);
        const data = JSON.parse(response.data);
        if (data.instances) {
          return data.instances;
        } else {
          await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-institution'), false);
        }

    } catch (e) {
        await this.errorHandler.handleError(e.error,false);
    }
  }

  /**
   * This gets an eapcongig file form an url which receives as parameter
   * @param url in which the eapconfig xml file is available
   * @param token (Optional)
   * @return the parsed xml
   */
  async getEapConfig(url: string, token?:string) {
    const params = {};
    let headers = {};
    let response: any;
    let jsonResult = '';

    if (token) {
        headers = {'Authorization': 'Bearer ' + token};
    }

    // It checks the url if app is opened from a file
    if ((url.includes('eap-config') || url.includes('document') || url.includes('external') || url.includes('octet-stream')) && !url.includes('https')) {

      response = await this.store.readExtFile(url);
      response.data = atob(response.data);

    } else {
      response = await this.http.get(url, params, headers);
    }

    xml2js.parseString(response.data, function (err, result) {
        jsonResult = result;
    });

    return jsonResult;

  }

  /**
   * Method to call plugin WifiEapConfigurator
   * @param config Configuration object
   */
  async connectProfile(config) {
    let resultantProfiles = null;
    if (this.global.getCredentialApplicability() && this.global.getCredentialApplicability().iEEE80211.length > 0) {
      // If there is a CredentialApplicability defined in the eap-config file,
      // loop over CredentialApplicability to take possible SSID's and OID's
      // to be removed before being configured
      resultantProfiles = this.getSSID_OID(this.global.getCredentialApplicability());
    }
    if (resultantProfiles) {
      // If there is a CredentialApplicability defined in the eap-config file,
      // loop over CredentialApplicability to take possible SSID's and OID's
      // to be removed before being configured
      // for every profile ssid will contain whether the SSID or #Passpoint if there is no SSID for the OID
      for (let i in resultantProfiles['ssid']) {
        let config = {
          ssid: resultantProfiles['ssid'][i][0]
        };
        await this.removeNetwork(config);
      }
    } else {
    // TODO if this happens it's a huge bug
      return {message: 'No CredentialApplicability configured?!', success: false};
    }
    config['id'] = this.id;
    config['domain'] = this.id; // required for HS20
    config['oid'] = resultantProfiles['oid']; // required for HS20
    config['ssid'] = resultantProfiles['ssid']; // required for SSID

    return await WifiEapConfigurator.configureAP(config);
  }

  /**
   * Method to get all SSID's and OID's from an eap-config file
   * @param credentialApplicabilityAux
   */
  getSSID_OID(credentialApplicabilityAux: CredentialApplicability):Object{
      let result:Object = {};
      let ssidAux = [];
      let oidAux = [];
      for (let i = 0; i < credentialApplicabilityAux.iEEE80211.length; i++) {
        let iEEE80211Aux : IEEE80211 = credentialApplicabilityAux.iEEE80211[i];
        if(iEEE80211Aux['ConsortiumOID']){
          oidAux = oidAux.concat(iEEE80211Aux['ConsortiumOID']);
        } else if(iEEE80211Aux['SSID']){
          ssidAux = ssidAux.concat(iEEE80211Aux['SSID']);
        }
      }
      result['ssid'] = ssidAux;
      result['oid'] = oidAux;
      return result;
  }


  /**
   * Method to remove network if is overridable
   * @param config
   */
  async removeNetwork(config){
      return await WifiEapConfigurator.removeNetwork(config);
  }

  /**
   * Method to generate certificates
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md}
   * @param data: oAUthModel
   */
  async generateOAuthFlow(data: oAuthModel) {
    let url = data.oAuthUrl;
    if (url.includes("?")) {
		url += "&";
	} else {
		url += "?";
    }
    url += `client_id=${data.client_id}&response_type=${data.type}&redirect_uri=${data.redirectUrl}`;
    url += `&scope=${data.scope}&state=0`; // TODO set and check state
    let codeVerifier = CryptoUtil.generateRandomString(128);
    let codeChallenge = await CryptoUtil.deriveChallenge(codeVerifier);

    url += "&code_challenge="+ codeChallenge;
    url += "&code_challenge_method=S256";

    return {
      uri: encodeURI(url),
      codeVerifier,
      codeChallenge,
      redirectUrl: data.redirectUrl,
      codeChallengeMethod: 'S256'
    }
  }

  /**
   * Method to get the first valid authentication method form an eap institutionSearch file.
   * @return {AuthenticationMethod} the first valid authentication method
   */
  public async eapValidation(profile:ProfileModel): Promise<boolean> {
    let eapConfigFile: any;
    let authenticationMethods:AuthenticationMethod[] = [];
    let providerInfo:ProviderInfo = new ProviderInfo();
    let credentialApplicability:CredentialApplicability= new CredentialApplicability(this.global);

    if (!!profile.oauth && !!profile.token) {
      eapConfigFile = await this.getEapConfig(profile.eapconfig_endpoint, profile.token);

    } else {
      eapConfigFile = await this.getEapConfig(profile.eapconfig_endpoint);
    }

    const validEap:boolean = this.validateEapconfig(eapConfigFile, authenticationMethods, providerInfo, credentialApplicability, profile);

    if (validEap) {
      this.global.setProviderInfo(providerInfo);
      this.global.setCredentialApplicability(credentialApplicability);

      // Iterate over all authentication methods, and find one that's supported by this device
      let authenticationMethod: AuthenticationMethod = null;
      for (let candidate of authenticationMethods) {
        if (this.supportsAuthenticationMethod(candidate)) {
          authenticationMethod = candidate;
          break;
        }
      }

      if (authenticationMethod != null) {
        authenticationMethod = this.sanitize(authenticationMethod);
        this.global.setAuthenticationMethod(authenticationMethod);
        return true;
      }
    }
    this.global.setProviderInfo(null);
    this.global.setCredentialApplicability(null);
    return false;
  }

  /**
   * Method to validate the eapconfig file and obtain its elements.
   * This method validates and updates the property [authenticationMethods]{@link #authenticationMethods}
   */
  validateEapconfig(eapConfig: any, authenticationMethods: AuthenticationMethod[], providerInfo: ProviderInfo, credentialApplicability: CredentialApplicability, profile: ProfileModel): boolean {
    let returnValue:boolean = true;
    let jsonAux = eapConfig;
    let keys = [
      'EAPIdentityProviderList',
      'EAPIdentityProvider',
      'AuthenticationMethods',
      'AuthenticationMethod'
    ];
    //----------------
    // EAP-CONFIG
    //----------------
    if (!!jsonAux) {
      for ( let key of keys ) {
        if (returnValue) {

          jsonAux = this.readJson(jsonAux, key);

          if (jsonAux == null) {
            returnValue = false;

          } else if (key === 'EAPIdentityProvider') {
            this.id = jsonAux[0]['$']['ID'];
            //----------------
            // Provider Info
            //----------------
            let providerInfoAux = this.readJson(jsonAux, 'ProviderInfo');

            if (providerInfoAux != null) {
              if (isArray(providerInfoAux)) {
                returnValue = returnValue && providerInfo.fillEntity(providerInfoAux[0]);

              } else if (isObject(providerInfoAux)) {
                returnValue = returnValue && providerInfo.fillEntity(providerInfoAux);
              }
            }
            //----------------
            // CredentialApplicability
            //----------------
            let credentialApplicabilityAux = this.readJson(jsonAux, 'CredentialApplicability');

            if (credentialApplicabilityAux != null) {
              if (isArray(credentialApplicabilityAux)) {
                returnValue = returnValue && credentialApplicability.fillEntity(credentialApplicabilityAux[0]);
              } else if (isObject(providerInfoAux)) {
                returnValue = returnValue && credentialApplicability.fillEntity(credentialApplicabilityAux);
              }
            }
          }
        }
      }
        //------------------------
        // AUTHENTICATION METHODS
        //------------------------
        if (jsonAux != null && returnValue) {

          for (let i in jsonAux) {

            if (!!jsonAux[i] && returnValue) {

              let authenticationMethodAux = new AuthenticationMethod();

              try {
                returnValue = returnValue && authenticationMethodAux.fillEntity(jsonAux[i]);

                if (returnValue) {
                  authenticationMethods.push(authenticationMethodAux);
                }
              } catch (e) {
                returnValue = false;
              }
            }
          }
        }

    } else {
        returnValue = false;
    }

    return returnValue;
  }

  /**
   * Method to read provider info
   * @param jsonAux
   * @param key
   */
  private readJson(jsonAux: JSON, key: string): JSON {
    let returnedJson: JSON;

    if (isArray(jsonAux)){
      if (jsonAux[0].hasOwnProperty(key)){
        returnedJson = jsonAux[0][key];
      } else {
        return null;
      }

    } else if (isObject(jsonAux)) {

      if ( jsonAux.hasOwnProperty(key) ) {
        returnedJson = jsonAux[key];

      } else {
        return null;
      }
    } else {
      return null;
    }

    return returnedJson;
  }

  isBase64(str) {
    try {
      return btoa(atob(str)) == str;
    } catch (err) {
      return false;
    }
  }

  /**
   * This method clean the certificates saving only the base64 string.
   * @param authenticationMethod
   */
  sanitize(authenticationMethod) {
    let certificates = [];
    authenticationMethod.clientSideCredential.clientCertificate = typeof authenticationMethod.clientSideCredential.clientCertificate === 'object' ? authenticationMethod.clientSideCredential.clientCertificate["_"] : authenticationMethod.clientSideCredential.clientCertificate;
    for ( let i = 0 ; i < authenticationMethod.serverSideCredential.ca.length ; i++ ){
      certificates[i] = typeof authenticationMethod.serverSideCredential.ca[i] === 'object' ? authenticationMethod.serverSideCredential.ca[i].content : authenticationMethod.serverSideCredential.ca[i];
    }
    authenticationMethod.serverSideCredential.ca = certificates;
    return authenticationMethod;
  }

  supportsAuthenticationMethod(authenticationMethod): boolean {
    let outerEapMethod = authenticationMethod.eapMethod.type;
    // TODO we are not certain that "type" exists.
    // Apparently that's a problem, since we're getting promise errors when connecting to EAP-TLS if this check is removed.
    let innerNonEapMethod = '';
    if ('innerAuthenticationMethod' in authenticationMethod
      && 'nonEAPAuthMethod' in authenticationMethod.innerAuthenticationMethod
      && 'type' in authenticationMethod.innerAuthenticationMethod.nonEAPAuthMethod
    ) innerNonEapMethod = authenticationMethod.innerAuthenticationMethod.nonEAPAuthMethod.type;
    let innerEapMethod = '';
    if ('innerAuthenticationMethod' in authenticationMethod
      && 'eapMethod' in authenticationMethod.innerAuthenticationMethod
      && 'type' in authenticationMethod.innerAuthenticationMethod.eapMethod
    ) innerEapMethod = authenticationMethod.innerAuthenticationMethod.eapMethod.type;

    let isAndroid = this.global.isAndroid();
    let isApple = !isAndroid;

    if (innerNonEapMethod && innerEapMethod) {
      // Can't combine EAP and Non-EAP methods
      return false;
    }

    // Check if the inner type is valid for the outer type
    switch(outerEapMethod) {
      case '13': // EAP-TLS
        // We can't ask the user for a certificate, so one must be provided
        if (typeof authenticationMethod.clientSideCredential.clientCertificate === 'object') break;
        return false;
      case '21': // EAP-TTLS
        // Android and Apple can handle any Non-EAP type here
        if (innerNonEapMethod) break; 
        // iOS can also handle EAP-MSCHAPv2
        if (isApple && innerEapMethod === '26') break;
        // Android supports TTLS-GTC, but CAT doesn't
      case '25': // EAP-PEAP
        // The inner method must be 26 on any platform
        if (innerEapMethod === '26') break;
        return false;
      default:
        return false;
    }

    return true;
  }
}
