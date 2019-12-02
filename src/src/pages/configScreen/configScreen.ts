import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {WifiConfiguration} from "../wifiConfiguration/wifiConfiguration";
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES


@Component({
  selector: 'page-welcome',
  templateUrl: 'configScreen.html',
})
export class ConfigurationScreen {

  config: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private geteduroamServices: GeteduroamServices) {

  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo(page: string) {
    if (page === 'wifiConfiguration') {
      await this.navCtrl.push(WifiConfiguration);
    }
  }

  async getDiscoveryJson(){
    this.config = this.geteduroamServices.discovery().then((data: any) => {
      console.log(JSON.stringify(data));
      return JSON.stringify(data)
    }).catch((err: any) => {console.log('error: ', err)});
  }

}
