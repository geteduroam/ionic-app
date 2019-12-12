import {Component, OnInit} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import { ProfilePage } from '../profile/profile';
import { OauthFlow } from '../oauthFlow/oauthFlow';

@Component({
  selector: 'page-config-screen',
  templateUrl: 'configScreen.html',
})
export class ConfigurationScreen implements OnInit {
  /**
   * Set of available profiles
   */
  profiles: any;

  /**
   * All the institutions retrieved by the service [GeteduroamServices]{@link ../injectables/GeteduroamServices.html}
   */
  instances: any;

  /**
   * Set of institutions filtered by what is written in the search-bar
   */
  filteredInstances: any;

  /**
   * Selected institution
   */
  instance: any;

  /**
   * Name of the selected institution used in the search-bar
   */
  instanceName : any = '';

  /**
   * Selected profile
   */
  profile: any;

  /**
   * Default profile (if exists) in the selected institution profiles set
   */
  defaultProfile: any;

  /**
   * Name of the selected profile
   */
  profileName: any = '';

  /**
   * Id of the selected profile
   */
  selectedProfileId: any;

  /**
   * Property to decide whether or not to show the institutions list
   */
  showInstanceItems: boolean = false;

  /**
   * Constructor
   * */
  constructor(public navCtrl: NavController, public navParams: NavParams, private getEduroamServices: GeteduroamServices) {
  }

  /**
   * Method which filters the institutions by the string introduced in the search-bar.
   * The filter is not case sensitive.
   * This method updates the properties [showInstanceItems]{@link #showInstanceItems} and [filteredInstances]{@link #filteredInstances}
   * @param {any} ev event triggered.
   */
  getItems(ev: any) {
    const val = ev.target.value;

    if (val && val.trim() != '') {
      this.filteredInstances = this.instances.filter((item:any) => {
        this.showInstanceItems= true;
        return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    } else { //val is empty
      this.clearInstance();
    }
  }

  /**
   * Method which gets all the institutions.
   * Used after cleaning or first click on the search-bar.
   * This method updates the properties [showInstanceItems]{@link #showInstanceItems} and [filteredInstances]{@link #filteredInstances}
   */
  getAllItems(){
    this.filteredInstances = this.instances;
    this.showInstanceItems= true;
  }

  /**
   * Method which clears the profile after selecting a new institution or clear the selected one.
   * This method updates the properties [profile]{@link #profile}, [profileName]{@link #profileName} and [selectedProfileId]{@link #selectedProfileId}
   */
  clearProfile(){
    this.profile = '';
    this.profileName = '';
    this.selectedProfileId = '';
  }

  /**
   * Method which clears the instance after pressing X in the search-bar.
   * This method updates the properties [showInstanceItems]{@link #showInstanceItems}, [instance]{@link #instance},
   * [instanceName]{@link #instanceName}, [defaultProfile]{@link #defaultProfile} and [profiles]{@link #profiles}.
   * This method also calls the methods [clearProfile()]{@link #clearProfile} and [getAllItems()]{@link #getAllItems}
   */
  clearInstance(){
    this.showInstanceItems= false;
    this.instance = '';
    this.instanceName = '';
    this.defaultProfile = '';
    this.profiles = '';
    this.clearProfile();
    this.getAllItems();
  }

  /**
   * Method which manages the selection of a new institution.
   * This method updates the properties [instance]{@link #instance}, [instanceName]{@link #instanceName}
   * and [showInstanceItems]{@link #showInstanceItems}.
   * This method also calls the methods [initializeProfiles()]{@link #initializeProfiles} and [checkProfiles()]{@link #checkProfiles}.
   * @param {any} institution the selected institution.
   */
  selectInstitution(institution: any){
    this.instance = institution;
    this.instanceName = institution.name;
    this.showInstanceItems = false;
    this.initializeProfiles(institution);
    this.checkProfiles();
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
    this.profiles = institution.profiles;
  }

  /**
   * Method which checks the profiles in case there is a default one or if there is only one profile.
   * This method updates the properties [profile]{@link #profile}, [profileName]{@link #profileName},
   * [selectedProfileId]{@link #selectedProfileId} and [defaultProfile]{@link #defaultProfile},
   */
  checkProfiles(){
    if(this.profiles.length === 1){
      this.profile = this.profiles[0];
      this.profileName = this.profile.name;
      this.selectedProfileId = this.profile.id;
      this.defaultProfile = '';
    } else {
      let filteredProfiles = this.profiles.filter((item:any) => {
        return (item.default == true);
      });
      this.defaultProfile = filteredProfiles[0];
      if(!!this.defaultProfile){
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
  navigateTo(profile) {
    !!profile.oauth ? this.navCtrl.push(OauthFlow) : this.navCtrl.push(ProfilePage, {profile});

  }

  /**
   * Method executed when the class is initialized.
   * This method updates the property [instances]{@link #instances} by making use of the service [GeteduroamServices]{@link ../injectables/GeteduroamServices.html}.
   */
  async ngOnInit() {
    const response = await this.getEduroamServices.discovery();
    this.instances = response.instances;
  }
}
