import { Component } from '@angular/core';
import {Events, NavController, NavParams, Platform} from 'ionic-angular';
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {OauthConfProvider} from "../../providers/oauth-conf/oauth-conf";
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";

declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;

/**
 * Generated class for the ConfigFilePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-config-file',
  templateUrl: 'configFile.html',
})
export class ConfigFilePage extends BasePage{

  /**
   * Variable to know if this network is configured yet
   */
  configured: boolean;

  showAll: boolean = false;

  /**
   * Variable to know if the platform is Android
   */
  isAndroid: boolean;

  constructor(protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
              protected event: Events, protected global: GlobalProvider, private getEduroamServices: GeteduroamServices,
              private errorHandler: ErrorHandlerProvider, private navCtrl: NavController, private platform: Platform) {
    super(loading, dictionary, event, global);
  }

  /**
   *  Lifecycle method executed when the class did enter
   */
  async ionViewDidEnter() {
    this.configured = await WifiEapConfigurator.isNetworkAssociated({'ssid': this.global.getSsid()});
    this.isAndroid = this.platform.is('android');
    await this.waitingSpinner(this.configured);
    this.removeSpinner();
    this.showAll = true;
  }

  /**
   * This method create a object OauthConfProvider and invoke to his method for configure the network
   */
  async configure(){
    const oauthConf: OauthConfProvider = new OauthConfProvider(this.global, this.getEduroamServices, this.loading, this.errorHandler, this.dictionary, this.navCtrl);
    oauthConf.manageProfileValidation(true, this.global.getProviderInfo())
  }

  /**
   * This method close app.
   * [ Only Android can closed app ]
   */
  exitApp() {
    this.platform.exitApp();
  }

}
