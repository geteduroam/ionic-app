import { Component } from '@angular/core';
import {Events, NavController, NavParams} from 'ionic-angular';
import { LoadingProvider } from '../../providers/loading/loading';
import { ProfileModel } from '../../shared/models/profile-model';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { HTTP } from '@ionic-native/http/ngx';
import {BasePage} from "../basePage";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";
import {OauthConfProvider} from "../../providers/oauth-conf/oauth-conf";
import { Plugins } from '@capacitor/core';
import {ClientCertificatePassphrasePage} from "../clientCertificatePassphrase/clientCertificatePassphrase";
import {ProfilePage} from "../profile/profile";
const { OAuth2Client } = Plugins;

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
   * This provide the url to get a token
   */
  tokenURl: any;

  /**
   * Provide info from a certificate
   */
  providerInfo: ProviderInfo = new ProviderInfo();

  constructor(private http: HTTP, public navCtrl: NavController, public navParams: NavParams, protected loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, protected dictionary: DictionaryServiceProvider, protected event: Events,
              protected global: GlobalProvider, private errorHandler: ErrorHandlerProvider)  {
    super(loading, dictionary, event, global);

  }

  /**
   * Method to open browser and initialize the oAuth flow
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#authorization-endpoint}
   */
  buildFlowAuth() {
    OAuth2Client.authenticate({
      authorizationBaseUrl: this.profile.authorization_endpoint,
      accessTokenEndpoint: this.profile.token_endpoint,
      scope: 'eap-metadata',
      pkceEnabled: true,

      appId: this.global.getClientId(),
      responseType: 'code',
      redirectUrl: this.global.getClientId() + ':/',
    }).then(resourceUrlResponse => {
      console.log('res oAuth: ', resourceUrlResponse);

      this.handleOAuthResponse(resourceUrlResponse);

    }).catch(reason => {
      this.closeEventBrowser(reason);
    });
  }


  closeEventBrowser(error?: boolean) {
    this.loading.create();
    this.navCtrl.pop();
    if (!!error) {
      this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-oauth'), false, '', '', true);
      this.navCtrl.pop();
    }
    this.loading.dismiss();
  }

  /**
   * Method to create request to token
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#token-endpoint}
   * @param res url to get token
   */
  async handleOAuthResponse(res) {
    this.showSpinner();

    this.profile.token = res['access_token'];

    const validProfile:boolean = await this.getEduroamServices.eapValidation(this.profile);
    if (validProfile) {
      this.showAll = false;
      const validMethod = this.global.getAuthenticationMethod();
      if (validMethod.eapMethod.type.toString() === '13') {
        await this.navCtrl.push(ClientCertificatePassphrasePage, '', {animation: 'transition'});
      } else {
        await this.navCtrl.push(ProfilePage, '', {animation: 'transition'});
      }
    } else {
      this.providerInfo = this.global.getProviderInfo();
      await this.notValidProfile();
    }
  }

  /**
   * Lifecycle: Method executed when the class did enter, usually when swipe back from the next page
   */
  async ionViewDidEnter() {
    this.loading.createAndPresent();
    this.profile = this.navParams.get('profile');
    this.buildFlowAuth();
    this.loading.dismiss();
    this.showAll = true;
  }

  /**
   * Method to build spinner loading
   */
  showSpinner() {
    this.loading.createAndPresent();
  }

  /**
   * Method to check message when profile is not valid
   */
  async notValidProfile() {
    if(!!this.providerInfo) {

      let url = this.checkUrlInfoProvide();

      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-method'), true, url);

    } else {

      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-profile'), true, '');
    }
    await this.navCtrl.pop();
  }

  /**
   * Method to check if provider info contains links
   * and show it on error page
   */
  checkUrlInfoProvide() {
    return !!this.providerInfo.helpdesk.webAddress ? this.providerInfo.helpdesk.webAddress :
        !!this.providerInfo.helpdesk.emailAddress ? this.providerInfo.helpdesk.emailAddress : '';
  }
}
