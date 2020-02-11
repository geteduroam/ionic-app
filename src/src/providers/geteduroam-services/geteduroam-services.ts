import { HTTP } from '@ionic-native/http/ngx';
import { Injectable } from '@angular/core';
import xml2js from 'xml2js';
import {ErrorHandlerProvider} from "../error-handler/error-handler";
import { StoringProvider } from '../storing/storing';
declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;


/**
 *  @class GeteduroamServices provider
 */
@Injectable()
export class GeteduroamServices {

  constructor(private http: HTTP, private errorHandler : ErrorHandlerProvider, private store: StoringProvider) {

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
    async getEapConfig(url: string) {

        const params = {};
        const headers = {};
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
    return await WifiEapConfigurator.configureAP(config);
  }
}
