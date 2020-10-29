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
import {ProvideModel} from "../../shared/models/provide-model";
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

  showInput: boolean = true;

  showError: boolean = false;

  oauthConf: OauthConfProvider;

  logo: boolean = false;

  termsAccepted: boolean = true;

  /**
   * DOM Sanitizer
   */
  converted_image: SafeResourceUrl;

  /**
   * Info provider from eap-config file
   */
  providerInfo: ProviderInfo;

  /**
   * Variable to know if the keyboard if show or hide
   */
  focus: boolean = false;

  /**
   * Check terms of use
   */
  termsOfUse: boolean = false;
  /**
   * Check help desk
   */
  helpDesk: boolean = false;
  /**
   * Link url of terms of use
   */
  termsUrl: string = '';

  constructor(public navCtrl: NavController, public navParams: NavParams, protected event: Events,
              public loading: LoadingProvider, public dictionary: DictionaryServiceProvider,
              public global: GlobalProvider, private getEduroamServices: GeteduroamServices,
              private errorHandler: ErrorHandlerProvider, private sanitizer: DomSanitizer) {
    super(loading, dictionary, event, global);
    this.oauthConf = new OauthConfProvider(this.global, this.getEduroamServices, this.loading, this.errorHandler, this.dictionary, this.navCtrl);
    Keyboard.addListener('keyboardWillHide', () => {
      this.focus = false;
    });
  }

  getFocus() {
    this.focus = true;
  }

  ionViewDidEnter() {

    this.providerInfo = this.global.getProviderInfo();
    if (!!this.providerInfo.termsOfUse) this.createTerms();
    if (!!this.providerInfo.helpdesk.emailAddress || !!this.providerInfo.helpdesk.webAddress ||
        !!this.providerInfo.helpdesk.phone) this.helpDesk = true;
    if (typeof this.global.getAuthenticationMethod().clientSideCredential.passphrase !== 'undefined') {
        this.showInput = false;
        this.enableButton = true;
    }
    if(this.providerInfo.providerLogo) {
      this.logo = true;
      this.getLogo();
    }
    this.showAll = true;
  }

  async checkPassPhrase() {
    const validateTerms = !!this.termsOfUse && !!this.termsAccepted ? true : !this.termsOfUse;
    const response = await WifiEapConfigurator.validatePassPhrase({ 'certificate': this.global.getAuthenticationMethod().clientSideCredential.clientCertificate, 'passPhrase': this.passphrase});
    if (!response.success || !validateTerms) {
      this.validPassPhrase = false;
      this.enableButton = false;
    } else {
      this.validPassPhrase = true;
      this.enableButton = true;
    }
  }

  resetError() {
    this.showError = false;
  }

  async sendPassphrase() {
    if ((!!this.termsOfUse && !!this.termsAccepted) || !this.termsOfUse) {
      if (this.showInput) {
        await this.checkPassPhrase();
        if (this.validPassPhrase) {
          await this.oauthConf.checkForm(this.passphrase);
        } else {
          this.showError = true;
        }
      } else {
        await this.oauthConf.checkForm();
      }
    }
  }

  getLogo() {
    let imageData = this.providerInfo.providerLogo._;
    let mimeType = this.providerInfo.providerLogo.$.mime;
    let encoding = this.providerInfo.providerLogo.$.encoding;

    const data = `data:${mimeType};${encoding},${imageData}`;

    this.converted_image = this.sanitizer.bypassSecurityTrustResourceUrl(data);
  }

  protected createTerms() {
    // Activate checkbox on view
    this.termsOfUse = true;
    const terms = this.providerInfo.termsOfUse.toString();
    try {
      // Get the web address within the terms of use
      this.termsUrl = !!terms.match(/\bwww?\S+/gi) ? 'http://'+terms.match(/\bwww?\S+/gi)[0] :
          !!terms.match(/\bhttps?\S+/gi) ? terms.match(/\bhttps?\S+/gi)[0] : terms.match(/\bhttp?\S+/gi)[0];
    } catch (e) {
      this.termsOfUse = false;
    }

  }

}
