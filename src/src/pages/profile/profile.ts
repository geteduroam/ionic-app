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
declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;
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

  providerInfo: ProviderInfo;

  termsOfUse: boolean = false;

  termsUrl: string = '';

  errorPass: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              private validator: ValidatorProvider, private store: StoringProvider) {

  }

  /**
   * Method to validate form.
   * @return {boolean}
   */
  validateForm(): boolean {

    console.log('this.termsOfUse',this.termsOfUse);
    console.log('this.provide.terms', this.provide.terms);

    const validateTerms = !!this.termsOfUse && !!this.provide.terms ? true : !this.termsOfUse;

    return this.validEmail(this.provide.email) && this.provide.pass !== '' && validateTerms;
  }

  validEmail(email: string) {
      return this.validator.validateEmail(email)
  }

  /**
   * Method to check form and navigate.
   */
  async checkForm() {
    console.log('checkForm: ', this.provide);

    if (!!this.validateForm()) {

      console.log('before connecting');

      console.log('ssid', "eduroam");
      console.log('username', this.provide.email);
      console.log('password', this.provide.pass);
      // console.log('eap', parseInt(''+this.authenticationMethods[0].eapMethod.type));
      console.log('eap', parseInt(''+21));
      console.log('servername', "");
      console.log('auth', parseInt(''+4));
      console.log('anonymous', "");
      // console.log('caCertificate', this.authenticationMethods[0].serverSideCredential.ca.content);
      console.log('caCertificate', "");


      let config = {
        ssid: "eduroam",
        username: this.provide.email,
        password: this.provide.pass,
        // eap: parseInt(''+this.authenticationMethods[0].eapMethod.type),
        eap: 21,
        servername: "", //TODO for now empty
        auth: 4,
        anonymous: "", //TODO for now empty
        // caCertificate: this.authenticationMethods[0].serverSideCredential.ca.content
        caCertificate: ""
      };
      /*
        {
          ssid: "eduroam",
          username: "emergya@ad.eduroam.no",
          password: "crocodille",
          eap: 25,
          servername: "eduroam.uninett.no",
          auth: 4,
          anonymous: "anonymous@uninett.no",
          caCertificate: "MIIEbzCCA1egAwIBAgIJAJAhu7l6dg+nMA0GCSqGSIb3DQEBBQUAMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTAeFw0xMDAyMDYwMDEyMzBaFw0yMDAyMDQwMDEyMzBaMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK2+21jlJLycaCgg6TBo+i37DkWvW4UR3ptLzQAQfBuOSfPBPG9zXhmn0z/gNWfpbAwETiW+2oTcSKz/XJ0Ej1dFnySNWBnNb6rOY7GrTAvkRfDbpacQATPwg9RnvBs4xR+6TGNLcYjcyEnjF+Xd29aRzH/rFkJHq2pM6rT5BpScQ4n1DrB2y+E812UjDYhx8KnD9Zh+83wpa3tMRI5J9n7AuqrBThS4xudCAcJLMyu3KTEnBpRMRfduVyndPTJe+EVcp3XBip41Biza73ZFScqMDFfskc2jT3XV3Tz+0Actg56m+JirRtcQc8lP7o/P6BXTRmIfeXbHuX7/BSE+AXECAwEAAaOCAVYwggFSMB0GA1UdDgQWBBQlxqCOiIgff64MlbIUojA2QgTzTjB6BgNVHSMEczBxgBQlxqCOiIgff64MlbIUojA2QgTzTqFOpEwwSjELMAkGA1UEBhMCTk8xEzARBgNVBAoTClVOSU5FVFQgQVMxJjAkBgNVBAMTHVVOSU5FVFQgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ggkAkCG7uXp2D6cwDAYDVR0TBAUwAwEB/zAbBgNVHREEFDASgRBkcmlmdEB1bmluZXR0Lm5vMDgGA1UdHwQxMC8wLaAroCmGJ2h0dHA6Ly9jYS51bmluZXR0Lm5vL3VuaW5ldHQtY2EtY3JsLnBlbTAzBggrBgEFBQcBAQQnMCUwIwYIKwYBBQUHMAGGF2h0dHA6Ly9vY3NwLnVuaW5ldHQubm8vMBsGA1UdEgQUMBKBEGRyaWZ0QHVuaW5ldHQubm8wDQYJKoZIhvcNAQEFBQADggEBAA9/27nksOl8d7uwi8Ce0u8WOpwDnwUUdYu0/1U91bG+bVxFL/rmenLVJJ9vaU0jxa/xHG2r8Q1RvIz1OqGX8XpbzB9cIB2Bj4kIJ+wg+pHroH9hmhJkf1gxMphtcZL3B2KAAc1B27ZchEJifFJuvL+wghAWVh0iwxhul5JOgDH0cXwvNyjRJjR70uvpU2YmRhNunqhU6hd89HPZpSybq5LU939i5HSnSgAsqQmOSCt0APlJNlJ/y5UWxMBO9ayycIuSHbORBJ8ZnXHw3yScbIEioqvAaDJNQUTNw8Pnn/dq6ffTELCFs/4QBOz7av0IxjnemYuCzgUZmb+YPhYKW+c="
        }
      */


      // const checkRequest = this.getEduroamServices.connectProfile(config);

      const checkRequest = WifiEapConfigurator.configureAP(config).then().catch(async (e) => {
        await this.errorHandler.handleError(e.message, false);
      });

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
    this.profile = this.navParams.get('profile');

    const eapConfig = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);

    this.authenticationMethods = [];
    this.providerInfo = new ProviderInfo();

    const validEap:boolean = await this.validator.validateEapconfig(eapConfig, this.authenticationMethods, this.providerInfo);

    if (validEap) {
      await this.storageFile(eapConfig);
      this.getFirstValidAuthenticationMethod();
      this.createTerms();

    } else {
      await this.errorHandler.handleError('Invalid eapconfig file', false);
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
  private async getFirstValidAuthenticationMethod(){

    for (let authenticationMethod of this.authenticationMethods) {
      if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
        return authenticationMethod;
      }
    }

    let url = !!this.providerInfo.helpdesk.webAddress ? this.providerInfo.helpdesk.webAddress :
      !!this.providerInfo.helpdesk.emailAddress ? this.providerInfo.helpdesk.emailAddress : '';

    await this.errorHandler.handleError('No valid authentication method available from the eapconfig file', true, url);
    return null;
  }

  /**
   * Method executed when the class did enter, usually when swipe back from the next page
   */
  ionViewDidEnter() {
    this.showAll = true;
  }
}
