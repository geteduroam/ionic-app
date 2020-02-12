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
              private validator: ValidatorProvider, private dictionary: DictionaryServiceProvider, private global: GlobalProvider) {

  }

  /**
   * This discovery method retrieves all institutions and their profiles from a [json]{@link https://discovery.geteduroam.no/discovery-v1.json}:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#discovery}
   *
   */
   async discovery() {

    // const url = 'https://discovery.geteduroam.no/discovery-v1.json';

      //TODO replace the fake data json for the real one before go to PRO environment
      //   const url = 'https://drive.google.com/file/d/1HbtpkGoB7Yc_rhnITYgXWJ8-gLzeMgoR/view?usp=sharing';
      const url = 'https://drive.google.com/a/emergya.com/uc?authuser=0&id=1HbtpkGoB7Yc_rhnITYgXWJ8-gLzeMgoR&export=download';

        // const url = '../../../resources/fake-data/fake-data.ts';
        const params = {};
        const headers = {};

        try {
            const response = await this.http.get(url, params, headers);

            return JSON.parse(response.data);

            // return JSON.parse(FAKE_DATA.toString());

        } catch (e) {
            console.log(e);
            await this.errorHandler.handleError(e.error,false);
        }
  }

    /**
     * This gets an eapcongig file form an url which receives as parameter
     * @param url in which the eapconfig xml file is available
     * @return the parsed xml
     */
    async getEapConfig(url: string, token?:string) {

        const params = {};

        let headers = {};
        if(token){
            headers = {'Authorization': 'Bearer ' + token};
        }
        let response: any;

        if (url.includes('eap-config')) {

          response = await this.store.readExtFile(url);
          response.data = atob(response.data);

        } else {
          response = await this.http.get(url, params, headers);
        }
        let jsonResult = '';

        xml2js.parseString(response.data, function (err, result) {
            jsonResult = result;
        });

        return jsonResult;

    }

  /**
   * This method is to work with the oAuthEndpoint method:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#authorization-endpoint}
   *
   * @param data
   */
  buildAuthUrl(data: any) {
    //
    // // TODO: Build code_challenge
    // const oauthParams = {
    //   client_id: data.client_id,
    //   oAuthUrl: "authorize.php",
    //   type: "code",
    //   redirectUrl: 'http://localhost:8080/',
    //   pkce: true,
    //   scope: 'eap-metadata',
    //   code_challenge: data.code_challenge
    // };
    //
    // // Example: https://demo.eduroam.no/authorize.php?response_type=code&code_challenge_method=S256&scope=eap-metadata&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&redirect_uri=http://localhost:8080/authorize.php&client_id=00000000-0000-0000-0000-000000000000&state=0
    // const url = `${this.url}/${oauthParams.oAuthUrl}/response_type=${oauthParams.type}&code_challenge_method=&scope=${oauthParams.scope}&code_challenge=${oauthParams.code_challenge}&redirect_uri=${oauthParams.redirectUrl}/authorize.php&client_id=${oauthParams.client_id}&state=0`;
    //
    // this.http.get(url, {}).subscribe((data) => {
    //   console.log('Method get to oAuthEndpoint', data);
    //
    //   this.buildTokenUrl('')
    // })
  }

  /**
   * This method is to work with the token endpoint method:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#token-endpoint}
   *
   * @param {string} code
   */
  buildTokenUrl(code: string) {

    // // TODO: Build code_verifier
    // const tokenParams = {
    //   grant_type: 'authorization_code',
    //   code,
    //   code_verifier: ''
    // };
    //
    // // Example: GET /token.php?grant_type=authorization_code&code=v2.local.AAAAAA&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    // const url = `${this.url}/token.php?grant_type=${tokenParams.grant_type}&code=${code}&code_verifier=${tokenParams.code_verifier}`;
    //
    // this.http.get(url, {}).subscribe((token) => {
    //   console.log('Method get TokenAuth: ', token);
    //   this.buildGenerator(token);
    // });
  }

  /**
   * This method is to work with the generator endpoint method:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#generator-endpoint}
   *
   * @param data
   */
  buildGenerator(data: any){

  // // Example: /generate.php?format=eap-metadata
  //   const url = ``;
  //
  //   //TODO: Build Header Authorization: Bearer AAAAAA==${token}
  //   this.http.get(url, {}).subscribe((res) => {
  //     console.log('Method get generator: ', res);
  //
  //   });
  }

  async connectProfile(config) {
      if (this.global.getOverrideProfile()){
          let config = {
              ssid: this.global.getSsid()
          }
          this.removeProfile(config);
      }
      return await WifiEapConfigurator.configureAP(config);
  }

    async removeProfile(config) {
        return await WifiEapConfigurator.removeNetwork(config);
    }



  // TODO: MOVE TO CRYPTO
  generateRandomString(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  async generateOAuthFlow(data: oAuthModel) {

    let url = `${data.oAuthUrl}?client_id=${data.client_id}&response_type=${data.type}&redirect_uri=${data.redirectUrl}&scope=${data.scope}&state=${this.randomString(10)}`;
    let codeVerifier = this.generateRandomString(43);
    let codeChallenge = await CryptoUtil.deriveChallenge(codeVerifier);
    if (!!data.pkce) {
      let codeChallengeMethod='S256';
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

  randomString(length: number) {
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let text = "";
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

    public async getFirstAuthenticationMethod(authenticationMethods: AuthenticationMethod[], providerInfo: ProviderInfo):Promise<AuthenticationMethod>{
        for (let authenticationMethod of authenticationMethods) {
            if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
                return authenticationMethod;
            }
        }

        console.log('No valid method');

        // let url = !!providerInfo.helpdesk.webAddress ? providerInfo.helpdesk.webAddress :
        //     !!providerInfo.helpdesk.emailAddress ? providerInfo.helpdesk.emailAddress : '';
        //
        // await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-method'), true, url);
        return null;
    }

    /**
     * Method to get the first valid authentication method form an eap institutionSearch file.
     * @return {AuthenticationMethod} the first valid authentication method
     */
    public async eapValidation(profile:ProfileModel):Promise<boolean> {

        console.log('before using profile.eapconfig_endpoint: ', profile.eapconfig_endpoint);

        let eapConfigFile: any;

        console.log('profile.oauth', profile.oauth);
        console.log('profile.token', profile.token);

        if(profile.oauth){
            eapConfigFile = await this.getEapConfig(profile.eapconfig_endpoint+'?format=eap-metadata', profile.token);
            console.log('eapConfigFile', eapConfigFile);
        } else{
            eapConfigFile = await this.getEapConfig(profile.eapconfig_endpoint);

        }

        let authenticationMethods:AuthenticationMethod[] = [];
        let providerInfo:ProviderInfo= new ProviderInfo();

        const validEap:boolean = this.validateEapconfig(eapConfigFile, authenticationMethods, providerInfo);

        console.log('*********************************** validEap', validEap);

        if (validEap){
            this.global.setProviderInfo(providerInfo);
            let authenticationMethod: AuthenticationMethod = await this.getFirstAuthenticationMethod(authenticationMethods, providerInfo);
            if(!!authenticationMethod){
                this.global.setAuthenticationMethod(authenticationMethod);
                return true;
            } else{
                return false;
            }
        } else {
            this.global.setProviderInfo(null);
            return false;
        }
    }


    // TODO: REFACTOR VALIDATE EAP-CONFIG
    /**
     * Method to validate the eapconfig file and obtain its elements.
     * This method validates and updates the property [authenticationMethods]{@link #authenticationMethods}
     */
    validateEapconfig(eapConfig: any, authenticationMethods: AuthenticationMethod[], providerInfo: ProviderInfo): boolean{

        let returnValue:boolean = true;

            let keys = [
            'EAPIdentityProviderList',
            'EAPIdentityProvider',
            'AuthenticationMethods',
            'AuthenticationMethod'
        ];



        let jsonAux = eapConfig;

        //----------------
        // EAP-CONFIG
        //----------------
        if (!!jsonAux){
            console.log('Eap content: ',jsonAux);
            for (let key of keys){
                if (returnValue){
                    jsonAux = this.readJson(jsonAux, key);
                    if(jsonAux == null){
                        console.log('jsonAux is null');
                        returnValue = false;
                    } else if (key === 'EAPIdentityProvider'){
                        //----------------
                        // Provider Info
                        //----------------
                        let providerInfoAux = this.readJson(jsonAux, 'ProviderInfo');
                        console.log('jsonAux after getting providerInfoAux:',jsonAux);
                        if(providerInfoAux != null){
                            if (isArray(providerInfoAux)){
                                console.log('providerInfoAux array', providerInfoAux[0]);
                                returnValue = returnValue && providerInfo.fillEntity(providerInfoAux[0]);
                            } else if (isObject(providerInfoAux)){
                                console.log('providerInfoAux object', providerInfoAux);
                                returnValue = returnValue && providerInfo.fillEntity(providerInfoAux);
                            }
                        }
                    }
                }
            }

            //--------
            // AUTHENTICATION METHODS
            //--------

            // authenticationMethods = [];

            if (jsonAux != null && returnValue){
                for (let i in jsonAux){
                    console.log('AuthenticationMethod: ', jsonAux[i]);
                    if(!!jsonAux[i] && returnValue){
                        let authenticationMethodAux = new AuthenticationMethod();
                        try {
                            returnValue = returnValue && authenticationMethodAux.fillEntity(jsonAux[i]);
                            console.log('TRY for the authentication method');
                            if(returnValue){
                                authenticationMethods.push(authenticationMethodAux);
                            }
                        } catch (e) {
                            console.log('CATCH when the authentication method is WRONG');
                            returnValue = false;
                        }
                    }
                }
            }

        } else {
            console.error('wrong json', eapConfig);
            returnValue = false;
        }
        console.log('authentication: ', authenticationMethods);
        return returnValue;
    }

    private readJson(jsonAux: JSON, key: string):JSON{
        let returnedJson: JSON;
        if (isArray(jsonAux)){
            if (jsonAux[0].hasOwnProperty(key)){
                console.log('adding the array key', key, jsonAux[0][key]);
                returnedJson = jsonAux[0][key];
            } else {
                console.error('Invalid eapconfig file, it does not contain the array key '+key, jsonAux);
                return null;
            }

        } else if (isObject(jsonAux)) {
            if (jsonAux.hasOwnProperty(key)) {
                console.log('adding the object key', key, jsonAux[key]);
                returnedJson = jsonAux[key];
            } else {
                console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
                return null;
            }

        } else {
            console.error('Invalid eapconfig file', jsonAux);
            return null;
        }
        return returnedJson;
    }

}
