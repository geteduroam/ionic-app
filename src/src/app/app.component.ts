import { Config, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Component } from '@angular/core';
import { WelcomePage } from '../pages/welcome/welcome';
import { ProfilePage } from '../pages/profile/profile';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/Transition';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { AppUrlOpen, Plugins } from '@capacitor/core';
import { GlobalProvider } from '../providers/global/global';
import { ErrorHandlerProvider } from '../providers/error-handler/error-handler';
import {ProfileModel} from "../shared/models/profile-model";
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
  rootPage = WelcomePage;

  profile: ProfileModel;
  /**
   * @constructor
   *
   */
  constructor(private platform: Platform, private config: Config, public splashScreen: SplashScreen,
              private screenOrientation: ScreenOrientation, public errorHandler: ErrorHandlerProvider,
              private networkInterface: NetworkInterface, private global: GlobalProvider) {

    this.platform.ready().then(async () => {

      this.splashScreen.hide();

      // Transition provider, to navigate between pages
      this.config.setTransition('transition', Transition);

      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      await this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);

      // Plugin wifiEAPConfigurator associatedNetwork
      this.associatedNetwork();

      // Listener to get status connection, apply when change status network
      this.checkConnection();

      Network.addListener('networkStatusChange', async () => {
        await this.statusConnection();

      });

      // Listener to open app when open from a file
      App.addListener('appUrlOpen', (urlOpen: AppUrlOpen) => {
        this.navigate(urlOpen.url);
      });

      await this.getLaunchUrl();
    });
  }

  async associatedNetwork() {
    WifiEapConfigurator.isNetworkAssociated({'ssid': this.global.getSsid()}).then((res) => {
      res.message === 'plugin.wifieapconfigurator.error.network.alreadyAssociated' ?
        this.errorHandler.handleError('A network connection called '+ this.global.getSsid() +
          ' is already available in the device.\n Please go to Settings > Wifi Networks > Saved Networks and remove it' +
          ' if you want to reconfigure '+ this.global.getSsid() + '.', false) :
        this.enableWifi();
    });

  }

  enableWifi() {
    WifiEapConfigurator.enableWifi();
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

  // TODO: Open from a file
  navigate(uri: string) {
    if (!uri.includes('.eap-config')) return;

    // Route of the opened file
    uri = uri.substring(19);

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
   * This method check connection to initialized app
   * and show Toast message
   */
  private async checkConnection() {
    let connect = await this.statusConnection();

    // Disconnect error
    !connect.connected ?  this.alertConnection('Please connect device to network') :
      this.alertConnection('Connected by: '+ connect.connectionType);
  }

  /**
   * This method check status of connection
   */
  private async statusConnection() {
    return await Network.getStatus()
  }

  getRoot(){
    return !this.profile ? WelcomePage : ProfilePage;
  }
}

