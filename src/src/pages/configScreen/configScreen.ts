import { Component } from '@angular/core';
import {Events, ModalController, NavController} from 'ionic-angular';
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
const { Keyboard } = Plugins;

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
  instances: Object[];

  /**
   * Set of institutions filtered by what is written in the search-bar
   */
  filteredInstances: Object[];

  /**
   * Selected institution
   */
  instance: Object;

  /**
   * Name of the selected institution used in the search-bar
   */
  instanceName: string = '';

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
  showInstanceItems: boolean = false;

  /**
   * Property to show button
   */
  showButton: boolean = true;


  /**
   * Constructor
   * */
  constructor(private navCtrl: NavController, private getEduroamServices: GeteduroamServices,
              protected loading: LoadingProvider, protected modalCtrl: ModalController, protected dictionary: DictionaryServiceProvider,
              protected event: Events, protected global: GlobalProvider) {
    super(loading, dictionary, event, global);
  }

  /**
   * Method executes when the search bar is tapped.
   * */
  async showModal() {
    await Keyboard.hide();
    let searchModal = this.modalCtrl.create(InstitutionSearch, {
      instances: this.instances,
      instanceName: this.instanceName}
      );

    searchModal.onDidDismiss((data) => {

        if (data !== undefined) {
          this.instance = data;
          this.instanceName = data.name;

          this.initializeProfiles(this.instance);

        }
      });

      return await searchModal.present();
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

  /**
   * Method which checks the profiles in case there is a default one or if there is only one profile.
   * This method updates the properties [profile]{@link #profile}, [profileName]{@link #profileName},
   * [selectedProfileId]{@link #selectedProfileId} and [defaultProfile]{@link #defaultProfile},
   */
  checkProfiles(){
    if (this.profiles.length === 1) {
      this.profile = this.profiles[0];
      this.profileName = this.profile.name;
      this.selectedProfileId = this.profile.id;
      this.defaultProfile = null;
    } else {
      let filteredProfiles = this.profiles.filter((item:any) => {
        return (item.default == true);
      });

      this.defaultProfile = filteredProfiles[0];

      if (!!this.defaultProfile) {
        this.profile = this.defaultProfile;
        this.profileName = this.profile.name;
        this.selectedProfileId = this.profile.id;
      }
    }
  }

  /**
   * Method which navigates to the following view.
   * If the selected profile is oauth, navigates to [OauthFlow]{OauthFlow}.
   * In other case, navigates to [ProfilePage]{ProfilePage} sending the selected [profile]{#profile}.
   */
  async navigateTo(profile:ProfileModel) {
    if (!!this.activeNavigation) {
      this.showAll = false;

      let destinationPage = !!profile.oauth ? OauthFlow : ProfilePage;
      await this.navCtrl.push(destinationPage, {profile}, {animation: 'transition'});

    } else{
      await this.alertConnectionDisabled();
    }
  }

  /**
   *  Lifecycle when entering a page, before it becomes the active one
   *  Load the discovery data and show the spinner
   */
  async ionViewWillEnter() {
      const firstResponse = this.getEduroamServices.discovery();
      const secondResponse = await this.waitingSpinner(firstResponse);
      this.instances = secondResponse.instances;
      this.removeSpinner();
      this.showAll = true;
  }
}
