import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
import {ConfigurationScreen} from "../configScreen/configScreen";

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {

  constructor(private platform: Platform, public navCtrl: NavController, public navParams: NavParams) {
  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo() {
      await this.navCtrl.push(ConfigurationScreen);
  }

  exitApp() {
    this.platform.exitApp();
  }
}
