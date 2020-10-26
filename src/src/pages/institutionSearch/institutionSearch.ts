import { Component, ViewChild } from '@angular/core';
import {Events, NavParams, Platform, Searchbar, ViewController} from 'ionic-angular';
import { Plugins } from '@capacitor/core';
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
const { Keyboard } = Plugins;

@Component({
  selector: 'page-institution-search',
  templateUrl: 'institutionSearch.html',
})
export class InstitutionSearch extends BasePage{

  /**
   * Institutions
   */
  instances: any;

  /**
   * Set of institutions filtered by what is written in the search-bar
   */
  filteredInstances: any;

  /**
   * Name of the selected profile
   */
  profileName: any = '';

  /**
   * Id of the selected profile
   */
  selectedProfileId: any;

  /**
   * Name of the selected institution used in the search-bar
   */
  instanceName : any = '';

  /**
   * Selected profile
   */
  profile: any;

  /**
   * Platform ios
   */
  ios: boolean = false;

  /**
   * Component SearchBar
   */
  @ViewChild('searchBar') searchBar: Searchbar;

  constructor(public navParams: NavParams, private viewCtrl: ViewController,
              private platform: Platform, protected loading: LoadingProvider,
              protected dictionary: DictionaryServiceProvider,
              protected event: Events, protected global: GlobalProvider) {
    super(loading, dictionary, event, global);
    Keyboard.removeAllListeners();
  }

  /**
   * Method which manages the selection of a new institution.
   * This method updates the properties [instance]{@link #instance}, [instanceName]{@link #instanceName}
   * and [showInstanceItems]{@link #showInstanceItems}.
   * This method also calls the methods [initializeProfiles()]{@link #initializeProfiles} and [checkProfiles()]{@link #checkProfiles}.
   * @param {any} institution the selected institution.
   */
  selectInstitution(institution: any) {
    this.instances = institution;
    this.searchBar.setFocus();
    this.viewCtrl.dismiss(institution);
  }

  /**
   * Method which filters the institutions by the string introduced in the search-bar.
   * The filter is not case sensitive.
   * This method updates the properties [showInstanceItems]{@link #showInstanceItems} and [filteredInstances]{@link #filteredInstances}
   * @param {any} ev event triggered.
   */
  getItems(ev: any) {
    const val = ev.target.value;

    this.filterInstances(val);
  }

  /**
   * Method to filter institutions
   * @param stringAux Searched on search bar
   */
  filterInstances(stringAux: string){
    if (stringAux && stringAux.trim() != '') {
      this.filteredInstances = this.instances.filter((item:any) => {
        return (item.toLowerCase().indexOf(stringAux.toLowerCase()) > -1);
      })
    } else {
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

  }

  /**
   * Method which clears the instance after pressing X in the search-bar.
   * This method updates the properties [showInstanceItems]{@link #showInstanceItems}, [instance]{@link #instance},
   * [instanceName]{@link #instanceName}, [defaultProfile]{@link #defaultProfile} and [profiles]{@link #profiles}.
   * This method also calls the methods [clearProfile()]{@link #clearProfile} and [getAllItems()]{@link #getAllItems}
   */
  clearInstance(){
    this.clearProfile();
    this.getAllItems();
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

  ngOnInit() {
    this.instances = Object.values(this.global.getInstitutionNames());
    this.filteredInstances = Object.values(this.instances);
  }
  /**
   * Lifecycle when entering a page, after it becomes the active page.
   *  this sets focus on search bar
   */
  ionViewWillEnter() {
    this.ios = !!this.platform.is('ios');
    this.instanceName = this.navParams.get('instanceName');

  }
  ionViewDidEnter() {
    setTimeout(() => {
      this.searchBar.setFocus()
    }, 10);
    if (!this.ios) {
      Keyboard.show();
    }
  }

  /**
   * Lifecycle when you leave a page,
   * before it stops being the active one
   */
  ionViewWillLeave() {
    Keyboard.hide();
  }

}
