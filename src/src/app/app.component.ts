import {Config, Events, Platform} from 'ionic-angular';
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

const { Toast, Network, App } = Plugins;
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
  /**
   * @constructor
   *
   */
  constructor(private platform: Platform, private config: Config,
              private screenOrientation: ScreenOrientation, public errorHandler: ErrorHandlerProvider,
              private networkInterface: NetworkInterface, private global: GlobalProvider, private dictionary: DictionaryServiceProvider,
              public event: Events) {

    this.platform.ready().then(async () => {
      // Transition provider, to navigate between pages
      this.config.setTransition('transition', Transition);
      // Setting the dictionary
      this.setDictionary();
      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      await this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);
      // Add listeners to app
      await this.addListeners();
      // Listener to get status connection, apply when change status network
      await this.checkConnection();
      // Plugin wifiEAPConfigurator associatedNetwork
      await this.associatedNetwork();
      // Open app from a file
      await this.getLaunchUrl();
    });
  }

  async associatedNetwork() {

    if (this.platform.is('android')) {
      this.enableWifi();
    }

    const isAssociated = await this.isAssociatedNetwork();
    console.log('isAssociated value: ', isAssociated);
    if (!this.rootPage) {
      this.rootPage = !!isAssociated.success ? ConfigurationScreen : ReconfigurePage;
    }

    !isAssociated.success && !isAssociated.overridable ? this.removeAssociatedManually(true) : '';
  }

  async removeAssociatedManually(connectionEnabled: boolean) {
    if(connectionEnabled){
      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'available1')+ this.global.getSsid() +
          this.dictionary.getTranslation('error', 'available2')+ this.global.getSsid() + '.', false);
    } else {
      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'available1')+ this.global.getSsid() +
          this.dictionary.getTranslation('error', 'available2')+ this.global.getSsid() + '.\n' + this.dictionary.getTranslation('error', 'turn-on')+this.global.getSsid()+'.', false);
    }
  }

  /**
   * This method throw the app when is opened from a file
   */
  async getLaunchUrl() {
    const urlOpen = await Plugins.App.getLaunchUrl();
    if(!urlOpen || !urlOpen.url) return;

    this.profile = new ProfileModel();
    this.profile.eapconfig_endpoint = urlOpen.url;
    this.profile.oauth = false;
    this.profile.id = "FileEap";
    this.profile.name = "FileEap";

    this.global.setProfile(this.profile);

  }

  addListeners() {
    // Listening to changes in network states, it show toast message when status changed

    Network.addListener('networkStatusChange', async () => {
      let connectionStatus: NetworkStatus = await this.statusConnection();

      this.connectionEvent(connectionStatus);

      !connectionStatus.connected ?
          this.alertConnection(this.dictionary.getTranslation('error', 'turn-on')+this.global.getSsid()+'.') :
          this.alertConnection(this.dictionary.getTranslation('text', 'network-available'));

    });

    // Listening to open app when open from a file
    App.addListener('appUrlOpen', (urlOpen: AppUrlOpen) => {
      this.navigate(urlOpen.url);
    });
  }

  private connectionEvent(connectionStatus: NetworkStatus){
    connectionStatus.connected ? this.event.publish('connection', 'connected') : this.event.publish('connection', 'disconnected');
  }


  navigate(uri: string) {
    this.rootPage = ProfilePage;
    if (!uri.includes('.eap-config')) return;
  }

  async notConnectionNetwork() {

    this.rootPage = ReconfigurePage;

    const isAssociated = await this.isAssociatedNetwork();
    this.rootParams = !!isAssociated.success ? {'reconfigure': false} : {'reconfigure': true};

    if (!isAssociated.success && !isAssociated.overridable){
      this.removeAssociatedManually(false);
    } else {
      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'turn-on')+this.global.getSsid()+'.', false);
    }
  }

  /**
   * This method check connection to initialized app
   * and show Toast message
   */
  private async checkConnection() {
    let connectionStatus = await this.statusConnection();

    this.connectionEvent(connectionStatus);

    // Disconnect error
    if (!connectionStatus.connected){
      this.notConnectionNetwork();
    }

  }

  /**
   * This method sets the global dictionary
   */
  private setDictionary(){
    //TODO 'en' can be replaced by 'es' for Spanish translation
    this.dictionary.loadDictionary('en');
  }


  async isAssociatedNetwork() {
    return await WifiEapConfigurator.isNetworkAssociated({'ssid': this.global.getSsid()});
  }

  /**
   * This method check status of connection
   */
  private async statusConnection():Promise<NetworkStatus> {
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

  async enableWifi() {
    await WifiEapConfigurator.enableWifi();
  }
}

