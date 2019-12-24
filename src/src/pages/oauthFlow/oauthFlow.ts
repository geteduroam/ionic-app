import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { LoadingProvider } from '../../providers/loading/loading';

@Component({
  selector: 'page-oauthFlow',
  templateUrl: 'oauthFlow.html',
})
export class OauthFlow implements OnInit {
  showAll: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, public loading: LoadingProvider,) {

  }
  async ngOnInit() {

    this.loading.createAndPresent();

    this.showAll = true;
    this.loading.dismiss();
  }
  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo() {
    await this.navCtrl.push(WifiConfirmation);
  }
}
