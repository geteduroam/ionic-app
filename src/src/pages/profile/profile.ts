import { Component } from '@angular/core';
import {Events, NavController, NavParams, ViewController} from 'ionic-angular';
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

  /**
   * This say if we must give him some hint about the identity
   */
  hintIdentity: boolean;

  /**
   * Used in the view to check error message if the email is not valid
   */
  validMail: boolean = true;

  /**
   * Show if the username include the valid suffix
   */
  validSuffix: boolean = true;

  /**
   * Enable button next
   */
  enableButton: boolean = false;

  constructor(private navCtrl: NavController, private navParams: NavParams, protected loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              private validator: ValidatorProvider, protected global: GlobalProvider, protected dictionary: DictionaryServiceProvider,
              protected event: Events, private viewCtrl: ViewController) {
    super(loading, dictionary, event, global);

  }

  /**
   * Method to show dynamically identity institution on email input
   */
  getRealmEmail() {
    if (!!this.provide.email && !this.provide.email.includes('@') && !!this.suffixIdentity && !!this.hintIdentity) {
      this.provide.email = `${this.provide.email}@${this.suffixIdentity}`;
    }
  }

  /**
   * Method to get dynamically placeholder on input
   */
  getPlaceholder() {
    if (this.suffixIdentity !== '' && !!this.hintIdentity) {
      return `username@${this.suffixIdentity}`;
    } else if (this.suffixIdentity !== '' && !this.hintIdentity) {
      return `username@${this.suffixIdentity}`;
    } else {
      return this.getString('placeholder', 'example');
    }
  }

  /**
   * Method to check form and navigate.
   */
  async checkForm() {
    if (!!this.enableButton) {
      this.showAll = false;
      let config = this.configConnection();
      const checkRequest = await this.getEduroamServices.connectProfile(config);

      if (checkRequest.message.includes('success') || checkRequest.message.includes('error.network.linked')) {
        await this.navigateTo();
      }else if (checkRequest.message.includes('error.network.alreadyAssociated')) {
        await this.errorHandler.handleError(
            this.dictionary.getTranslation('error', 'available1') + this.global.getSsid() +
            this.dictionary.getTranslation('error', 'available2') +
            this.global.getSsid() + '.', false, '', '', true);
      } else if (checkRequest.message.includes('error.network.userCancelled')) {
        this.showAll = true;
      } else {
        await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-eap'), true, '');
      }
    }
  }

  /**
   * Navigation and check if navigation is active
   */
  async navigateTo() {
    !!this.providerInfo.providerLogo ? await this.navCtrl.setRoot(WifiConfirmation, {
      logo: this.providerInfo.providerLogo}, {  animation: 'transition'  }) :
    await this.navCtrl.setRoot(WifiConfirmation, {}, {animation: 'transition'});

  }

  /**
   * Check profile selected
   */
  /*async getProfile() {
    let profileAux = this.navParams.get('profile');
    this.profile = !!profileAux && profileAux ? this.navParams.get('profile') : this.global.getProfile();
    return this.profile;
  }*/

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
  validateForm(): void {
    const validateTerms = !!this.termsOfUse && !!this.provide.terms ? true : !this.termsOfUse;
    if (!!this.suffixIdentity) {
      this.validEmail(this.provide.email);
      this.enableButton = this.validMail && this.provide.pass !== '' && validateTerms;
    } else {
      this.enableButton = this.provide.email !== '' && this.provide.pass !== '' && validateTerms;
    }
  }

  /**
   * Method to validate email.
   * @return {boolean}
   */
  validEmail(email: string) {
    if (!!this.suffixIdentity && email !== '') {
      this.validMail = this.validator.validateEmail(email, this.suffixIdentity);
    }
  }

  /**
   * Check if the email include the suffix and it's correct
   * @param email
   */
  checkSuffix(email: string) {
    if (!!this.suffixIdentity && this.suffixIdentity !== '' &&  email !== '' && !!this.hintIdentity) {
      this.validSuffix = email.includes(`@${this.suffixIdentity}`);
    } else if (!!this.suffixIdentity && this.suffixIdentity !== '' && email !== '' && !this.hintIdentity) {
      this.validSuffix = email.includes(this.suffixIdentity);
    }
  }

  blur() {
    this.getRealmEmail();
    this.checkSuffix(this.provide.email);
    this.validateForm();
  }

  /**
   * Method to manage validation profile
   * @param validProfile check if profile is valid
   */
  async manageProfileValidation(){
    this.providerInfo = this.global.getProviderInfo();

    this.validMethod = this.global.getAuthenticationMethod();

    if (!!this.validMethod.clientSideCredential.innerIdentitySuffix) {
      this.suffixIdentity = this.validMethod.clientSideCredential.innerIdentitySuffix;
    }

    if (!!this.validMethod.clientSideCredential.innerIdentityHint) {
      this.hintIdentity = (this.validMethod.clientSideCredential.innerIdentityHint === 'true');
    } else {
      this.hintIdentity = false;
    }
  }

  /**
   * Method to check message when profile is not valid
   */
  /*async notValidProfile() {
    if(!!this.providerInfo){

      let url = this.checkUrlInfoProvide();

      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-method'), true, url);

    } else {

      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-profile'), true, '');
    }
    await this.navCtrl.pop();
  }*/

  /**
   *  Lifecycle method executed when the class did load
   */
  async ionViewDidLoad() {
    this.loading.createAndPresent();
    await this.manageProfileValidation();
  }

  /**
   *  Lifecycle method executed when the class did enter
   */
  async ionViewDidEnter() {
    if (this.validMethod.clientSideCredential.username && this.validMethod.clientSideCredential.password) {
      this.provide.email = this.validMethod.clientSideCredential.username;
      this.provide.pass = this.validMethod.clientSideCredential.password;
      this.enableButton = true;
      await this.checkForm();
    } else {
      this.removeSpinner();
      this.showAll = true;
    }
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
    return {
      // TODO: // Use the SSDI from the Profile according to https://github.com/geteduroam/ionic-app/issues/24
      ssid: this.global.getSsid(),
      username: this.provide.email,
      password: this.provide.pass,
      eap: parseInt(this.validMethod.eapMethod.type.toString()),
      servername: this.validMethod.serverSideCredential.serverID,
      auth: this.global.auth.MSCHAPv2,
      anonymous: this.validMethod.clientSideCredential.anonymousIdentity,
      caCertificate: this.validMethod.serverSideCredential.ca,
    };
  }

  goBack() {
    document.getElementById('btn-back').style.opacity = '0';
    document.getElementById('dismissable-back').style.opacity = '0';
    this.viewCtrl.dismiss();
  }
}
