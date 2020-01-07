import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { isArray, isObject } from 'ionic-angular/util/util';
import { AuthenticationMethod } from '../../shared/entities/authenticationMethod';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';
import { LoadingProvider } from '../../providers/loading/loading';
import { Plugins } from '@capacitor/core';
import { infoProviders } from '../../shared/entities/infoProviders';
import { StoringProvider } from '../../providers/storing/storing';

const { Filesystem, Toast } = Plugins;


@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})
export class ProfilePage implements OnInit{

  showAll: boolean = false;

  /**
   * The profile which is received as a navigation parameter
   */
  profile: any;

  /**
   * The eapConfig retrieved from the profile
   */
  eapConfig: any;

  /**
   * The authentication methods obtained from the eap institutionSearch file
   */
  authenticationMethods: AuthenticationMethod[];

  // TODO: CREATE CHECK FORM
  model = {name: '', pass: ''};

  providerInfo: infoProviders[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public loading: LoadingProvider,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              private store: StoringProvider) {

    console.log(this.getEapconfigEndpoint);

  }


  async checkForm() {
    const validForm: boolean = this.checkValidation();
    console.log('this form data: ',this.model);

    if (validForm) {
      this.showAll = false;

      if (this.providerInfo[0].providerLogo) {
        await this.navCtrl.push(WifiConfirmation, {
          logo: this.providerInfo[0].providerLogo[0]
        }, {animation: 'transition'});

      } else {
        await this.navCtrl.push(WifiConfirmation, {}, {animation: 'transition'});

      }
    }
  }

  checkValidation() {
    // TODO: SHOW MESSAGE ERROR TO VALIDATION
    let regExpEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regExpEmail.test(String(this.model.name).toLowerCase());
  }

  /**
   * Method which returns the eap institutionSearch endpoint
   * @return {any} eapconfig_endpoint the eap institutionSearch endpoint
   */
  getEapconfigEndpoint(){

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
    console.log(this.profile);

    this.eapConfig = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);
    let validEap: boolean = await this.validateEapconfig();

    if (validEap) {
      await this.storageFile(this.eapConfig);
      this.getFirstValidAuthenticationMethod();
      console.log('Fist valid authentication method', this.getFirstValidAuthenticationMethod());
    } else {
      await this.errorHandler.handleError('Invalid eapconfig file', false);
    }

    this.loading.dismiss();
    this.showAll = true;
  }


  async storageFile(file) {
    try {
      const fileCert = JSON.stringify(file);
      await this.store.readFile(fileCert)

    } catch(e) {
      await this.errorHandler.handleError('Unable to write file', false);

    }
  };

  // TODO: CREATE PROVIDER TO VALIDATE - CERTIFICATES
  /**
   * Method to validate the eapconfig file and obtain its elements.
   * This method validates and updates the property [authenticationMethods]{@link #authenticationMethods}
   */
  async validateEapconfig(): Promise <boolean>{
    let keys = [
      'EAPIdentityProviderList',
      'EAPIdentityProvider',
      'AuthenticationMethods',
      'AuthenticationMethod'
    ];

    let jsonAux = this.eapConfig;

    //--------
    // EAP-CONFIG
    //--------
    if (!!jsonAux){
      for (let key of keys){
        if (isArray(jsonAux)){
          if (jsonAux[0].hasOwnProperty(key)){
            jsonAux = jsonAux[0][key];
          } else {
            console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
            return false;
          }
        } else if (isObject(jsonAux)) {
          if (jsonAux.hasOwnProperty(key)) {
            jsonAux = jsonAux[key];
          } else {
            console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
            return false;
          }
          //--------
          // Provider Info
          //--------
          if (key === 'EAPIdentityProvider') {
            this.providerInfo = [];
            let providersAux = new infoProviders();

            if (!!jsonAux[0] !== undefined && !!jsonAux[0].ProviderInfo) {
              await providersAux.fillEntity(jsonAux[0].ProviderInfo[0]);

              this.providerInfo.push(providersAux);
            }
          }

        } else {
          console.error('Invalid eapconfig file', jsonAux);
          return false;
        }
      }

      //--------
      // AUTHENTICATION METHODS
      //--------
      this.authenticationMethods = [];

      for (let i in jsonAux){
        console.log('AuthenticationMethod: ', jsonAux[i]);
        if(!!jsonAux[i]){
          let authenticationMethodAux = new AuthenticationMethod();
          try {
            await authenticationMethodAux.fillEntity(jsonAux[i]);
          } catch (e) {
            return false;
          }
          this.authenticationMethods.push(authenticationMethodAux);
        }
      }
      //--------

    } else {
      return false;
    }
    console.log('authentication: ',this.authenticationMethods);
    return true;
  }

  /**
   * Method to get the first valid authentication method form an eap institutionSearch file.
   * @return {AuthenticationMethod} the first valid authentication method
   */
  private async getFirstValidAuthenticationMethod(){
    for (let authenticationMethod of this.authenticationMethods){
      console.log(authenticationMethod.eapMethod.type);
      console.log(['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()));
      if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
        return authenticationMethod;
      }
    }

    await this.errorHandler.handleError('No valid authentication method available from the eapconfig file', true, 'http://google.com');
    return null;
  }

  /**
   * Method executed when the class did enter, usually when swipe back from the next page
   */
  ionViewDidEnter() {
    this.showAll = true;
  }
}
