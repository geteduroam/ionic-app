import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { LoadingProvider } from '../../providers/loading/loading';
import { ProfileModel } from '../../shared/models/profile-model';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { oAuthModel } from '../../shared/models/oauth-model';
import { HTTP } from '@ionic-native/http/ngx';

declare var window: any;
@Component({
  selector: 'page-oauthFlow',
  templateUrl: 'oauthFlow.html',
})
export class OauthFlow {

  showAll: boolean = false;
  profile: ProfileModel;
  tokenURl: any;

  constructor(private http: HTTP, public navCtrl: NavController, public navParams: NavParams, protected loading: LoadingProvider, protected geteduroamServices: GeteduroamServices) {

  }

  async navigateTo() {
    this.showAll = false;
    await this.navCtrl.push(WifiConfirmation, {}, {animation: 'transition'});
  }

  /**
   * Method executed when the class did enter, usually when swipe back from the next page
   */
  ionViewDidEnter() {
    this.loading.createAndPresent();
    this.profile = this.navParams.get('profile');
   // this.geteduroamServices.buildAuthUrl(this.profile.authorization_endpoint);
    //this.geteduroamServices.buildGenerator(this.profile.eapconfig_endpoint);

/*    this.geteduroamServices.buildTokenUrl(this.profile.token_endpoint);

  profile: {
      eapconfig_endpoint: "https://geteduroam.no/generate.php"
      token_endpoint: "https://geteduroam.no/token.php"
      authorization_endpoint: "https://geteduroam.no/authorize.php"
    }
     */
    this.getData();
    this.loading.dismiss();
    this.showAll = true;
  }

// TODO: REFACTOR
  async getData() {
    const oauth2Options: oAuthModel = {
      client_id: "f817fbcc-e8f4-459e-af75-0822d86ff47a",
      oAuthUrl: "https://demo.eduroam.no/authorize.php",
      type: "code",
      redirectUrl: 'http://localhost:8080/',
      pkce: true,
      scope: 'eap-metadata',

    };

    let oAuth = await this.geteduroamServices.generateOAuthFlow(oauth2Options);

    this.buildFlowAuth(oAuth, oauth2Options);
  }

   buildFlowAuth(oAuth, oauth2Options) {
     let urlToken;
     const flowAuth = new Promise(function (resolve, reject) {
       let browserRef = window.cordova.InAppBrowser.open(oAuth.uri, "_blank", "location=yes, clearsessioncache=no ,clearcache=no");

       browserRef.addEventListener('loadstart', (event) => {

        if (event.url.indexOf(oauth2Options.redirectUrl) === 0) {
          let urlData = event.url.split('code=')[1];
          let arrayData = urlData.split('&state=');
          let code = arrayData[0];
          let state = arrayData[1];

          if (state !== undefined && code !== undefined) {
            const optionToken = {
              url: "https://demo.eduroam.no/token.php",
            };

            urlToken = `${optionToken.url}?client_id=${oauth2Options.client_id}&grant_type=authorization_code&code=${code}&code_verifier=${oAuth.codeVerifier}`;
            resolve(urlToken);
            let tokenRef = window.cordova.InAppBrowser.open(urlToken, "_blank", "location=yes, clearsessioncache=no ,clearcache=no");

            tokenRef.addEventListener('beforeload', () => {
              tokenRef.close();
            });

            browserRef.close();
          }
        }
       });
     });

     flowAuth.then((res) => {
       console.log('Promise then:', res);
       this.getToken(urlToken);
     });
  }

  async getToken(res) {
    const response = await this.http.get(res, {}, {});
    /*
    access_token: "v2.local.bhFE0rDXByB6JYQByEmF8VwBbLWRZbde1reF5blnkvOHaJhdHmxxIVDz3ZlO-jjJ0pT6oA21PaIAqPeOMwMtbPmP9HYGEDcHBSXkif2GyKRYfpVCtfkbvB4wJUUqpkVQNvP1KMCA-9Jrt6kIIMZrH2ZUJli-yP4Y0Qc44BSAYAlEb-SGCQT0L5IKpFaR-1xaxyyyH6udm5tamn52S8co1umXUmNPCzGuDlK6b9sUlElWw-Rcz-JV21EmvwBiBN6Xlsatzg"
    token_type: "Bearer"
    expires_in: 3600
     */

    // TODO: POST -> CREATE BEARER AUTHORIZATION

    this.tokenURl = JSON.parse(response.data);
    let access_token = this.tokenURl.access_token.split('.')[2];
    console.log(access_token);

    //client_id: "f817fbcc-e8f4-459e-af75-0822d86ff47a"

    let generate = `https://geteduroam.no/generate.php?acces_token=Bearer bhFE0rDXByB6JYQByEmF8VwBbLWRZbde1reF5blnkvOHaJhdHmxxIVDz3ZlO-jjJ0pT6oA21PaIAqPeOMwMtbPmP9HYGEDcHBSXkif2GyKRYfpVCtfkbvB4wJUUqpkVQNvP1KMCA-9Jrt6kIIMZrH2ZUJli-yP4Y0Qc44BSAYAlEb-SGCQT0L5IKpFaR-1xaxyyyH6udm5tamn52S8co1umXUmNPCzGuDlK6b9sUlElWw-Rcz-JV21EmvwBiBN6Xlsatzg&format=eap-metadata&`;

  }
}

