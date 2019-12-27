import { Config, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Component } from '@angular/core';
import { WelcomePage } from '../pages/welcome/welcome';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/Transition';
import { Plugins } from '@capacitor/core';
import { ErrorHandlerProvider } from '../providers/error-handler/error-handler';
import { NetworkInterface } from '@ionic-native/network-interface/ngx';

const { Network } = Plugins;

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
              private screenOrientation: ScreenOrientation, private errorHandler: ErrorHandlerProvider,
              private networkInterface: NetworkInterface) {

    platform.ready().then(() => {

      // Listener to get status connection
      Network.addListener('networkStatusChange', async (status) => {

        let connect = await Network.getStatus();

        // Disconnect error
        if (!connect.connected) {
          await this.errorHandler.handleError('Disconnect', true);
        }

        // Get IpAddress on Wifi Connection
        this.networkInterface.getWiFiIPAddress().then(res => {
          // TODO: For security, delete these lines
          // Return object - > {subnet: number, ip: number}
          console.log('WifiIpAddress: ', res);
        });
      });

      // Transition provider, to navigate between pages
      config.setTransition('transition', Transition);

      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);
    });
  }
}

