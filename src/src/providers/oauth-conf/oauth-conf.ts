import { Injectable } from '@angular/core';
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {GlobalProvider} from "../global/global";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {GeteduroamServices} from "../geteduroam-services/geteduroam-services";
import {LoadingProvider} from "../loading/loading";
import {ErrorHandlerProvider} from "../error-handler/error-handler";
import {DictionaryServiceProvider} from "../dictionary-service/dictionary-service-provider.service";
import {NavController} from "ionic-angular";
import {WifiConfirmation} from "../../pages/wifiConfirmation/wifiConfirmation";
import {OauthFlow} from "../../pages/oauthFlow/oauthFlow";
import {ClientCertificatePassphrasePage} from "../../pages/clientCertificatePassphrase/clientCertificatePassphrase";

@Injectable()
export class OauthConfProvider {

  /**
   * Provide info from a certificate
   */
  providerInfo: ProviderInfo;

  /**
   * Authentication method from a certificate
   */
  validMethod: AuthenticationMethod = new AuthenticationMethod();

  constructor(private global: GlobalProvider, private getEduroamServices: GeteduroamServices,
              private loading: LoadingProvider, private errorHandler: ErrorHandlerProvider,
              private dictionary: DictionaryServiceProvider, public navCtrl: NavController) {
  }

  /**
   * Method to manage validation profile
   * @param validProfile check if profile is valid
   */
  async manageProfileValidation(validProfile: boolean, provInfo: ProviderInfo) {
    this.providerInfo = provInfo;
    if (validProfile) {
      this.validMethod = this.global.getAuthenticationMethod();
      if (typeof this.validMethod.clientSideCredential.passphrase === 'undefined') {
        await this.navCtrl.push(ClientCertificatePassphrasePage, '', {animation: 'transition'});
        return;
      }
      await this.checkForm();

    } else {
      await this.notValidProfile();
    }
  }

  /**
   * Method to check form, create connection with plugin WifiEapConfigurator and navigate.
   */
  async checkForm(passphrase? : string) {
    if (typeof passphrase !== 'undefined') {
      this.validMethod = this.global.getAuthenticationMethod();
      this.providerInfo = this.global.getProviderInfo();
      this.validMethod.clientSideCredential.passphrase = passphrase;
    }
    let config = this.configConnection();
    const checkRequest = await this.getEduroamServices.connectProfile(config);
    this.loading.dismiss();

    if (checkRequest.message.includes('success') || checkRequest.message.includes('error.network.linked')) {
      await this.navigateTo();
    }else if (checkRequest.message.includes('error.network.alreadyAssociated')) {
      await this.errorHandler.handleError(
          this.dictionary.getTranslation('error', 'available1') + this.global.getSsid() +
          this.dictionary.getTranslation('error', 'available2') +
          this.global.getSsid() + '.', false, '', '', true);
    } else if (checkRequest.message.includes('error.network.userCancelled')) {
      await this.navCtrl.pop();
    } else {
      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-eap'), true, '');
    }
  }

  /**
   * Method to create configuration to plugin WifiEapConfigurator
   */
  configConnection() {
    return {
      ssid: this.global.getSsid(),
      username: '',
      password: '',
      eap: parseInt(this.validMethod.eapMethod.type.toString()),
      servername: '',
      auth: null,
      anonymous: this.validMethod.clientSideCredential.anonymousIdentity,
      caCertificate: this.validMethod.serverSideCredential.ca,
      clientCertificate: this.validMethod.clientSideCredential.clientCertificate,
      passPhrase: this.validMethod.clientSideCredential.passphrase
    };
  }

  /**
   * Method to check message when profile is not valid
   */
  async notValidProfile() {
    if(!!this.providerInfo) {

      let url = this.checkUrlInfoProvide();

      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-method'), true, url);

    } else {

      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-profile'), true, '');
    }
    await this.navCtrl.pop();
  }

  /**
   * Method to check if provider info contains links
   * and show it on error page
   */
  checkUrlInfoProvide() {
    return !!this.providerInfo.helpdesk.webAddress ? this.providerInfo.helpdesk.webAddress :
        !!this.providerInfo.helpdesk.emailAddress ? this.providerInfo.helpdesk.emailAddress : '';
  }

  /**
   * Navigation to the next view
   */
  async navigateTo() {

    !!this.providerInfo.providerLogo ? await this.navCtrl.setRoot(WifiConfirmation, {
          logo: this.providerInfo.providerLogo}, {  animation: 'transition'  }) :
        await this.navCtrl.setRoot(WifiConfirmation, {}, {animation: 'transition'});
  }

}
