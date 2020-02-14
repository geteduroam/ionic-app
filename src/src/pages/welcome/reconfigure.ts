import { Component } from '@angular/core';
import {Events, Nav, NavController, NavParams, Platform} from 'ionic-angular';
import { ConfigurationScreen } from '../configScreen/configScreen';
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";

@Component({
  selector: 'page-welcome',
  templateUrl: 'reconfigure.html',
})

export class ReconfigurePage extends BasePage{

  showReconfigure : boolean = true;
  isAndroid: boolean;

  constructor(private platform: Platform, private navParams: NavParams, private nav: Nav, private navCtrl: NavController,
              protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
              protected global: GlobalProvider,protected event: Events) {
    super(loading, dictionary, event, global);

  }

  ionViewWillEnter() {
    if(this.nav['rootParams'].reconfigure !== undefined){
      this.showReconfigure = this.nav['rootParams'].reconfigure;
      console.log('**************this.nav[\'rootParams\'].reconfigure**************',this.nav['rootParams'].reconfigure);
    }
    this.isAndroid = this.platform.is('android');
    console.log('**************RECONFIGURE**************',this.showReconfigure);
  }

  async navigateTo() {
    if (this.activeNavigation) {
      await this.navCtrl.setRoot(ConfigurationScreen, null, { animation: 'transition' });
    } else{
      await this.alertConnectionDisabled();
    }
  }

  exitApp() {
    this.platform.exitApp();
  }

}
