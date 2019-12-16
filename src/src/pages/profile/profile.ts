import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import {isArray, isObject} from "ionic-angular/util/util";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";



@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage implements OnInit{

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

  constructor(public navCtrl: NavController, public navParams: NavParams, private getEduroamServices: GeteduroamServices) {
    this.profile = this.navParams.get('profile');
    console.log(this.getEapconfigEndpoint());
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

    let response = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);

    this.eapConfig = response;

    this.validateEapconfig();

    console.log('Fist valid authentication method', this.getFirstValidAuthenticationMethod());

  }

  /**
   * Method to validate the eapconfig file and obtain its elements.
   * This method validates and updates the property [authenticationMethods]{@link #authenticationMethods}
   */
  validateEapconfig(){
    let keys = ['EAPIdentityProviderList', 'EAPIdentityProvider', 'AuthenticationMethods', 'AuthenticationMethod'];

    let jsonAux = this.eapConfig;

    for(let key of keys){

      if(isArray(jsonAux)){
        if(jsonAux[0].hasOwnProperty(key)){
          jsonAux = jsonAux[0][key];
        } else {
          console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
        }
      } else if (isObject(jsonAux)){
        if(jsonAux.hasOwnProperty(key)){
          jsonAux = jsonAux[key];
        } else {
          console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
        }
      } else{
        console.error('Invalid eapconfig file', jsonAux);
      }
    }

    this.authenticationMethods = [];

    for (let i in jsonAux){
      if(!!jsonAux[i]){
        let authenticationMethodAux = new AuthenticationMethod();
        authenticationMethodAux.fillEntity(jsonAux[i]);
        this.authenticationMethods.push(authenticationMethodAux);
      }
    }
  }

  /**
   * Method to get the first valid authentication method form an eap config file.
   * @return {AuthenticationMethod} the first valid authentication method
   */
  private getFirstValidAuthenticationMethod(){
    for (let authenticationMethod of this.authenticationMethods){
      console.log(authenticationMethod.eapMethod.type);
      console.log(['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()));
      if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
        return authenticationMethod;
      }
    }
    //TODO redirect to error vew when available
    console.error('No valid authentication method available from the eapconfig file');
    return null;
  }

}
