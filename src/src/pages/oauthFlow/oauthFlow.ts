import { Component } from '@angular/core';
import {Events, NavController, NavParams} from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { LoadingProvider } from '../../providers/loading/loading';
import { ProfileModel } from '../../shared/models/profile-model';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { oAuthModel } from '../../shared/models/oauth-model';
import { HTTP } from '@ionic-native/http/ngx';
import {BasePage} from "../basePage";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";

declare var window: any;

@Component({
  selector: 'page-oauthFlow',
  templateUrl: 'oauthFlow.html',
})
export class OauthFlow extends BasePage{

  showAll: boolean = false;
  profile: ProfileModel;
  tokenURl: any;
  validMethod: AuthenticationMethod = new AuthenticationMethod();

  providerInfo: ProviderInfo = new ProviderInfo();

  constructor(private http: HTTP, public navCtrl: NavController, public navParams: NavParams, protected loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, protected dictionary: DictionaryServiceProvider, protected event: Events,
              protected global: GlobalProvider, private errorHandler: ErrorHandlerProvider)  {
    super(loading, dictionary, event, global);

  }

  async navigateTo() {
    this.showAll = false;
    await this.navCtrl.push(WifiConfirmation, {}, {animation: 'transition'});
  }

  /**
   * Method executed when the class did enter, usually when swipe back from the next page
   */
  async ionViewDidEnter() {
    this.loading.createAndPresent();
    this.profile = this.navParams.get('profile');
    console.log('profile taken form navParams: ', this.profile);
   // this.geteduroamServices.buildAuthUrl(this.profile.authorization_endpoint);
    //this.geteduroamServices.buildGenerator(this.profile.eapconfig_endpoint);

/*    this.geteduroamServices.buildTokenUrl(this.profile.token_endpoint);

  profile: {
      eapconfig_endpoint: "https://geteduroam.no/generate.php"
      token_endpoint: "https://geteduroam.no/token.php"
      authorization_endpoint: "https://geteduroam.no/authorize.php"
    }
     */
    await this.getData();
    this.loading.dismiss();
    this.showAll = true;
  }

// TODO: REFACTOR set global if necessary
  async getData() {
    const oauth2Options: oAuthModel = {
      client_id: this.global.getClientId(),
      oAuthUrl: this.profile.authorization_endpoint,
      type: "code",
      redirectUrl: 'http://localhost:8080/',
      pkce: true,
      scope: 'eap-metadata',

    };

    let oAuth = await this.getEduroamServices.generateOAuthFlow(oauth2Options);

    this.buildFlowAuth(oAuth, oauth2Options, this.profile.token_endpoint);
  }

  buildFlowAuth(oAuth, oauth2Options, token_endpoint) {
     let urlToken;
     let browserRef = window.cordova.InAppBrowser.open(oAuth.uri, "_blank", "location=yes,clearsessioncache=no,clearcache=no,hidespinner=yes");

     const flowAuth = new Promise(function (resolve, reject) {

       browserRef.addEventListener('loadstart', (event) => {

        if (event.url.indexOf(oauth2Options.redirectUrl) === 0) {
          let urlData = event.url.split('code=')[1];
          let arrayData = urlData.split('&state=');
          let code = arrayData[0];
          let state = arrayData[1];

          if (state !== undefined && code !== undefined) {

            urlToken = `${token_endpoint}?client_id=${oauth2Options.client_id}&grant_type=authorization_code&code=${code}&code_verifier=${oAuth.codeVerifier}`;
            resolve(urlToken);
            let tokenRef = window.cordova.InAppBrowser.open(urlToken, "_blank", "location=yes,clearsessioncache=no,clearcache=no,hidespinner=yes");

            tokenRef.addEventListener('beforeload', () => {
              tokenRef.close();
            });

            browserRef.close();
            console.log('Closing InAppBrowser');
          }
        }
       });
     });

     flowAuth.then(async (res) => {
       console.log('Promise then:', res);
       await this.getToken(urlToken);
     });
  }

  async getToken(res) {
    console.log('Inside getToken');
    const response = await this.http.get(res, {}, {});
    /*
    access_token: "v2.local.bhFE0rDXByB6JYQByEmF8VwBbLWRZbde1reF5blnkvOHaJhdHmxxIVDz3ZlO-jjJ0pT6oA21PaIAqPeOMwMtbPmP9HYGEDcHBSXkif2GyKRYfpVCtfkbvB4wJUUqpkVQNvP1KMCA-9Jrt6kIIMZrH2ZUJli-yP4Y0Qc44BSAYAlEb-SGCQT0L5IKpFaR-1xaxyyyH6udm5tamn52S8co1umXUmNPCzGuDlK6b9sUlElWw-Rcz-JV21EmvwBiBN6Xlsatzg"
    token_type: "Bearer"
    expires_in: 3600
     */

    // TODO: POST -> CREATE BEARER AUTHORIZATION

    this.tokenURl = JSON.parse(response.data);

    console.log('token: ', this.tokenURl);

    let header = `'Authorization': '${this.tokenURl.token_type} ${this.tokenURl.access_token}'`;
    console.log('Auth header: ', header);

    console.log('oauth profile: ',this.profile);

    this.profile.token = this.tokenURl.access_token;

    const validProfile:boolean = await this.getEduroamServices.eapValidation(this.profile);

    console.log('validProfile', validProfile);

    this.manageProfileValidation(validProfile);

  }

  /**
   * Method to check form and navigate.
   */
  async checkForm() {

    //TODO change the method once the plugin is adapted to oauth flow

    console.log('this.validMethod: ',this.validMethod);
    let config = {
      ssid: this.global.getSsid(),
      username: this.validMethod.clientSideCredential.anonymousIdentity,
      password: this.validMethod.clientSideCredential.passphrase,
      eap: parseInt(this.validMethod.eapMethod.type.toString()),
      servername: 'geteduroam.no',
      auth: this.global.auth.MSCHAPv2,
      anonymous: '',
      caCertificate: this.validMethod.serverSideCredential.ca.content
    };

    const checkRequest = this.getEduroamServices.connectProfile(config);

    if (!!checkRequest) {
      this.navigateTo();
    }
  }

  async manageProfileValidation(validProfile: boolean){
    console.log('global providerInfo', this.global.getProviderInfo());
    this.providerInfo = this.global.getProviderInfo();
    if(validProfile){
      this.validMethod = this.global.getAuthenticationMethod();
      console.log('validMethod', this.validMethod);
      this.checkForm();
    } else {
      if(!!this.providerInfo){
        let url = !!this.providerInfo.helpdesk.webAddress ? this.providerInfo.helpdesk.webAddress :
            !!this.providerInfo.helpdesk.emailAddress ? this.providerInfo.helpdesk.emailAddress : '';
        console.log('*************************url', url);
        await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-method'), true, url);
        console.log('*********************************** after sending error');
      } else {
        await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-profile'), true, '');
      }
      await this.navCtrl.pop();
    }
  }
}
