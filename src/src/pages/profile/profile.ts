import { Component } from '@angular/core';
import { Events, NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { AuthenticationMethod } from '../../shared/entities/authenticationMethod';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';
import { LoadingProvider } from '../../providers/loading/loading';
import { ProviderInfo } from '../../shared/entities/providerInfo';
import { ValidatorProvider } from "../../providers/validator/validator";
import { ProfileModel } from '../../shared/models/profile-model';
import { ProvideModel } from '../../shared/models/provide-model';
import { GlobalProvider } from '../../providers/global/global';
import { BasePage } from "../basePage";
import { DictionaryServiceProvider } from "../../providers/dictionary-service/dictionary-service-provider.service";

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
    console.log('constructor');

  }

  /**
   *  Method executed when the class did load
   */
  async ionViewDidLoad() {
    console.log('ionViewDidLoad');
    const profile = await this.getProfile();
    this.profile = await this.waitingSpinner(profile);
    console.log('profile value before validating: ', this.profile);
    const validProfile:boolean = await this.getEduroamServices.eapValidation(this.profile);
    this.manageProfileValidation(validProfile);
  }

  /**
   *  Method executed when the class did enter
   */
  async ionViewDidEnter() {
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
    if (this.activeNavigation) {
      this.showAll = false;

      !!this.providerInfo.providerLogo ? await this.navCtrl.setRoot(WifiConfirmation, {
          logo: this.providerInfo.providerLogo}, {  animation: 'transition'  }) :
        await this.navCtrl.setRoot(WifiConfirmation, {}, {animation: 'transition'});
    } else {
      await this.alertConnectionDisabled();
    }

  }
  /**
   * Method which returns the eap institutionSearch endpoint
   * @return {any} eapconfig_endpoint the eap institutionSearch endpoint
   */
  getEapconfigEndpoint() {
    console.log('using eapconfig_endpoint');
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


  async getProfile() {
    let profileAux = this.navParams.get('profile');
    console.log('entra en getProfile con profileAux: ', profileAux, ' y global profile: ', this.global.getProfile());
    this.profile = !!profileAux && profileAux!= undefined && profileAux ? this.navParams.get('profile') : this.global.getProfile();
    // this.checkValidation();
    return this.profile;
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

  async manageProfileValidation(validProfile: boolean){
    console.log('global providerInfo', this.global.getProviderInfo());
    this.providerInfo = this.global.getProviderInfo();
    if(validProfile){
      this.validMethod = this.global.getAuthenticationMethod();
    } else {
      if(!!this.providerInfo && this.providerInfo != undefined){
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
