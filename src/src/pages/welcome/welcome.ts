import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';
import { ConfigurationScreen } from '../configScreen/configScreen';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';
import { NetworkServiceProvider } from '../../providers/network-service/network-service';
import { Plugins } from '@capacitor/core';
const { Network } = Plugins;

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})

export class WelcomePage  {
  isDisabled: boolean;

  constructor(private platform: Platform, public navCtrl: NavController, public navParams: NavParams,
              private error: ErrorHandlerProvider, private networkService: NetworkServiceProvider) {
    this.checkConnect();
  }
  async checkConnect() {
    let connection = await this.networkService.getStatus();

    this.isDisabled = connection.connected;
    /*
        Network.addListener('networkStatusChange', async () => {
          this.toogleButton();
        })
    */
  }
  async toogleButton() {
    this.isDisabled = !this.isDisabled;
  }

  async navigateTo() {
    await this.navCtrl.setRoot(ConfigurationScreen, null, { animation: 'transition' });
  }

  exitApp() {
    this.platform.exitApp();
  }

}
