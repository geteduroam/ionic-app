import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
import { ProfilePage } from '../profile/profile';
import { ErrorsPage } from '../errors/errors';
import { ConfirmPage } from '../confirm/confirm';
import { InstitutionPage } from '../institution/institution';
import { ConfigPage } from '../config/config';
import { CatflowPage } from '../catflow/catflow';
import { AuthPage } from '../auth/auth';

declare var Capacitor
const { WifiEapConfigurator } = Capacitor.Plugins;

@Component({
  selector: 'page-welcome',
  templateUrl: 'welcome.html',
})
export class WelcomePage {

  constructor(public navCtrl: NavController, public navParams: NavParams) {
  }

  async configure() {

    /*await WifiEapConfigurator.test({
      ssid: "eduroam", username: "iagtprof@alu.upo.es", password: "4cHK6kbj", eap: 21, servername: "radius.upo.es", auth: 5,
      caCertificate: "MIIEpzCCA4+gAwIBAgIJAKIkGIQeh3zWMA0GCSqGSIb3DQEBBQUAMIGTMQswCQYDVQQGEwJGUjEPMA0GA1UECBMGUmFkaXVzMRIwEAYDVQQHEwlTb21ld2hlcmUxFTATBgNVBAoTDEV4YW1wbGUgSW5jLjEgMB4GCSqGSIb3DQEJARYRYWRtaW5AZXhhbXBsZS5jb20xJjAkBgNVBAMTHUV4YW1wbGUgQ2VydGlmaWNhdGUgQXV0aG9yaXR5MB4XDTExMDYxNzA4NDQzMloXDTEyMDYxNjA4NDQzMlowgZMxCzAJBgNVBAYTAkZSMQ8wDQYDVQQIEwZSYWRpdXMxEjAQBgNVBAcTCVNvbWV3aGVyZTEVMBMGA1UEChMMRXhhbXBsZSBJbmMuMSAwHgYJKoZIhvcNAQkBFhFhZG1pbkBleGFtcGxlLmNvbTEmMCQGA1UEAxMdRXhhbXBsZSBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQC6pZA5is3wTOIbcI3zfMzpZivornW4cthYrL3RveDpQhW79ufIvzx0gAwrikmTCg+FpNij7ljAHjskqNtX/QvXelqv5qiqllY7kEgmEwO5gozmROisaqKdRszPtcBc87ns6hO2vEZaeX0VH2cfDVoQ80R5qLyB5dslM29YChaZjEbn/usZxQ1JYyhJ7MsJbX0+RLAj4Br9DoJSoLhWJLgfcQcklTbB9Yx1kpBdOxjtLvGh1Wd7WjnZoY80WvNP3dVb7tNggHh7AMTAdxEzSwKKtJDItZcZp5F0QBRywtXEV3V0lhCjrCfrP+M4k+1+qgBZ2Bq+j+lbOn6ge6xGatvlAgMBAAGjgfswgfgwHQYDVR0OBBYEFLS3iO92YWGFdCM8UAQ8VBVvPlslMIHIBgNVHSMEgcAwgb2AFLS3iO92YWGFdCM8UAQ8VBVvPlsloYGZpIGWMIGTMQswCQYDVQQGEwJGUjEPMA0GA1UECBMGUmFkaXVzMRIwEAYDVQQHEwlTb21ld2hlcmUxFTATBgNVBAoTDEV4YW1wbGUgSW5jLjEgMB4GCSqGSIb3DQEJARYRYWRtaW5AZXhhbXBsZS5jb20xJjAkBgNVBAMTHUV4YW1wbGUgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ggkAoiQYhB6HfNYwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOCAQEASPHfhQEM2uhzPgGfDsSO7bZK/L4XTE+Vc0xVlyqUsM5UN2qcweA7fWbnJDv3KoB6mzsFQoYg049b1QzqAcmwBer4lEbGmcjgg9kAoy8+EeKON+MiSgAfVk2GM/UOMbaUmKJFPNDdMHPX5s07GiYksnFlGTz+IS2/jzRN6pd0jBdNx8uCm0R9AxOkpYlvfVRY+K28AjRQS0z/seRsVo962MjmXpyxoDe0GC+WKRw/hda/PsUCAviWF96yFw1OcUXKJgC9G1hfDHl3udNgW4TvsSP3QnSDS7j8BnRqzkcbmoASNkSINIqF4/flRTP1iwYqIY6NkYXI5OVd7/PgZ1GWuQ=="
    })*/

     await WifiEapConfigurator.configureAP({ssid: "eduroam", username: "emergya@ad.eduroam.no", password: "crocodille", eap: 25, servername: "eduroam.uninett.no", auth: 4, anonymous:'anonymous@uninett.no',
     caCertificate: "MIIEbzCCA1egAwIBAgIJAJAhu7l6dg+nMA0GCSqGSIb3DQEBBQUAMEoxCzAJBgNV BAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQDEx1VTklORVRUIENl cnRpZmljYXRlIEF1dGhvcml0eTAeFw0xMDAyMDYwMDEyMzBaFw0yMDAyMDQwMDEy MzBaMEoxCzAJBgNVBAYTAk5PMRMwEQYDVQQKEwpVTklORVRUIEFTMSYwJAYDVQQD Ex1VTklORVRUIENlcnRpZmljYXRlIEF1dGhvcml0eTCCASIwDQYJKoZIhvcNAQEB BQADggEPADCCAQoCggEBAK2+21jlJLycaCgg6TBo+i37DkWvW4UR3ptLzQAQfBuO SfPBPG9zXhmn0z/gNWfpbAwETiW+2oTcSKz/XJ0Ej1dFnySNWBnNb6rOY7GrTAvk RfDbpacQATPwg9RnvBs4xR+6TGNLcYjcyEnjF+Xd29aRzH/rFkJHq2pM6rT5BpSc Q4n1DrB2y+E812UjDYhx8KnD9Zh+83wpa3tMRI5J9n7AuqrBThS4xudCAcJLMyu3 KTEnBpRMRfduVyndPTJe+EVcp3XBip41Biza73ZFScqMDFfskc2jT3XV3Tz+0Act g56m+JirRtcQc8lP7o/P6BXTRmIfeXbHuX7/BSE+AXECAwEAAaOCAVYwggFSMB0G A1UdDgQWBBQlxqCOiIgff64MlbIUojA2QgTzTjB6BgNVHSMEczBxgBQlxqCOiIgf f64MlbIUojA2QgTzTqFOpEwwSjELMAkGA1UEBhMCTk8xEzARBgNVBAoTClVOSU5F VFQgQVMxJjAkBgNVBAMTHVVOSU5FVFQgQ2VydGlmaWNhdGUgQXV0aG9yaXR5ggkA kCG7uXp2D6cwDAYDVR0TBAUwAwEB/zAbBgNVHREEFDASgRBkcmlmdEB1bmluZXR0 Lm5vMDgGA1UdHwQxMC8wLaAroCmGJ2h0dHA6Ly9jYS51bmluZXR0Lm5vL3VuaW5l dHQtY2EtY3JsLnBlbTAzBggrBgEFBQcBAQQnMCUwIwYIKwYBBQUHMAGGF2h0dHA6 Ly9vY3NwLnVuaW5ldHQubm8vMBsGA1UdEgQUMBKBEGRyaWZ0QHVuaW5ldHQubm8w DQYJKoZIhvcNAQEFBQADggEBAA9/27nksOl8d7uwi8Ce0u8WOpwDnwUUdYu0/1U9 1bG+bVxFL/rmenLVJJ9vaU0jxa/xHG2r8Q1RvIz1OqGX8XpbzB9cIB2Bj4kIJ+wg +pHroH9hmhJkf1gxMphtcZL3B2KAAc1B27ZchEJifFJuvL+wghAWVh0iwxhul5JO gDH0cXwvNyjRJjR70uvpU2YmRhNunqhU6hd89HPZpSybq5LU939i5HSnSgAsqQmO SCt0APlJNlJ/y5UWxMBO9ayycIuSHbORBJ8ZnXHw3yScbIEioqvAaDJNQUTNw8Pn n/dq6ffTELCFs/4QBOz7av0IxjnemYuCzgUZmb+YPhYKW+c="})
   
  }

  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  async navigateTo(page: string) {
    switch (page) {
      case 'profile':
        await this.navCtrl.push(ProfilePage);
        break;
      case 'error':
        await this.navCtrl.push(ErrorsPage);
        break;
      case 'confirm':
        await this.navCtrl.push(ConfirmPage);
        break;
      case 'config':
        await this.navCtrl.push(ConfigPage);
        break;
      case 'institution':
        await this.navCtrl.push(InstitutionPage);
        break;
      case 'catflow':
        await this.navCtrl.push(CatflowPage);
        break;
      case 'auth':
        await this.navCtrl.push(AuthPage);
        break;
    }
  }

}
