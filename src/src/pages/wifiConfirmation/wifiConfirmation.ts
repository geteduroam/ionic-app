import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';


@Component({
  selector: 'page-wifi-confirm',
  templateUrl: 'wifiConfirmation.html',
})
export class WifiConfirmation {

  constructor(public navCtrl: NavController, public navParams: NavParams, private platform: Platform) {
  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  exitApp() {
      this.platform.exitApp();
  }

}
