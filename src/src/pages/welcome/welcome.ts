import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
import { ProfilePage } from '../profile/profile';
import { ErrorsPage } from '../errors/errors';
import { ConfirmPage } from '../confirm/confirm';
import { InstitutionPage } from '../institution/institution';
import { ConfigPage } from '../config/config';
import { CatflowPage } from '../catflow/catflow';
import { AuthPage } from '../auth/auth';

declare var Capacitor
const { WifiEapConfigurator } = Capacitor.Plugins;

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  async configure() {
    // await WifiEapConfigurator.configureAP({ssid: "eduroam", username: "iagtprof@alu.upo.es", password: "4cHK6kbj", eap: 21, servername: "radius.upo.es", auth: 5, caCertificate: ""})
    await WifiEapConfigurator.configureAP({ssid: "eduroam", username: "emergya@ad.eduroam.no", password: "crocodille", eap: 25, servername: "eduroam.uninett.no", auth: 4, caCertificate: ""})
  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo(page: string) {
    switch (page) {
      case 'profile':
        await this.navCtrl.push(ProfilePage);
        break;
      case 'error':
        await this.navCtrl.push(ErrorsPage);
        break;
      case 'confirm':
        await this.navCtrl.push(ConfirmPage);
        break;
      case 'config':
        await this.navCtrl.push(ConfigPage);
        break;
      case 'institution':
        await this.navCtrl.push(InstitutionPage);
        break;
      case 'catflow':
        await this.navCtrl.push(CatflowPage);
        break;
      case 'auth':
        await this.navCtrl.push(AuthPage);
        break;
    }
  }

}
