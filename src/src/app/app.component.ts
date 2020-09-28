import {Config, Events, ModalController, Platform} from 'ionic-angular';
import { Component } from '@angular/core';
import { ReconfigurePage } from '../pages/welcome/reconfigure';
import { ProfilePage } from '../pages/profile/profile';
import { ConfigurationScreen } from '../pages/configScreen/configScreen';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/Transition';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { AppUrlOpen, Plugins } from '@capacitor/core';
import { GlobalProvider } from '../providers/global/global';
import { ErrorHandlerProvider } from '../providers/error-handler/error-handler';
import {ProfileModel} from "../shared/models/profile-model";
import {DictionaryServiceProvider} from "../providers/dictionary-service/dictionary-service-provider.service";
import {NetworkStatus} from "@capacitor/core/dist/esm/core-plugin-definitions";
import {ConfigFilePage} from "../pages/configFile/configFile";
import {GeteduroamServices} from "../providers/geteduroam-services/geteduroam-services";
import {ErrorsPage} from "../pages/errors/errors";
const { Toast, Network, App, Device } = Plugins;
declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;


@Component({
  templateUrl: 'app.html'
})
/**
 * @class MyApp
 *
 * @description Init class with rootPage Welcome
 *
 **/
export class GeteduroamApp {
  rootPage;
  rootParams = {};
  profile: ProfileModel;
  versionAndroid: boolean = false;
  protected checkExtFile: boolean = false;
  /**
   * @constructor
   *
   */
  constructor(private platform: Platform, private config: Config, private modalCtrl: ModalController,
              private screenOrientation: ScreenOrientation, public errorHandler: ErrorHandlerProvider,
              private networkInterface: NetworkInterface, private global: GlobalProvider, private dictionary: DictionaryServiceProvider,
              public event: Events, private getEduroamServices: GeteduroamServices) {
    this.platform.ready().then(async () => {
      // Transition provider, to navigate between pages
      this.config.setTransition('transition', Transition);
      // Setting the dictionary
      this.setDictionary();
      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      await this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);
      // Listener to get external file
      await this.checkExternalOpen();
      // Listener to get status connection, apply when change status network
      await this.checkConnection();
      // Plugin wifiEAPConfigurator associatedNetwork
      await this.associatedNetwork();
      // Add listeners to app
      await this.addListeners();
    });
  }
  /**
   * This method check if network is associated and flow to initialize app
   */
  async associatedNetwork() {
    if (!this.checkExtFile) {
      const isAssociated = await this.isAssociatedNetwork();
      if (!!this.platform.is('android') && !isAssociated.success ||
        !!this.platform.is('ios') && !!isAssociated.success) {
        if (!!isAssociated.overridable) {
          this.rootPage = ReconfigurePage;
          this.getAssociation(isAssociated);
          this.global.setOverrideProfile(true);
        } else {
          this.versionAndroid = true;
          this.removeAssociatedManually();
        }
        //this.rootPage = !!isAssociated.overridable ? ConfigurationScreen : ReconfigurePage;
      } else{
        this.rootPage = ConfigurationScreen;
        // this.getAssociation(isAssociated);
        // this.global.setOverrideProfile(true);
      }
    }
  }
  async checkExternalOpen() {
    // Listening to open app when open from a file
    App.addListener('appUrlOpen', async (urlOpen: AppUrlOpen) => {
      this.global.setExternalOpen();
      this.navigate(urlOpen.url);
    });
  }
  /**
   * This method check if network is enabled and show a error message to user remove network already associated
   * manually
   */
  async removeAssociatedManually() {
    let connect = await this.statusConnection();
    if (!!this.versionAndroid) {
      let errorModal = this.modalCtrl.create(ErrorsPage, {
        error: this.dictionary.getTranslation('error', 'available1') +
            this.global.getSsid() + this.dictionary.getTranslation('error', 'available2') +
            this.global.getSsid() + '.', isFinal: false, link: '', method: 'removeConnection'
      });
      errorModal.onDidDismiss(() => {
        this.rootPage = ConfigurationScreen;
      });
      await errorModal.present();
    } else if (connect.connected) {
      await this.errorHandler.handleError(
          this.dictionary.getTranslation('error', 'available1') + this.global.getSsid() +
          this.dictionary.getTranslation('error', 'available2') +
          this.global.getSsid() + '.', false, '', 'removeConnection', true);
    } else {
        await this.errorHandler.handleError(
            this.dictionary.getTranslation('error', 'available1') +
            this.global.getSsid() + this.dictionary.getTranslation('error', 'available2') +
            this.global.getSsid() + '.\n' + this.dictionary.getTranslation('error', 'turn-on') +
            this.global.getSsid() + '.', false, '', 'enableAccess', false);
    }
  }
  /**
   * This method add listeners needed to app
   */
  addListeners() {
    // Listening to changes in network states, it show toast message when status changed
    Network.addListener('networkStatusChange', async () => {
      let connectionStatus: NetworkStatus = await this.statusConnection();

      if (!this.checkExtFile) {
        this.connectionEvent(connectionStatus);
        !connectionStatus.connected ?
            this.alertConnection(this.dictionary.getTranslation('error', 'turn-on') +
                this.global.getSsid() + '.') :
            this.alertConnection(this.dictionary.getTranslation('text', 'network-available'));
      }
    });

    App.addListener('backButton', () => {
      this.platform.backButton.observers.pop();
    });
  }
  /**
   * This method open ProfilePage when the app is initialize from an eap-config file
   * @param uri
   */
  async navigate(uri: string | any) {
    if (!!uri.includes('.eap-config') || !!uri.includes('file') || !!uri.includes('document') || !!uri.includes('octet-stream')) {
      this.checkExtFile = this.global.getExternalOpen();
      this.profile = new ProfileModel();
      this.profile.eapconfig_endpoint = !!uri.url ? uri.url : uri;
      this.global.setProfile(this.profile);
      const method = await this.getEduroamServices.eapValidation(this.profile);
      if (method) {
        this.profile.oauth = Number(this.global.getAuthenticationMethod().eapMethod.type) === 13;
      }
      //this.global.setSsid(this.global.getCredentialApplicability().iEEE80211[0].ssid[0])
      this.rootPage = !!this.profile.oauth ? ConfigFilePage : ProfilePage;
    }
  }
  getAssociation(isAssociated) {
    if (!!this.platform.is('android')) {
      this.rootParams = !isAssociated.success && !!isAssociated.overridable ? {'reconfigure': true} : {'reconfigure': false};
    } else {
      this.rootParams = isAssociated.message.includes('noNetworksFound') ? {'reconfigure': false} : {'reconfigure': true} ;
    }
  }
  /**
   * This method shown an error message when network is disconnect
   */
  async notConnectionNetwork() {
    if (!this.checkExtFile) {
      const isAssociated = await this.isAssociatedNetwork();
      this.getAssociation(isAssociated);
      if (!isAssociated.success && !isAssociated.overridable) {
        this.removeAssociatedManually();
      } else {
        await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'turn-on') +
            this.global.getSsid() + '.', false, '', 'enableAccess', true);
      }
    }
  }
  /**
   *  This method call to the plugin and return if network if just associated
   *
   */
  async isAssociatedNetwork() {
    return await WifiEapConfigurator.isNetworkAssociated({'ssid': 'eduroam'});
  }
  /**
   * This method check connection to initialized app
   * and show Toast message
   */
  private async checkConnection() {
    let connectionStatus = await this.statusConnection();
    if (!this.checkExtFile) {
      this.connectionEvent(connectionStatus);
      if (!connectionStatus.connected) {
        if (this.platform.is('android')) {
          await this.enableWifi();
          const connected = await this.statusConnection();
          const info = await Device.getInfo();
          if (!connected.connected && parseInt(info.osVersion) < 10) {
            await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'turn-on') +
                this.global.getSsid() + '.', false, '', 'enableAccess', true);
          }
        } else {
          this.notConnectionNetwork();
        }
      }
    }
  }
  /**
   * This method enable wifi on Android devices.
   *
   */
  async enableWifi() {
    await WifiEapConfigurator.enableWifi();
  }
  /**
   * This method throw an event to disabled button when network is disconnected.
   * @param connectionStatus
   */
  protected connectionEvent(connectionStatus: NetworkStatus) {
    connectionStatus.connected ? this.event.publish('connection', 'connected') :
        this.event.publish('connection', 'disconnected');
  };
  /**
   * This method check status of connection
   */
  private async statusConnection(): Promise<NetworkStatus> {
    return await Network.getStatus()
  }
  /**
   * This method show a toast message
   * @param text
   */
  async alertConnection(text: string) {
    await Toast.show({
      text: text,
      duration: 'long'
    })
  }
  /**
   * This method sets the global dictionary
   *  Default: 'en'
   */
  private setDictionary(){
    this.dictionary.loadDictionary('en');
  }
}
