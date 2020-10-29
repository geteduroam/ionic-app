import {Config, Events, Nav, Platform} from 'ionic-angular';
import {Component, ViewChild} from '@angular/core';
import { ProfilePage } from '../pages/profile/profile';
import { ConfigurationScreen } from '../pages/configScreen/configScreen';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/Transition';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { AppUrlOpen, Plugins,  registerWebPlugin } from '@capacitor/core';
import { GlobalProvider } from '../providers/global/global';
import { ErrorHandlerProvider } from '../providers/error-handler/error-handler';
import {ProfileModel} from "../shared/models/profile-model";
import {DictionaryServiceProvider} from "../providers/dictionary-service/dictionary-service-provider.service";
import {NetworkStatus} from "@capacitor/core/dist/esm/core-plugin-definitions";
import {GeteduroamServices} from "../providers/geteduroam-services/geteduroam-services";
import {OAuth2Client} from '@byteowls/capacitor-oauth2';
import {ClientCertificatePassphrasePage} from "../pages/clientCertificatePassphrase/clientCertificatePassphrase";

declare var Capacitor;
const { Toast, Network, App } = Plugins;
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

  @ViewChild(Nav) navCtrl: Nav;

  rootPage;

  rootParams = {};

  profile: ProfileModel;

  protected checkExtFile: boolean = false;

  lastTimeBackPress = 0;

  timePeriodToExit = 2000;

  /**
   * @constructor
   *
   */
  constructor(private platform: Platform, private config: Config,
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

  ngOnInit() {
    registerWebPlugin(OAuth2Client);
  }
  /**
   * This method check if network is associated and flow to initialize app
   */
  async associatedNetwork() {

    if (this.platform.is('android')) {
      this.enableWifi();
    }
    if (!this.checkExtFile) {
      this.rootPage = ConfigurationScreen;
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

    if (connect.connected) {

      await this.errorHandler.handleError(
        this.dictionary.getTranslation('error', 'duplicate'), false, '', 'removeConnection', true);

    } else {

      await this.errorHandler.handleError(
        this.dictionary.getTranslation('error', 'duplicate') + '\n' +
        this.dictionary.getTranslation('error', 'turn-on'), false, '', 'enableAccess', false);
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
          this.alertConnection(this.dictionary.getTranslation('error', 'turn-on')) :
          this.alertConnection(this.dictionary.getTranslation('text', 'network-available'));
      }
    });

    if (this.global.isAndroid()){
      this.platform.registerBackButtonAction(() => {
        // get current active page
        let view = this.navCtrl.getActive();
        if (view.component.name == "ConfigurationScreen") {
          //Double check to exit app
          if (new Date().getTime() - this.lastTimeBackPress < this.timePeriodToExit) {
            this.platform.exitApp(); //Exit from app
          } else {
            this.alertConnection('Press back again to exit App');
            this.lastTimeBackPress = new Date().getTime();
          }
        } else {
          // go to previous page
          this.navCtrl.pop({});
        }
      });
    }
  }

  /**
   * This method open ProfilePage when the app is initialize from an eap-config file
   * @param uri
   */
  async navigate(uri: string | any) {
    if (!!uri.includes('.eap-config') || !!uri.includes('file') || !!uri.includes('external') || !!uri.includes('document') || !!uri.includes('octet-stream')) {
      this.checkExtFile = this.global.getExternalOpen();
      this.profile = new ProfileModel();
      this.profile.eapconfig_endpoint = !!uri.url ? uri.url : uri;
      this.global.setProfile(this.profile);
      const method = await this.getEduroamServices.eapValidation(this.profile);
      if (method) {
        this.profile.oauth = Number(this.global.getAuthenticationMethod().eapMethod.type) === 13;
      }
      if (!this.rootPage) {
        this.rootPage = !!this.profile.oauth ? ClientCertificatePassphrasePage : ProfilePage;
      } else {
        await this.navCtrl.push( !!this.profile.oauth ? ClientCertificatePassphrasePage : ProfilePage );
      }
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
      this.rootPage = ConfigurationScreen;

      const isAssociated = await this.isAssociatedNetwork();
      this.getAssociation(isAssociated);

      if (!isAssociated.success && !isAssociated.overridable) {
        this.removeAssociatedManually();

      } else {
        await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'turn-on'), false, '', 'enableAccess', true);
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
        this.notConnectionNetwork();
      } else {
        this.global.setDiscovery(await this.getEduroamServices.discovery());
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
  protected connectionEvent(connectionStatus: NetworkStatus){
    connectionStatus.connected ? this.event.publish('connection', 'connected') :
      this.event.publish('connection', 'disconnected');
  }

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

