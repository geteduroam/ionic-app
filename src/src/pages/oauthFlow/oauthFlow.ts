import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { LoadingProvider } from '../../providers/loading/loading';

@Component({
  selector: 'page-oauthFlow',
  templateUrl: 'oauthFlow.html',
})
export class OauthFlow {
  showAll: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public loading: LoadingProvider,) {

  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo() {
    this.showAll = false;
    await this.navCtrl.push(WifiConfirmation, {}, {animation: 'transition'});
  }

  /**
   * Method executed when the class did enter, usually when swipe back from the next page
   */
  ionViewDidEnter() {
    this.loading.createAndPresent();
    this.loading.dismiss();
    this.showAll = true;
  }
}
