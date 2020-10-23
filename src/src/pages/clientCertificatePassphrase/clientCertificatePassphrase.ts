import { Component } from '@angular/core';
import {Events, IonicPage, NavController, NavParams} from 'ionic-angular';
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {OauthConfProvider} from "../../providers/oauth-conf/oauth-conf";
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import { Plugins } from '@capacitor/core';
declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;
const { Keyboard } = Plugins;

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

  logo: boolean = false;

  /**
   * Variable to know if the keyboard if show or hide
   */
  filling: boolean = false;

  /**
   * DOM Sanitizer
   */
  converted_image: SafeResourceUrl;

  /**
   * Info provider from eap-config file
   */
  providerInfo: ProviderInfo;

  focus: boolean = false;
  private footer = document.getElementById('footer');

  constructor(public navCtrl: NavController, public navParams: NavParams, protected event: Events,
              public loading: LoadingProvider, public dictionary: DictionaryServiceProvider,
              public global: GlobalProvider, private getEduroamServices: GeteduroamServices,
              private errorHandler: ErrorHandlerProvider, private sanitizer: DomSanitizer) {
    super(loading, dictionary, event, global);
    this.oauthConf = new OauthConfProvider(this.global, this.getEduroamServices, this.loading, this.errorHandler, this.dictionary, this.navCtrl);
    Keyboard.addListener('keyboardWillHide', () => {
      this.focus = !this.focus;
    })
  }

  getFocus() {
    this.focus = !this.focus;
  }

  ionViewDidEnter() {

    this.providerInfo = this.global.getProviderInfo();
    if(this.providerInfo.providerLogo) {
      this.logo = true;
      this.getLogo();
    }
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

  getLogo() {
    let imageData = this.providerInfo.providerLogo._;
    let mimeType = this.providerInfo.providerLogo.$.mime;
    let encoding = this.providerInfo.providerLogo.$.encoding;

    const data = `data:${mimeType};${encoding},${imageData}`;

    this.converted_image = this.sanitizer.bypassSecurityTrustResourceUrl(data);
  }

}
