import { Component } from '@angular/core';
import {Events, NavController, NavParams} from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { AuthenticationMethod } from '../../shared/entities/authenticationMethod';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';
import { LoadingProvider } from '../../providers/loading/loading';
import { ProviderInfo } from '../../shared/entities/providerInfo';
import {ValidatorProvider} from "../../providers/validator/validator";
import { ProfileModel } from '../../shared/models/profile-model';
import { ProvideModel } from '../../shared/models/provide-model';
import { GlobalProvider } from '../../providers/global/global';
import {BasePage} from "../basePage";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})

export class ProfilePage extends BasePage{

  showAll: boolean = false;

  /**
   * The profile which is received as a navigation parameter
   */
  profile: ProfileModel;

  /**
   * The provide which is received from form
   */
  provide: ProvideModel = new ProvideModel();

  /**
   * The authentication methods obtained from the eap institutionSearch file
   */
  authenticationMethods: AuthenticationMethod[];

  validMethod: AuthenticationMethod;

  providerInfo: ProviderInfo;

  termsOfUse: boolean = false;

  termsUrl: string = '';

  errorPass: boolean = false;

  suffixIdentity: string = '';

  constructor(private navCtrl: NavController, private navParams: NavParams, protected loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              private validator: ValidatorProvider, protected global: GlobalProvider, protected dictionary: DictionaryServiceProvider,
              protected event: Events) {
    super(loading, dictionary, event, global);

  }

  /**
   *  Method executed when the class did enter
   */
  async ionViewDidEnter() {
    const profile = await this.getProfile();
    this.profile = await this.waitingSpinner(profile);
    this.removeSpinner();
    this.showAll = true;
  }

  /**
   * Method to check form and navigate.
   */
  async checkForm() {

    if (!!this.validateForm()) {
      let config = {
        ssid: this.global.getSsid(),
        username: this.provide.email,
        password: this.provide.pass,
        eap: parseInt(this.validMethod.eapMethod.type.toString()),
        servername: this.validMethod.serverSideCredential.serverID,
        auth: this.global.auth.MSCHAPv2,
        anonymous: "",
        caCertificate: this.validMethod.serverSideCredential.ca.content
      };

      const checkRequest = this.getEduroamServices.connectProfile(config);

      if (!!checkRequest) {
        this.navigateTo();
      }
    }
  }

  async navigateTo() {
    this.showAll = false;

    !!this.providerInfo.providerLogo ? await this.navCtrl.setRoot(WifiConfirmation, {
      logo: this.providerInfo.providerLogo}, {  animation: 'transition'  }) :
      await this.navCtrl.setRoot(WifiConfirmation, {}, {animation: 'transition'});

  }
  /**
   * Method which returns the eap institutionSearch endpoint
   * @return {any} eapconfig_endpoint the eap institutionSearch endpoint
   */
  getEapconfigEndpoint() {
    return this.profile.eapconfig_endpoint;
  }

  /**
   * Method to activate terms of use on view.
   */
  protected createTerms() {
    if (this.providerInfo.termsOfUse !== '') {
      // Activate checkbox on view
      this.termsOfUse = true;

      const terms = this.providerInfo.termsOfUse.toString();
      // Get the web address within the terms of use
      this.termsUrl = !!terms.match(/\bwww?\S+/gi) ? 'http://'+terms.match(/\bwww?\S+/gi)[0] :
        !!terms.match(/\bhttps?\S+/gi) ? terms.match(/\bhttps?\S+/gi)[0] : terms.match(/\bhttp?\S+/gi)[0];

    }
  }

  /**
   * Method to get the first valid authentication method form an eap institutionSearch file.
   * @return {AuthenticationMethod} the first valid authentication method
   */
  private async getFirstValidAuthenticationMethod() {

    for (let authenticationMethod of this.authenticationMethods) {
      if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
        return authenticationMethod;
      }
    }

    let url = !!this.providerInfo.helpdesk.webAddress ? this.providerInfo.helpdesk.webAddress :
      !!this.providerInfo.helpdesk.emailAddress ? this.providerInfo.helpdesk.emailAddress : '';

    await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-method'), true, url);
    return null;
  }



  async getProfile() {
    this.profile = !!this.navParams.get('profile') ? this.navParams.get('profile') : this.global.getProfile();
    this.checkValidation();
    return this.profile;
  }

  async checkValidation() {
    this.authenticationMethods = [];
    this.providerInfo = new ProviderInfo();

    const eapConfig = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);
    const validEap:boolean = await this.validator.validateEapconfig(eapConfig, this.authenticationMethods, this.providerInfo);

    if (validEap) {
      this.validMethod = await this.getFirstValidAuthenticationMethod();

      if (!!this.validMethod) {

        this.suffixIdentity = !!this.validMethod && !!this.validMethod.clientSideCredential.innerIdentityHint ?
          this.validMethod.clientSideCredential.innerIdentitySuffix : '';

        this.createTerms();
      }

    } else {
      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-eap'), false);
    }
  }

  /**
   * Method to validate form.
   * @return {boolean}
   */
  validateForm(): boolean {
    const validateTerms = !!this.termsOfUse && !!this.provide.terms ? true : !this.termsOfUse;

    return this.validEmail(this.provide.email) && this.provide.pass !== '' && validateTerms;
  }

  validEmail(email: string) {
    return this.validator.validateEmail(email, this.suffixIdentity);
  }

}
