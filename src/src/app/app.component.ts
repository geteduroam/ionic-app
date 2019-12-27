import { Config, Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Component } from '@angular/core';
import { WelcomePage } from '../pages/welcome/welcome';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
import { Transition } from '../providers/transition/Transition';
import { Plugins } from '@capacitor/core';
import { ErrorHandlerProvider } from '../providers/error-handler/error-handler';

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
              private screenOrientation: ScreenOrientation, private errorHandler: ErrorHandlerProvider) {

    platform.ready().then(() => {

      // Listener to get status connection
      Network.addListener('networkStatusChange', async (status) => {

        let connect = await Network.getStatus();

        if (!connect.connected) {
          await this.errorHandler.handleError('Disconnect', true);
        }
      });

      // Transition provider, to navigate between pages
      config.setTransition('transition', Transition);
      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);
    });
  }
}

