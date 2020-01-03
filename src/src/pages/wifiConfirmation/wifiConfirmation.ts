import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { LoadingProvider } from '../../providers/loading/loading';


@Component({
  selector: 'page-wifi-confirm',
  templateUrl: 'wifiConfirmation.html',
})
export class WifiConfirmation implements OnInit {

  showAll: boolean = false;
  logo: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private platform: Platform,
              public loading: LoadingProvider,) {
  }

  async ngOnInit(){
    this.loading.createAndPresent();

    // TODO: EXIST LOGO ?
    this.logo = this.navParams.get('logo');

    if (!!this.logo) {
      const image = atob(this.logo._);
      const info = this.logo.$;
      console.log(image);
    }


    this.loading.dismiss();
    this.showAll = true;
  }
  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  exitApp() {
      this.platform.exitApp();
  }

}
