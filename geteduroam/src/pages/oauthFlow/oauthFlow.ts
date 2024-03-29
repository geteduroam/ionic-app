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
import { OAuth2Client } from "@byteowls/capacitor-oauth2";

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
    }
    this.loading?.dismiss();
  }

  /**
   * Method to create request to token
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#token-endpoint}
   * @param res url to get token
   */
  async handleOAuthResponse(res) {
    this.profile.token = res.access_token_response.access_token;

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
