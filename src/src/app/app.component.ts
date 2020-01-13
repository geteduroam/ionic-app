import { Config, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Component } from '@angular/core';
import { WelcomePage } from '../pages/welcome/welcome';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/Transition';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { AppUrlOpen, Plugins } from '@capacitor/core';
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

  /**
   * @constructor
   *
   */
  constructor(private platform: Platform, private config: Config, public splashScreen: SplashScreen,
              private screenOrientation: ScreenOrientation,
              private networkInterface: NetworkInterface) {

    this.platform.ready().then(() => {
      this.splashScreen.hide();
      // Transition provider, to navigate between pages
      this.config.setTransition('transition', Transition);

      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);


      // Plugin wifiEAPConfigurator
      this.wifiConfigurator().then().catch((e) => {console.log(e)});

      // Listener to get status connection, apply when change status network
      this.checkConnection();

      Network.addListener('networkStatusChange', async () => {
        await this.checkConnection();

        this.networkInterface.getWiFiIPAddress().then(res => {
          // TODO: delete these lines
          // Return object - > {subnet: number, ip: number}
          console.log('WifiIpAddress: ', res);
        });

      });
      App.addListener('appUrlOpen', (urlOpen: AppUrlOpen) => {
        console.log('App URL Open', urlOpen);
        this.navigate(urlOpen.url);
      });
      this.getLaunchUrl();
    });
  }
  async getLaunchUrl() {
    const urlOpen = await Plugins.App.getLaunchUrl();
    if(!urlOpen || !urlOpen.url) return;
    console.log('Launch URL', urlOpen);
    this.navigate(urlOpen.url);
  }

  navigate(uri: string) {
    // THIS MUST EQUAL THE 'custom_url_scheme' from your Android intent:
    if (!uri.includes('.eap-config')) return;
    // Strip off the custom scheme:
    uri = uri.substring(19);
    console.log('esto es uri de navigate: ', uri)
  }

  async wifiConfigurator() {

    const connection = await WifiEapConfigurator.configureAP({
      ssid: "eduroam",
      username: "emergya@ad.eduroam.no",
      password: "crocodille",
      eap: 25,
      servername: "",
      auth: 4,
      anonymous: "",
      caCertificate: ""
    });

    console.log('Connectiono WifiEapConfigurator: ', connection);

  }

  async alertConnection(text: string) {

    await Toast.show({
      text: text,
      duration: 'long'
    })
  }

  private async checkConnection() {
    let connect = await this.statusConnection();
    // Disconnect error
    if (!connect.connected) {
     this.alertConnection('Please connect device to network')
    } else {
      this.alertConnection('Connected by: '+connect.connectionType);
    }
  }

  private async statusConnection() {
    return await Network.getStatus()
  }
}

