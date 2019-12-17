import { Component } from '@angular/core';
import { ModalController, NavController, NavParams, Platform } from 'ionic-angular';
import { ConfigurationScreen } from '../configScreen/configScreen';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';


@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})

export class WelcomePage  {

  constructor(private platform: Platform, public navCtrl: NavController, public navParams: NavParams, private error: ErrorHandlerProvider) {

  }

  async navigateTo() {
    await this.navCtrl.push(ConfigurationScreen);
  }

  exitApp() {
    this.platform.exitApp();
  }

}
