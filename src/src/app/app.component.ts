import { Config, Platform } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { Component } from '@angular/core';
import { WelcomePage } from '../pages/welcome/welcome';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';
<<<<<<< HEAD
import { Transition } from '../providers/transition/transition';
import {AppUrlOpen, Plugins} from '@capacitor/core';
=======
import { Transition } from '../providers/transition/Transition';
>>>>>>> 3978b992f43a1a6f9c584046fc6656e661ed056d
import { NetworkInterface } from '@ionic-native/network-interface/ngx';
import { AppUrlOpen, Plugins } from '@capacitor/core';
const { Toast, Network, App } = Plugins;
declare var Capacitor;
const { WifiEapConfigurator } = Capacitor.Plugins;

<<<<<<< HEAD
const { Toast, Network, App } = Plugins;
=======
>>>>>>> 3978b992f43a1a6f9c584046fc6656e661ed056d

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

<<<<<<< HEAD
    platform.ready().then(async () => {
      splashScreen.hide();
      this.checkConnection();

=======
    this.platform.ready().then(() => {
      this.splashScreen.hide();
>>>>>>> 3978b992f43a1a6f9c584046fc6656e661ed056d
      // Transition provider, to navigate between pages
      this.config.setTransition('transition', Transition);

      // ScreenOrientation plugin require first unlock screen and locked it after in mode portrait orientation
      this.screenOrientation.unlock();
      await this.screenOrientation.lock(this.screenOrientation.ORIENTATIONS.PORTRAIT_PRIMARY);


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

<<<<<<< HEAD
      App.addListener('appUrlOpen', (urlOpen: AppUrlOpen) => {
        console.log('App URL Open', urlOpen);
        this.navigate(urlOpen.url);
      });
      this.getLaunchUrl();
=======
    await WifiEapConfigurator.configureAP({
      ssid: "eduroam",
      username: "emergya@ad.eduroam.no",
      password: "crocodille",
      eap: 25,
      servername: "eduroam.uninett.no",
      auth: 4,
      anonymous: "anonymous@uninett.no",
      caCertificate: "MIIEbzCCA1egAwIBAgIJAJAhu7l6dg+nMA0GCSqGSIb3DQEBBQUAMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTAeFw0xMDAyMDYwMDEyMzBaFw0yMDAyMDQwMDEyMzBaMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK2+21jlJLycaCgg6TBo+i37DkWvW4UR3ptLzQAQfBuOSfPBPG9zXhmn0z/gNWfpbAwETiW+2oTcSKz/XJ0Ej1dFnySNWBnNb6rOY7GrTAvkRfDbpacQATPwg9RnvBs4xR+6TGNLcYjcyEnjF+Xd29aRzH/rFkJHq2pM6rT5BpScQ4n1DrB2y+E812UjDYhx8KnD9Zh+83wpa3tMRI5J9n7AuqrBThS4xudCAcJLMyu3KTEnBpRMRfduVyndPTJe+EVcp3XBip41Biza73ZFScqMDFfskc2jT3XV3Tz+0Actg56m+JirRtcQc8lP7o/P6BXTRmIfeXbHuX7/BSE+AXECAwEAAaOCAVYwggFSMB0GA1UdDgQWBBQlxqCOiIgff64MlbIUojA2QgTzTjB6BgNVHSMEczBxgBQlxqCOiIgff64MlbIUojA2QgTzTqFOpEwwSjELMAkGA1UEBhMCTk8xEzARBgNVBAoTClVOSU5FVFQgQVMxJjAkBgNVBAMTHVVOSU5FVFQgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ggkAkCG7uXp2D6cwDAYDVR0TBAUwAwEB/zAbBgNVHREEFDASgRBkcmlmdEB1bmluZXR0Lm5vMDgGA1UdHwQxMC8wLaAroCmGJ2h0dHA6Ly9jYS51bmluZXR0Lm5vL3VuaW5ldHQtY2EtY3JsLnBlbTAzBggrBgEFBQcBAQQnMCUwIwYIKwYBBQUHMAGGF2h0dHA6Ly9vY3NwLnVuaW5ldHQubm8vMBsGA1UdEgQUMBKBEGRyaWZ0QHVuaW5ldHQubm8wDQYJKoZIhvcNAQEFBQADggEBAA9/27nksOl8d7uwi8Ce0u8WOpwDnwUUdYu0/1U91bG+bVxFL/rmenLVJJ9vaU0jxa/xHG2r8Q1RvIz1OqGX8XpbzB9cIB2Bj4kIJ+wg+pHroH9hmhJkf1gxMphtcZL3B2KAAc1B27ZchEJifFJuvL+wghAWVh0iwxhul5JOgDH0cXwvNyjRJjR70uvpU2YmRhNunqhU6hd89HPZpSybq5LU939i5HSnSgAsqQmOSCt0APlJNlJ/y5UWxMBO9ayycIuSHbORBJ8ZnXHw3yScbIEioqvAaDJNQUTNw8Pnn/dq6ffTELCFs/4QBOz7av0IxjnemYuCzgUZmb+YPhYKW+c="
>>>>>>> 3978b992f43a1a6f9c584046fc6656e661ed056d
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

