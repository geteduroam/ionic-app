import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { LoadingProvider } from '../../providers/loading/loading';
import { ConfigurationScreen } from '../configScreen/configScreen';

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


    this.loading.dismiss();

  }
  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo() {
    await this.navCtrl.push(WifiConfirmation,{}, {
      animate: true,
      animation: 'md-transition',
    });
  }
}
