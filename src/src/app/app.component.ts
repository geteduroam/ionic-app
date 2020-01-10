import { Config, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Component } from '@angular/core';
import { WelcomePage } from '../pages/welcome/welcome';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/transition';
import {AppUrlOpen, Plugins} from '@capacitor/core';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';

const { Toast, Network, App } = Plugins;

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
  constructor(platform: Platform, splashScreen: SplashScreen, config: Config,
              private screenOrientation: ScreenOrientation,
              private networkInterface: NetworkInterface) {

    platform.ready().then(async () => {
      splashScreen.hide();
      this.checkConnection();

      // Transition provider, to navigate between pages
      config.setTransition('transition', Transition);

      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      await this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);

      // Listener to get status connection, apply when change status network
      Network.addListener('networkStatusChange', async (status) => {
        console.log('Status network listener: ', status);
        await this.checkConnection();

        this.networkInterface.getWiFiIPAddress().then(res => {
          // TODO: For security, delete these lines
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

  async getLaunchUrl() {
    const urlOpen = await Plugins.App.getLaunchUrl();
    if(!urlOpen || !urlOpen.url) return;
    console.log('Launch URL', urlOpen);
    this.navigate(urlOpen.url);
  }

  navigate(uri: string) {
    // THIS MUST EQUAL THE 'custom_url_scheme' from your Android intent:
    console.log('uri.startsWith(\'com.emergya.geteduroam:/\')', uri.startsWith('com.emergya.geteduroam:/'));
    if (!uri.startsWith('com.emergya.geteduroam:/')) return;
    // Strip off the custom scheme:
    uri = uri.substring(24);
    console.log('esto es uri de navigate: ', uri)
  }
}

