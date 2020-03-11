import { HTTP } from '@ionic-native/http/ngx';
import { Injectable } from '@angular/core';
import xml2js from 'xml2js';
import {ErrorHandlerProvider} from "../error-handler/error-handler";
import { StoringProvider } from '../storing/storing';
import {ProfileModel} from "../../shared/models/profile-model";
import {ValidatorProvider} from "../validator/validator";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {DictionaryServiceProvider} from "../dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../global/global";
import {isArray, isObject} from "ionic-angular/util/util";
import { oAuthModel } from '../../shared/models/oauth-model';
import { CryptoUtil } from '../util/crypto-util';
declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;


/**
 *  @class GeteduroamServices provider
 */
@Injectable()
export class GeteduroamServices {

  constructor(private http: HTTP, private errorHandler : ErrorHandlerProvider, private store: StoringProvider,
              private validator: ValidatorProvider, private dictionary: DictionaryServiceProvider,
              private global: GlobalProvider) {  }

  /**
   * This discovery method retrieves all institutions and their profiles from a [json]{@link https://discovery.geteduroam.no/discovery-v1.json}:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#discovery}
   */
  async discovery() {
    const url = 'https://discovery.geteduroam.no/discovery-v1.json';
    const params = {};
    const headers = {};

    try {
        const response = await this.http.get(url, params, headers);
        const data = JSON.parse(response.data);
        return data.instances;
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
    if (url.includes('eap-config') && !url.includes('https')) {

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
    if (this.global.getOverrideProfile()) {
        let config = {
            ssid: this.global.getSsid()
        };

        this.removeNetwork(config);
    }
    return await WifiEapConfigurator.configureAP(config);
  }

  /**
   * Method to remove network if is overridable
   * @param config
   */
  async removeNetwork(config) {
      return await WifiEapConfigurator.removeNetwork(config);
  }

  /**
   * Method to generate certificates
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md}
   * @param data: oAUthModel
   */
  async generateOAuthFlow(data: oAuthModel) {

    let url = `${data.oAuthUrl}?client_id=${data.client_id}&response_type=${data.type}&redirect_uri=${data.redirectUrl}`
        url += `&scope=${data.scope}&state=${CryptoUtil.generateRandomString(10)}`;
    let codeVerifier = CryptoUtil.generateRandomString(43);
    let codeChallenge = await CryptoUtil.deriveChallenge(codeVerifier);

    if (!!data.pkce) {
      url += "&code_challenge="+ codeChallenge;
      url += "&code_challenge_method=S256";

    } else {
      url += "&code_challenge=" + codeChallenge;
      url += "&code_challenge_method=plain";
    }

    return {
      uri: encodeURI(url),
      codeVerifier,
      codeChallenge,
      redirectUrl: data.redirectUrl,
      codeChallengeMethod: 'S256'
    }
  }

  /**
   * Method to get AuthenticationMethod from eap certificates
   * @param authenticationMethods
   * @param providerInfo
   */
  public async getFirstAuthenticationMethod(authenticationMethods: AuthenticationMethod[], providerInfo: ProviderInfo): Promise<AuthenticationMethod> {
    for (let authenticationMethod of authenticationMethods) {
      if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
        return authenticationMethod;
      }
    }

    return null;
  }

  /**
   * Method to get the first valid authentication method form an eap institutionSearch file.
   * @return {AuthenticationMethod} the first valid authentication method
   */
  public async eapValidation(profile:ProfileModel): Promise<boolean> {
    let eapConfigFile: any;
    let authenticationMethods:AuthenticationMethod[] = [];
    let providerInfo:ProviderInfo= new ProviderInfo();

    if (!!profile.oauth && !!profile.token) {
        eapConfigFile = await this.getEapConfig(profile.eapconfig_endpoint+'?format=eap-metadata', profile.token);

    } else {
        eapConfigFile = await this.getEapConfig(profile.eapconfig_endpoint);
    }

    const validEap:boolean = this.validateEapconfig(eapConfigFile, authenticationMethods, providerInfo);

    if (validEap) {
        this.global.setProviderInfo(providerInfo);
        let authenticationMethod: AuthenticationMethod = await this.getFirstAuthenticationMethod(authenticationMethods, providerInfo);

        if (!!authenticationMethod) {
            this.global.setAuthenticationMethod(authenticationMethod);
            return true;
        } else {

            return false;
        }

    } else {
        this.global.setProviderInfo(null);
        return false;
    }
  }

  /**
   * Method to validate the eapconfig file and obtain its elements.
   * This method validates and updates the property [authenticationMethods]{@link #authenticationMethods}
   */
  validateEapconfig(eapConfig: any, authenticationMethods: AuthenticationMethod[], providerInfo: ProviderInfo): boolean {
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

          if ( jsonAux == null ) {
            returnValue = false;

          } else if (key === 'EAPIdentityProvider') {
            //----------------
            // Provider Info
            //----------------
            let providerInfoAux = this.readJson(jsonAux, 'ProviderInfo');

              if (providerInfoAux != null) {
                if ( isArray(providerInfoAux) ) {
                  returnValue = returnValue && providerInfo.fillEntity(providerInfoAux[0]);

                } else if (isObject(providerInfoAux)) {
                  returnValue = returnValue && providerInfo.fillEntity(providerInfoAux);
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

                if(returnValue){
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
}
