import { Component, ViewChild, NgModule, NgZone } from '@angular/core';
import { Events, Modal, ModalController, NavController, NavParams, Searchbar, ViewController } from 'ionic-angular';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import { ProfilePage } from '../profile/profile';
import { OauthFlow } from '../oauthFlow/oauthFlow';
import { LoadingProvider } from '../../providers/loading/loading';
import { InstitutionSearch } from '../institutionSearch/institutionSearch';
import { Plugins } from '@capacitor/core';
import {BasePage} from "../basePage";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {ProfileModel} from "../../shared/models/profile-model";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";
import {ConfigFilePage} from "../configFile/configFile";

const { Keyboard, App } = Plugins;
declare var window;

@Component({
  selector: 'page-config-screen',
  templateUrl: 'configScreen.html',
})
export class ConfigurationScreen extends BasePage{

  showAll: boolean = false;

  /**
   * Set of available profiles
   */
  profiles: ProfileModel[];

  /**
   * All the institutions retrieved by the service [GeteduroamServices]{@link ../injectables/GeteduroamServices.html}
   */
  institutions: Object[];

  /**
   * Set of institutions filtered by what is written in the search-bar
   */
  filteredinstitutions: Object[];

  /**
   * Selected institution
   */
  institution: Object;

  /**
   * Name of the selected institution used in the search-bar
   */
  institutionName: string = '';

  /**
   * Selected profile
   */
  profile: ProfileModel;

  /**
   * Default profile (if exists) in the selected institution profiles set
   */
  defaultProfile: ProfileModel;

  /**
   * Name of the selected profile
   */
  profileName: string = '';

  /**
   * Id of the selected profile
   */
  selectedProfileId: string;

  /**
   * Property to decide whether or not to show the institutions list
   */
  showinstitutionItems: boolean = false;

  /**
   * Property to show button
   */
  showButton: boolean = true;

  /**
   * Component SearchBar
   */
  @ViewChild('instituteSearchBar') instituteSearchBar: Searchbar;

  /**
   * Constructor
   * */
  constructor(private navCtrl: NavController, private getEduroamServices: GeteduroamServices, private ngZone: NgZone,
              protected loading: LoadingProvider, protected modalCtrl: ModalController, protected event: Events,
              protected dictionary: DictionaryServiceProvider, protected global: GlobalProvider,
              private errorHandler: ErrorHandlerProvider) {
    super(loading, dictionary, event, global);
  }

  /**
   * Method executes when the search bar is tapped.
   * */
  searchBarClicked(e: any) {
    this.showModal();
  }
  async showModal() {
    if (!!this.institutions) {
      let searchModal = this.modalCtrl.create(InstitutionSearch, {
        institutionName: this.institutionName
      });

      searchModal.onDidDismiss(institution => this.initializeProfiles(institution));

      return await searchModal.present();
    } else {
      await this.chargeDiscovery();
      this.showModal();
    }
  }

  /**
   * Method which clears the profile after selecting a new institution or clear the selected one.
   * This method updates the properties [profile]{@link #profile}, [profileName]{@link #profileName} and [selectedProfileId]{@link #selectedProfileId}
   */
  clearProfile(){
    this.profile = new ProfileModel();
    this.profileName = '';
    this.selectedProfileId = '';
  }

  /**
   * Method which manages the selection of a new profile for the already selected institution.
   * This method updates the properties [profile]{@link #profile}, and [profileName]{@link #profileName}.
   */
  selectProfile(){
    let selectedProfile = this.profiles.filter((item:any) => {
      return (item.id == this.selectedProfileId);
    });
    this.profile = selectedProfile[0];
    this.profileName = this.profile.name;
  }

  /**
   * Method which manages the selection of a new profile for the already selected institution.
   * This method updates the property [profiles]{@link #profiles}.
   * @param {any} institution the selected institution.
   */
  initializeProfiles(institution: any) {
    if (institution === null) {
      this.resetValues();
    } else {
      this.institutionName = institution.name;
      if (institution.profiles.length > 1 ) {
        // Check default profile and sort array for highlighting default profile
        institution.profiles.forEach((profile, index) => {
          if (!!profile.default) {
            institution.profiles.splice(index,1);
            this.defaultProfile = profile;
            institution.profiles.unshift(this.defaultProfile);
          }
        });
      } else {
        this.defaultProfile = institution.profiles[0];
      }
      this.profiles = institution.profiles;

      this.checkProfiles();
    }
  }

  /**
   * Method which checks the profiles in case there is a default one or if there is only one profile.
   * This method updates the properties [profile]{@link #profile}, [profileName]{@link #profileName},
   * [selectedProfileId]{@link #selectedProfileId} and [defaultProfile]{@link #defaultProfile},
   */
  checkProfiles(){
    switch(this.profiles.length) {
      case 0:
        this.resetValues();
        return;
      case 1:
        this.profile = this.profiles[0];
        this.profileName = this.profile.name;
        this.selectedProfileId = this.profile.id;
        this.defaultProfile = null;
        return;
      default:
        let filteredProfiles = this.profiles.filter((item:any) => {
          return (item.default == true);
        });

        this.defaultProfile = filteredProfiles[0];

        if (!!this.defaultProfile) {
          this.profile = this.defaultProfile;
          this.profileName = this.profile.name;
          this.selectedProfileId = this.profile.id;
        }
        return;
    }
  }
  navigateAndroid(e: Event) {
    setTimeout(async () => {
      await this.navigateTo(this.profile, e);
    }, 1200);
  }
  /**
   * Method which navigates to the following view.
   * If the selected profile is oauth, navigates to [OauthFlow]{OauthFlow}.
   * In other case, navigates to [ProfilePage]{ProfilePage} sending the selected [profile]{#profile}.
   */
  async navigateTo(profile:ProfileModel, e: Event) {
    e.preventDefault();
    if (!!this.activeNavigation) {
      this.showAll = false;
      if (!this.profile.redirect && !!profile.oauth) {
        await this.navCtrl.push(OauthFlow, {profile}, {animation: 'transition'});
      } else if (!this.profile.redirect && !profile.oauth) {
        if (await this.checkEap(profile)) {
          this.redirectToFlow();
        } else {
          const providerInfo = this.global.getProviderInfo();
          await this.notValidProfile(providerInfo);
        }
      } else {
        window.cordova.InAppBrowser.open(this.profile.redirect, '_system',"location=yes,clearsessioncache=no,clearcache=no,hidespinner=yes");
        !!this.global.isAndroid() ? App.exitApp() : this.showAll = true

      }

    } else{
     await this.alertConnectionDisabled();
    }
    this.resetValues();
  }

  async ngOnInit() {
   this.suscribeEvent()
    this.institutions = this.global.discovery;
  }

  async ionViewWillEnter() {
    this.loading.create();
    if (!this.global.discovery) {
      await this.chargeDiscovery();
    }
  }
  /**
   *  Lifecycle when entering a page, before it becomes the active one
   *  Load the discovery data and show the spinner
   */
  async ionViewDidEnter() {
    this.removeSpinner();
    this.showAll = true;

    // The instituteSearchBar is not loaded in this context, but when we set a timeout it will be when it fires.
    // Taken from https://angular.io/api/core/ViewChild
    setTimeout(() => {
      // According to the documentation, there should be a getInputElement() function,
      // but it doesn't exist. Maybe a newer version? Anyway, we need to set the readonly property on it,
      // and I found a handle that I can use, so I'll use that instead.
      // Documentation here: https://ionicframework.com/docs/api/searchbar
      const elem = this.instituteSearchBar?._searchbarInput?.nativeElement ?? {};

      // readOnly prevents the keyboard from showing up when the institute field is pressed,
      // which means we don't have to hide it, which speeds up loading of the discovery significantly.
      elem.readOnly = true;
    }, 0);
  }

  async getDiscovery() {
    const firstResponse = await this.getEduroamServices.discovery();
    this.institutions = await this.waitingSpinner(firstResponse);
  }

  resetValues() {
    this.ngZone.run(() => {
      delete this.profiles;
      this.profile = null;
      this.defaultProfile = null;
      this.selectedProfileId = null;
      this.profileName = null;
      this.institutionName = '';

    });
  }

  async checkEap(profile: ProfileModel) {
    return await this.getEduroamServices.eapValidation(profile);
  }

  /**
   * Method to check if provider info contains links
   * and show it on error page
   */
  checkUrlInfoProvide(providerInfo) {
    return !!providerInfo.helpdesk.webAddress ? providerInfo.helpdesk.webAddress :
        !!providerInfo.helpdesk.emailAddress ? providerInfo.helpdesk.emailAddress : '';
  }

  async notValidProfile(providerInfo) {
    if(!!providerInfo){
      let url = this.checkUrlInfoProvide(providerInfo);
      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-method'), true, url);
    } else {
      await this.errorHandler.handleError(this.dictionary.getTranslation('error', 'invalid-profile'), true, '');
    }
  }

  async chargeDiscovery() {
    await this.getDiscovery();
    this.global.setDiscovery(this.institutions)
  }

  /**
   *
   */
  redirectToFlow() {
    const authenticationMethod = this.global.getAuthenticationMethod();
    const eap = parseInt(authenticationMethod.eapMethod.type.toString());
    if (eap === 21 || eap === 25) {
      this.navCtrl.push(ProfilePage, '', {animation: 'transition'});
    } else {
      this.navCtrl.push(ConfigFilePage, '', {animation: 'transition'});
    }
  }

  suscribeEvent() {
    this.event.subscribe('connection',  () => {
      this.chargeDiscovery()
      if (!!this.global.isAndroid()) this.showToast(this.getString('text', 'institutions'));
    });
  }
}
