import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import {isArray, isObject} from "ionic-angular/util/util";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {not} from "rxjs/internal-compatibility";



@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage implements OnInit{

  profile: any;

  eapConfig: any;

  authenticationMethods: AuthenticationMethod[];

  constructor(public navCtrl: NavController, public navParams: NavParams, private getEduroamServices: GeteduroamServices) {

    this.profile = this.navParams.get('profile');
    console.log(this.getEapconfigEndpoint());
  }
  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo() {
    await this.navCtrl.push(WifiConfirmation);
  }

  getEapconfigEndpoint(){
    return this.profile.eapconfig_endpoint;
  }

  async ngOnInit() {

    let response = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);

    this.eapConfig = response;

    this.validateEapconfig();

    /*console.log(this.authenticationMethods);*/

  }

  /**
   * Method to validate the eapconfig file and obtain its elements.
   * Updates the property [authenticationMethod]{@link #authenticationMethod}
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

    //console.log(jsonAux);

    for (let i in jsonAux){
      if(!!jsonAux[i]){
        console.log(jsonAux[i]);
        let authenticationMethodAux = new AuthenticationMethod();
        authenticationMethodAux.fillEntity(jsonAux[i]);
        console.log('Type for the '+i+' authentication method',authenticationMethodAux);
      }

      /*let authenticationMethodAux = new AuthenticationMethod();
      authenticationMethodAux.fillEntity(jsonAux[i]);
      this.authenticationMethods[i] = authenticationMethodAux;
      console.log(authenticationMethodAux.eapMethod.type);*/
    }

  }

}
