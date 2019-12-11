import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {WifiConfiguration} from "../wifiConfiguration/wifiConfiguration";
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES


@Component({
  selector: 'page-welcome',
  templateUrl: 'configScreen.html',
})
export class ConfigurationScreen {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo(page: string) {
    if (page === 'wifiConfiguration') {
      await this.navCtrl.push(WifiConfiguration);
    }
  }

}
