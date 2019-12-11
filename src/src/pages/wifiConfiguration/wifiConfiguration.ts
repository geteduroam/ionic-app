import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
import {WifiConfirmation} from "../wifiConfirmation/wifiConfirmation";

@Component({
  selector: 'page-welcome',
  templateUrl: 'wifiConfiguration.html',
})
export class WifiConfiguration {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo(page: string) {
    if (page === 'wifiConfirmation') {
      await this.navCtrl.push(WifiConfirmation);
    }
  }

}
