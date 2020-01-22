import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { ConfigurationScreen } from '../configScreen/configScreen';
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";
import {GlobalProvider} from "../../providers/global/global";
import {DictionaryService} from "../../providers/dictionary-service/dictionary-service";

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})

export class WelcomePage extends BasePage{


  constructor(protected platform: Platform, protected navCtrl: NavController, protected navParams: NavParams, protected loading: LoadingProvider, protected errorHandler: ErrorHandlerProvider,  protected global: GlobalProvider, protected dictionary: DictionaryService) {
    super(navCtrl, navParams, loading, errorHandler, global, dictionary);

  }

  async navigateTo() {
    await this.navCtrl.setRoot(ConfigurationScreen, null, { animation: 'transition' });
  }

  exitApp() {
    this.platform.exitApp();
  }

}
