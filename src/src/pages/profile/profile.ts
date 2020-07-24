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

  /**
   * First valid authentication method
   */
  validMethod: AuthenticationMethod;

  /**
   * Info provider from eap-config file
   */
  providerInfo: ProviderInfo;

  /**
   * Check terms of use
   */
  termsOfUse: boolean = false;

  /**
   * Link url of terms of use
   */
  termsUrl: string = '';

  /**
   * It checks password
   */
  errorPass: boolean = false;

  /**
   * Identity of institution
   */
  suffixIdentity: string = '';

  constructor(private navCtrl: NavController, private navParams: NavParams, protected loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              private validator: ValidatorProvider, protected global: GlobalProvider, protected dictionary: DictionaryServiceProvider,
              protected event: Events) {
    super(loading, dictionary, event, global);

  }

  /**
   * Method to show dynamically identity institution on email input
   */
  getEmail() {
    if (!!this.provide.email && !this.provide.email.includes('@') && !!this.suffixIdentity) {
      this.provide.email = `${this.provide.email}@${this.suffixIdentity}`;
    }
  }

  /**
   * Method to get dynamically placeholder on input
   */
  getPlaceholder() {
    if (this.suffixIdentity !== '') {
      return `username@${this.suffixIdentity}`;
    } else {
      return this.getString('placeholder', 'example');
    }
  }

  /**
   * Method to check form and navigate.
   */
  async checkForm() {
    if (!!this.validateForm()) {

      let config = this.configConnection();
      const checkRequest = this.getEduroamServices.connectProfile(config);

      console.log(checkRequest);

      if (!!checkRequest) {
        this.navigateTo();
      }
    }
  }

  /**
   * Navigation and check if navigation is active
   */
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
   * Check profile selected
   */
  async getProfile() {
    let profileAux = this.navParams.get('profile');
    this.profile = !!profileAux && profileAux ? this.navParams.get('profile') : this.global.getProfile();
    return this.profile;
  }

  /**
   * Method which returns the eap institutionSearch endpoint
   * @return {any} eapconfig_endpoint the eap institutionSearch endpoint
   */
  getEapconfigEndpoint() {
    return this.profile.eapconfig_endpoint;
  }

  /**
   * Method to validate form.
   * @return {boolean}
   */
  validateForm(): boolean {
    const validateTerms = !!this.termsOfUse && !!this.provide.terms ? true : !this.termsOfUse;

    return this.validEmail(this.provide.email) && this.provide.pass !== '' && validateTerms;
  }

  /**
   * Method to validate email.
   * @return {boolean}
   */
  validEmail(email: string) {
    return this.validator.validateEmail(email, this.suffixIdentity);
  }

  /**
   * Method to manage validation profile
   * @param validProfile check if profile is valid
   */
  async manageProfileValidation(validProfile: boolean){
    this.providerInfo = this.global.getProviderInfo();

    if (validProfile) {

      this.validMethod = this.global.getAuthenticationMethod();

      if (!!this.validMethod.clientSideCredential.innerIdentitySuffix) {
        this.suffixIdentity = this.validMethod.clientSideCredential.innerIdentitySuffix;
      }

    } else {
      await this.notValidProfile();
    }
  }

  /**
   * Method to check message when profile is not valid
   */
  async notValidProfile() {
    if(!!this.providerInfo){

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

  /**
   *  Lifecycle method executed when the class did load
   */
  async ionViewDidLoad() {
    const profile = await this.getProfile();
    this.profile = await this.waitingSpinner(profile);
    const validProfile:boolean = await this.getEduroamServices.eapValidation(this.profile);
    this.manageProfileValidation(validProfile);
  }

  /**
   *  Lifecycle method executed when the class did enter
   */
  async ionViewDidEnter() {
    this.removeSpinner();
    this.showAll = true;
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
   * Method to create configuration to plugin WifiEapConfigurator
   */
  private configConnection() {
    let certificates : string = '';
    for (let entry of this.validMethod.serverSideCredential.ca){
      let strAux : string = entry['content'];
      certificates = certificates.concat(strAux ,';');
    }
    let serverIDs : string = '';
    for (let entry of this.validMethod.serverSideCredential.serverID){
      let strAux : string = entry;
      serverIDs = serverIDs.concat(strAux ,';');
    }
    // If only one certificate, remove the ';'
    if (this.validMethod.serverSideCredential.ca.length == 1){
      certificates = certificates.slice(0, -1);
    }
    serverIDs = serverIDs.slice(0, -1);
    return {
      // TODO: // Use the SSDI from the Profile according to https://github.com/geteduroam/ionic-app/issues/24
      ssid: this.global.getSsid(),
      username: this.provide.email,
      password: this.provide.pass,
      eap: parseInt(this.validMethod.eapMethod.type.toString()),
      servername: serverIDs,
      auth: this.global.auth.MSCHAPv2,
      anonymous: "",
      caCertificate: certificates,
      longestCommonSuffix: this.longestCommonSuffix(this.validMethod.serverSideCredential.serverID)
    };
  }

  private longestCommonSuffix(input){
    let array = input.map(function(e) {
      e = e.split("").reverse().join("");
      return e;
    });
    let sortedArray = array.sort();
    let first = sortedArray[0];
    let last = sortedArray.pop();
    let length = first.length;
    let index = 0;
    while(index<length && first[index] === last[index])
      index++;
    let candidate = first.substring(0, index).split("").reverse().join("");
    if (!input.includes(candidate)) { // if this happens it is because is a common suffix
      let parts = candidate.split('.');
      if (parts.length > 2) {
        parts.shift(); // removing the first one
        candidate = parts.join('.');
      } else {
        candidate = '';
      }
    }
    return candidate;
  }
}
