import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { ErrorsPage } from '../errors/errors';

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})

export class WelcomePage  {

  constructor(private platform: Platform, public navCtrl: NavController, public navParams: NavParams) {

  }

  async navigateTo() {
      await this.navCtrl.push(ErrorsPage);
  }

  exitApp() {
    this.platform.exitApp();
  }
}
