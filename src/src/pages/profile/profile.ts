import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { WifiConfirmation } from '../wifiConfirmation/wifiConfirmation';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';
import { isArray, isObject } from 'ionic-angular/util/util';
import { AuthenticationMethod } from '../../shared/entities/authenticationMethod';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';
import { LoadingProvider } from '../../providers/loading/loading';
import { FilesystemDirectory, FilesystemEncoding, Plugins } from '@capacitor/core';
import { ProviderInfo } from '../../shared/entities/providerInfo';
import {ValidatorProvider} from "../../providers/validator/validator";

const { Filesystem, Toast } = Plugins;


@Component({
  selector: 'page-profile',
  templateUrl: 'profile.html'
})
export class ProfilePage implements OnInit{

  showAll: boolean = false;

  /**
   * The profile which is received as a navigation parameter
   */
  profile: any;

  /**
   * The eapConfig retrieved from the profile
   */
  eapConfig: any;

  /**
   * The authentication methods obtained from the eap institutionSearch file
   */
  authenticationMethods: AuthenticationMethod[];

  model = {name: '', pass: ''};

  providerInfo: ProviderInfo;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              private getEduroamServices: GeteduroamServices, private errorHandler: ErrorHandlerProvider,
              public loading: LoadingProvider, private validator: ValidatorProvider) {

    console.log(this.getEapconfigEndpoint);

  }


  async checkForm() {
    //const validForm: boolean = this.checkValidation();
    const validForm: boolean = await this.validator.validateEmail(this.model.name);
    console.log('this form data: ',this.model);

    if (validForm) {
      this.showAll = false;

      if (this.providerInfo[0].providerLogo) {
        await this.navCtrl.push(WifiConfirmation, {
          logo: this.providerInfo[0].providerLogo[0]
        }, {animation: 'transition'});

      } else {
        await this.navCtrl.push(WifiConfirmation, {}, {animation: 'transition'});

      }
    } else{
      console.log('the email is not valid');
    }
  }

  /**
   * Method which returns the eap institutionSearch endpoint
   * @return {any} eapconfig_endpoint the eap institutionSearch endpoint
   */
  getEapconfigEndpoint(){

    return this.profile.eapconfig_endpoint;
  }

  // TODO: REFACTOR THIS CODE
  /**
   * Method executed when the class is initialized.
   * This method updates the property [eapConfig]{@link #eapConfig} by making use of the service [GeteduroamServices]{@link ../injectables/GeteduroamServices.html}.
   * This method also calls [validateEapconfig()]{@link #validateEapconfig}
   * The method obtains the first valid authentication method by calling [getFirstValidAuthenticationMethod()]{#getFirstValidAuthenticationMethod}
   */
  async ngOnInit() {
    this.loading.createAndPresent();
    this.profile = this.navParams.get('profile');
    console.log(this.profile);

    this.eapConfig = await this.getEduroamServices.getEapConfig(this.profile.eapconfig_endpoint);
    // let validEap: boolean = await this.validateEapconfig();
    let validEap: boolean;
    this.authenticationMethods = [];
    this.providerInfo = new ProviderInfo();
    validEap = await this.validator.validateEapconfig(this.eapConfig, this.authenticationMethods, this.providerInfo);
    console.log('this.authenticationMethods: '+this.authenticationMethods);
    console.log('this.providerInfo: '+this.providerInfo);
    console.log('value of validEap: '+validEap);
    if (validEap) {
      //   await this.storageFile(this.eapConfig);
      this.getFirstValidAuthenticationMethod();
      console.log('Fist valid authentication method', this.getFirstValidAuthenticationMethod());
    } else {
      await this.errorHandler.handleError('Invalid eapconfig file', false);
    }

    this.loading.dismiss();
    this.showAll = true;
  }

  // TODO: PROVIDER STORAGE FILES
  async storageFile(file) {

    const fileCert = JSON.stringify(file);
    console.log('This is a cert: ', fileCert);

    try {
      await Filesystem.mkdir({
        createIntermediateDirectories: true,
        path: 'certs',
        directory: FilesystemDirectory.Documents,
        recursive: true
      });

      await Filesystem.writeFile({
        path: 'certs/eap-cert.eap-config',
        data: fileCert,
        directory: FilesystemDirectory.Documents,
        encoding: FilesystemEncoding.UTF8
      });

      await Filesystem.readFile({
        path: 'certs/eap-cert.eap-config',
        directory: FilesystemDirectory.Documents,
        encoding: FilesystemEncoding.UTF8
      });

      await Filesystem.readdir({
        path: 'certs',
        directory: FilesystemDirectory.Documents
      });

      await Filesystem.appendFile({
        path: 'certs/eap-cert.eap-config',
        data: fileCert,
        directory: FilesystemDirectory.Documents,
        encoding: FilesystemEncoding.UTF8
      });

      let uri = await Filesystem.getUri({
        path: 'certs/eap-cert.eap-config',
        directory: FilesystemDirectory.Documents,
      });

      await Toast.show({
        text: "Success save file in " + uri.uri,
        duration: 'long'
      });


    } catch(e) {

      console.error('Unable to write file', e);
    }

  };

  /**
   * Method to get the first valid authentication method form an eap institutionSearch file.
   * @return {AuthenticationMethod} the first valid authentication method
   */
  private async getFirstValidAuthenticationMethod(){
    for (let authenticationMethod of this.authenticationMethods){
      console.log(authenticationMethod.eapMethod.type);
      console.log(['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()));
      if (['13', '21', '25'].indexOf(authenticationMethod.eapMethod.type.toString()) >= 0){
        return authenticationMethod;
      }
    }
    //TODO redirect to error vew when available
    console.error('No valid authentication method available from the eapconfig file');
    await this.errorHandler.handleError('No valid authentication method available from the eapconfig file', true, 'http://google.com');
    return null;
  }

  /**
   * Method executed when the class did enter, usually when swipe back from the next page
   */
  ionViewDidEnter() {
    this.showAll = true;
  }
}
