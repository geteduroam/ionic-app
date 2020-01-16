import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { AuthenticationMethod } from '../../shared/entities/authenticationMethod';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';
import { LoadingProvider } from '../../providers/loading/loading';
import { ProviderInfo } from '../../shared/entities/providerInfo';
import { StoringProvider } from '../../providers/storing/storing';
import {ValidatorProvider} from "../../providers/validator/validator";

// TODO: CREATE PROVIDER TO EXTERNAL BROWSER
import {Plugins} from "@capacitor/core";
import { ProfileModel } from '../../shared/models/profile-model';
import { ProvideModel } from '../../shared/models/provide-model';
import { GlobalProvider } from '../../providers/global/global';
const {Browser} = Plugins;

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})

export class ProfilePage implements OnInit{

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

  constructor(public navCtrl: NavController, public navParams: NavParams, public loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              private validator: ValidatorProvider, private store: StoringProvider, private global: GlobalProvider) {

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
    return this.validator.validateEmail(email, this.suffixIdentity)
  }

  /**
   * Method to check form and navigate.
   */
  async checkForm() {
    console.log('checkForm: ', this.provide);

    if (!!this.validateForm()) {
      let config = {
        ssid: this.global.getSsid(),
        username: this.provide.email,
        password: this.provide.pass,
        eap: parseInt(this.validMethod.eapMethod.type.toString()),
        servername: "",
        auth: this.global.auth.MSCHAPv2,
        anonymous: "",
        caCertificate: this.validMethod.serverSideCredential.ca.content
      };

      console.log( 'config: ', config);
      const checkRequest = this.getEduroamServices.connectProfile(config);

      if (!!checkRequest) {
        this.navigateTo();
      }
    } else{
      console.error('The e-mail address is not valid');
    }
  }

  // TODO: REFACTOR THIS LINES
  async navigateTo() {
    this.showAll = false;
    if (this.providerInfo.providerLogo) {
      await this.navCtrl.push(WifiConfirmation, {
        logo: this.providerInfo.providerLogo
      }, { animation: 'transition' });

    } else {
      await this.navCtrl.push(WifiConfirmation, {}, {animation: 'transition'});
    }
  }
  /**
   * Method which returns the eap institutionSearch endpoint
   * @return {any} eapconfig_endpoint the eap institutionSearch endpoint
   */
  getEapconfigEndpoint() {
    return this.profile.eapconfig_endpoint;
  }

  // TODO: REFACTOR THIS CODE
  /**
   * Method executed when the class is initialized.
   * This method updates the property [eapConfig]{@link #eapConfig} by making use of the service [GeteduroamServices]{@link ../injectables/GeteduroamServices.html}.
   * This method also calls [validateEapconfig()]{@link #validateEapconfig}
   * The method obtains the first valid authentication method by calling [getFirstValidAuthenticationMethod()]{#getFirstValidAuthenticationMethod}
   */
  async ngOnInit() {
    this.loading.createAndPresent();

    this.profile = !!this.navParams.get('profile') ? this.navParams.get('profile') : this.global.getProfile();



    const eapConfig = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);

    this.authenticationMethods = [];
    this.providerInfo = new ProviderInfo();

    const validEap:boolean = await this.validator.validateEapconfig(eapConfig, this.authenticationMethods, this.providerInfo);

    if (validEap) {

      this.validMethod = await this.getFirstValidAuthenticationMethod();

      if (!!this.validMethod) {
        await this.storageFile(eapConfig);

        this.suffixIdentity = !!this.validMethod && !!this.validMethod.clientSideCredential.innerIdentityHint ?
            this.validMethod.clientSideCredential.innerIdentitySuffix : '';

        this.createTerms();
      }

    } else {
      await this.errorHandler.handleError('Invalid eap-config file', false);
    }

    this.loading.dismiss();
    this.showAll = true;
  }

  /**
   * Method to store eap-config files.
   */
  async storageFile(file) {
    try {
      const fileCert = JSON.stringify(file);
      await this.store.readFile(fileCert)

    } catch(e) {
      await this.errorHandler.handleError('Unable to write file', false);

    }
  };

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

    await this.errorHandler.handleError('No valid authentication method available from the eap-config file', true, url);
    return null;
  }

  /**
   * Method executed when the class did enter, usually when swipe back from the next page
   */
  ionViewDidEnter() {
    this.showAll = true;
  }
}
