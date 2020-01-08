import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { isArray, isObject } from 'ionic-angular/util/util';
import { AuthenticationMethod } from '../../shared/entities/authenticationMethod';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';
import { LoadingProvider } from '../../providers/loading/loading';
import { Plugins } from '@capacitor/core';
import { ProviderInfo } from '../../shared/entities/providerInfo';
import { StoringProvider } from '../../providers/storing/storing';
import {ValidatorProvider} from "../../providers/validator/validator";


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

  model = {name: '', pass: ''};

  providerInfo: ProviderInfo;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              public loading: LoadingProvider,private validator: ValidatorProvider, private store: StoringProvider) {

    console.log(this.getEapconfigEndpoint);

  }


  async checkForm() {
    let validForm: boolean;
    validForm = this.validator.validateEmail(this.model.name);
    console.log('this form data: ',this.model);
    console.log('validForm: ', validForm);

    if (validForm) {
      this.showAll = false;

      if (this.providerInfo.providerLogo) {
        await this.navCtrl.push(WifiConfirmation, {
          logo: this.providerInfo.providerLogo
        }, {animation: 'transition'});

      } else {
        await this.navCtrl.push(WifiConfirmation, {}, {animation: 'transition'});

      }
    } else{
      console.log('the email is not valid');
    }
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
    // let validEap: boolean = await this.validateEapconfig();
    let validEap: boolean;
    this.authenticationMethods = [];
    this.providerInfo = new ProviderInfo();
    validEap = await this.validator.validateEapconfig(this.eapConfig, this.authenticationMethods, this.providerInfo);
    console.log('this.authenticationMethods: '+this.authenticationMethods);
    console.log('this.providerInfo: '+this.providerInfo);
    console.log('value of validEap: '+validEap);
    if (validEap) {
      //   await this.storageFile(this.eapConfig);
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
