import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { ProfilePage } from '../profile/profile';
import { ErrorsPage } from '../errors/errors';
import { ConfirmPage } from '../confirm/confirm';
import { InstitutionPage } from '../institution/institution';

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

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
      case 'institution':
        await this.navCtrl.push(InstitutionPage);
        break;
    }
  }

}
