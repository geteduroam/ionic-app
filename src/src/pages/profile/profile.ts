import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";

@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html',
})
export class ProfilePage implements OnInit{
  profile: any;

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

    const response = await this.getEduroamServices.getEapconfig(this.profile.eapconfig_endpoint);

    console.log('====================================================');
    console.log(response);

    //let configXML = this.xml2json.xmlToJson(response);

    //console.log(configXML);

    // let xhr = new XMLHttpRequest();
    //
    // xhr.open('GET', this.profile.eapconfig_endpoint);
    //
    // xhr.send();
    //
    // xhr.onload = function() {
    //   if (xhr.status != 200) { // HTTP error?
    //     // handle error
    //     alert( 'Error: ' + xhr.status);
    //     return;
    //   }
    //
    //   // get the response from xhr.response
    // };
    //
    // xhr.onprogress = function(event) {
    //   alert(`Loaded ${event.loaded} of ${event.total}`);
    // };
    //
    // xhr.onerror = function() {
    //   console.log('Error: '+xhr.status+'-'+xhr.statusText);
    // };

  }
}
