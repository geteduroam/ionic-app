import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { ConfigurationScreen } from '../configScreen/configScreen';
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})

export class WelcomePage extends BasePage{


  constructor(private platform: Platform, private navCtrl: NavController, protected loading: LoadingProvider,
              protected dictionary: DictionaryServiceProvider, private global: GlobalProvider) {
    super(loading, dictionary);
  }

  async navigateTo() {
    await this.navCtrl.setRoot(ConfigurationScreen, null, { animation: 'transition' });
  }

  exitApp() {
    this.platform.exitApp();
  }

}
