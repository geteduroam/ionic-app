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
    const validForm: boolean = this.validator.validateEmail(this.model.name);

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
      console.error('The e-mail address is not valid');
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


    this.eapConfig = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);
    this.authenticationMethods = [];
    this.providerInfo = new ProviderInfo();
    const validEap:boolean = await this.validator.validateEapconfig(this.eapConfig, this.authenticationMethods, this.providerInfo);
    if (validEap) {
      //   await this.storageFile(this.eapConfig);
      this.getFirstValidAuthenticationMethod();
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
      if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
        return authenticationMethod;
      }
    }
    let url;
    if(!!this.providerInfo.helpdesk.webAddress){
      url = this.providerInfo.helpdesk.webAddress;
    } else if(!!this.providerInfo.helpdesk.emailAddress){
      url = this.providerInfo.helpdesk.emailAddress;
    } else {
      url = '';
    }
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
