import { Config, Platform, ToastController } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Component } from '@angular/core';
import { WelcomePage } from '../pages/welcome/welcome';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/Transition';
import { Plugins } from '@capacitor/core';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';

const { Toast, Network } = Plugins;

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

    platform.ready().then(() => {
      this.checkConnection();

      // Transition provider, to navigate between pages
      config.setTransition('transition', Transition);

      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);

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
}

