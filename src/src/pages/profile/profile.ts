import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import {isArray, isObject} from "ionic-angular/util/util";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";
import {LoadingProvider} from "../../providers/loading/loading";



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
   * The authentication methods obtained from the eap config file
   */
  authenticationMethods: AuthenticationMethod[];

  constructor(public navCtrl: NavController, public navParams: NavParams,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              public loading: LoadingProvider) {

    // console.log(this.getEapconfigEndpoint());
  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo() {
    await this.navCtrl.push(WifiConfirmation);
  }

  /**
   * Method which returns the eap config endpoint
   * @return {any} eapconfig_endpoint the eap config endpoint
   */
  getEapconfigEndpoint(){
    return this.profile.eapconfig_endpoint;
  }

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

    let validEap: boolean = await this.validateEapconfig();

    if(validEap){
      this.showAll = true;
      console.log('Fist valid authentication method', this.getFirstValidAuthenticationMethod());
    } else {
      await this.errorHandler.handleError('Invalid eapconfig file', false);
      await this.navCtrl.pop();
    }
    this.loading.dismiss();

  }

  /**
   * Method to validate the eapconfig file and obtain its elements.
   * This method validates and updates the property [authenticationMethods]{@link #authenticationMethods}
   */
  async validateEapconfig(): Promise <boolean>{
    let keys = ['EAPIdentityProviderList', 'EAPIdentityProvider', 'AuthenticationMethods', 'AuthenticationMethod'];

    let jsonAux = this.eapConfig;

    if(!!jsonAux){
      for(let key of keys){

        if(isArray(jsonAux)){
          if(jsonAux[0].hasOwnProperty(key)){
            jsonAux = jsonAux[0][key];
          } else {
            console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
            return false;
          }
        } else if (isObject(jsonAux)){
          if(jsonAux.hasOwnProperty(key)){
            jsonAux = jsonAux[key];
          } else {
            console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
            return false;
          }
        } else{
          console.error('Invalid eapconfig file', jsonAux);
          return false;
        }
      }

      this.authenticationMethods = [];

      for (let i in jsonAux){
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

    } else {
      return false;
    }

    return true;
  }

  /**
   * Method to get the first valid authentication method form an eap config file.
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
    //TODO redirect to error vew when available
    console.error('No valid authentication method available from the eapconfig file');
    await this.errorHandler.handleError('No valid authentication method available from the eapconfig file', true, 'http://google.com');
    return null;
  }

}
