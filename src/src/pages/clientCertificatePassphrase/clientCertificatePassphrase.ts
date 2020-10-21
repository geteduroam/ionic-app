import { Component } from '@angular/core';
import {Events, IonicPage, NavController, NavParams} from 'ionic-angular';
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
 * Generated class for the ClientCertificatePassphrasePage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-client-certificate-passphrase',
  templateUrl: 'clientCertificatePassphrase.html',
})
export class ClientCertificatePassphrasePage extends BasePage{

  passphrase: string;

  validPassPhrase: boolean = true;

  enableButton: boolean = false;

  showAll: boolean = false;

  oauthConf: OauthConfProvider;

  constructor(public navCtrl: NavController, public navParams: NavParams, protected event: Events,
              public loading: LoadingProvider, public dictionary: DictionaryServiceProvider,
              public global: GlobalProvider, private getEduroamServices: GeteduroamServices,
              private errorHandler: ErrorHandlerProvider) {
    super(loading, dictionary, event, global);
    this.oauthConf = new OauthConfProvider(this.global, this.getEduroamServices, this.loading, this.errorHandler, this.dictionary, this.navCtrl);
  }

  ionViewDidEnter() {
    this.showAll = true;
  }

  blur() {
    this.checkPassPhrase();
  }

  async checkPassPhrase() {
    const response = await WifiEapConfigurator.validatePassPhrase({ 'certificate': this.global.getAuthenticationMethod().clientSideCredential.clientCertificate, 'passPhrase': this.passphrase});
    if (!response.success) {
      this.validPassPhrase = false;
      this.enableButton = false;
    } else {
      this.validPassPhrase = true;
      this.enableButton = true;
    }
  }

  async sendPassphrase() {
    await this.oauthConf.checkForm(this.passphrase);
  }

}
