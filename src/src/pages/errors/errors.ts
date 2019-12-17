import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { ConfigurationScreen } from '../configScreen/configScreen';

@Component({
  selector: 'page-errors',
  templateUrl: 'errors.html',
})
export class ErrorsPage {

  text: string;
  constructor(private platform: Platform, public navCtrl: NavController, public navParams: NavParams) {
    if (!!this.navParams.get('error')) {
      this.text = this.navParams.get('error');
    } else {
      this.text = 'Sorry, this profile cannot be handle by this app. To have further information, please click here:'
    }
  }

  async navigateTo() {
    await this.navCtrl.push(ConfigurationScreen);
  }

  exitApp() {
    this.platform.exitApp();
  }
}
