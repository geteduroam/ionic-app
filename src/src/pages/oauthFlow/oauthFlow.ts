import { Component } from '@angular/core';
import {Events, NavController, NavParams} from 'ionic-angular';
import { LoadingProvider } from '../../providers/loading/loading';
import { ProfileModel } from '../../shared/models/profile-model';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import {BasePage} from "../basePage";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";
import {OauthConfProvider} from "../../providers/oauth-conf/oauth-conf";
import '@capacitor-community/http';
import { AppUrlOpen, Plugins } from '@capacitor/core';
const { OAuth2Client, Device, App, Http, Browser } = Plugins;

@Component({
  selector: 'page-oauthFlow',
  templateUrl: 'oauthFlow.html',
})

export class OauthFlow extends BasePage{

  showAll: boolean = false;

  /**
   * Model Profile
   */
  profile: ProfileModel;

  /**
   * Provide info from a certificate
   */
  providerInfo: ProviderInfo = new ProviderInfo();

  constructor(public navCtrl: NavController, public navParams: NavParams, protected loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, protected dictionary: DictionaryServiceProvider, protected event: Events,
              protected global: GlobalProvider, private errorHandler: ErrorHandlerProvider)  {
    super(loading, dictionary, event, global);

  }

  /**
   * Method to open browser and initialize the oAuth flow
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#authorization-endpoint}
   */
  async buildFlowAuth() {
    const device = await Device.getInfo();
    const optionsOAuth = {
      authorizationBaseUrl: this.profile.authorization_endpoint,
      accessTokenEndpoint: this.profile.token_endpoint,
      scope: 'eap-metadata',
      pkceEnabled: true,
      appId: this.global.getClientId(),
      responseType: 'code',
      redirectUrl: this.global.getClientId() + ':/',
    };

    if (device.name.indexOf('Mac') === -1) {

    OAuth2Client.authenticate(optionsOAuth).then(resourceUrlResponse => {
      this.handleOAuthResponse(resourceUrlResponse);
    }).catch(async (reason) => {
        this.closeEventBrowser(reason);
    });
  }
  else {
    this.macCatalystFlow(optionsOAuth);
}
  }

  async macCatalystFlow(options: any ) {
    let oAuth = await this.getEduroamServices.generateOAuthFlow(options);

    await Browser.open({url: `${this.profile.authorization_endpoint}?client_id=${this.global.getClientId()}&redirect_uri=${this.global.getClientId()}:/&response_type=code&scope=eap-metadata&code_challenge=${oAuth.codeChallenge}&code_challenge_method=S256&state=${oAuth.state}`})
    App.addListener('appUrlOpen', async (urlOpen: AppUrlOpen) => {

      if (urlOpen.url.indexOf('&code=') == -1) {
        console.log('app: ', App.getState());
        let urlData = urlOpen.url.split('code=')[1];
        let arrayData = urlData.split('&state=');
        let headers = {'Content-Type':'application/x-www-form-urlencoded'};
        let code = arrayData[0];
        let state = arrayData[1];
        let data = {
          'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': options.redirectUrl,
            'client_id': this.global.getClientId(),
            'code_verifier': oAuth.codeVerifier,
        };
        const response = await Http.request({
          method: 'POST',
          url: this.profile.token_endpoint,
          headers,
          data
        });
        console.log(response.data);
        this.profile.token = response.data.access_token;

        const validProfile:boolean = await this.getEduroamServices.eapValidation(this.profile);
        const oauthConf: OauthConfProvider = new OauthConfProvider(this.global, this.getEduroamServices, this.loading, this.errorHandler, this.dictionary, this.navCtrl);
        this.providerInfo = this.global.getProviderInfo();
        await oauthConf.manageProfileValidation(validProfile, this.providerInfo);
      }
    });

    /*

    this.buildFlowAuth(oAuth, oauth2Options, this.profile.token_endpoint);

     */
  }

  closeEventBrowser(error?: boolean) {
    this.loading.create();
    this.navCtrl.pop();
    if (!!error) {
      this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-oauth'), false, '', '', true);
    }
    this.loading?.dismiss();
  }

  /**
   * Method to create request to token
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#token-endpoint}
   * @param res url to get token
   */
  async handleOAuthResponse(res) {
    console.log('handleOAuthResponse: ', res);
    this.profile.token = res['access_token'];

    const validProfile:boolean = await this.getEduroamServices.eapValidation(this.profile);
    const oauthConf: OauthConfProvider = new OauthConfProvider(this.global, this.getEduroamServices, this.loading, this.errorHandler, this.dictionary, this.navCtrl);
    this.providerInfo = this.global.getProviderInfo();
    await oauthConf.manageProfileValidation(validProfile, this.providerInfo);
  }

  /**
   * Lifecycle: Method executed when the class did enter, usually when swipe back from the next page
   */
  async ionViewDidEnter() {
    this.loading.createAndPresent();
    this.profile = this.navParams.get('profile');
    this.buildFlowAuth();
    this.loading?.dismiss();
    this.showAll = true;
  }
}
