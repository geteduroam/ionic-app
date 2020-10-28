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
  instances: any[];

  /**
   * Set of institutions filtered by what is written in the search-bar
   */
  filteredInstances: any[];

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
  @ViewChild('instituteSearchBar') instituteSearchBar: Searchbar;

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
  selectInstitution(institution) {
    this.instanceName = institution.name;
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

  abbr(s: string[]) {
    return s.map(s => s.substring(0,1)).filter(s => s.match(/\p{General_Category=Letter}/gu)).join('');
  }

  /**
   * Method to filter institutions
   * @param stringAux Searched on search bar
   */
  filterInstances(stringAux: string){
    if (stringAux) {
      const s = stringAux.toLowerCase();
      const terms = s.split(' ');
      this.filteredInstances = this.instances;
      this.filteredInstances = this.filteredInstances.filter((item:any) => {
        return item.abbr1 === s || item.abbr2 === s
          || terms.reduce((found, term) => found || item.terms.includes(term), false)
          || (stringAux.length > 2 && item.search.indexOf(s.toLowerCase()) != -1);
      });
      this.filteredInstances.sort((a, b) => {
        let modifier = 0;
        for(let i = 1; i < s.length; i++) {
          if (a.search.substring(0, i) === s.substring(0,i)) modifier-=2;
          if (a.abbr1.substring(0, i) === s.substring(0,i)) modifier-=1;
          if (a.abbr2.substring(0, i) === s.substring(0,i)) modifier-=1;
          if (b.search.substring(0, i) === s.substring(0,i)) modifier+=2;
          if (b.abbr1.substring(0, i) === s.substring(0,i)) modifier+=1;
          if (b.abbr2.substring(0, i) === s.substring(0,i)) modifier+=1;
        }
        if (terms.reduce((found, term) => found || a.terms.includes(term), false)) modifier-=s.length*2;
        if (terms.reduce((found, term) => found || b.terms.includes(term), false)) modifier+=s.length*2;
        return a.name.localeCompare(b.name) + modifier;
      });
    } else {
      this.filteredInstances = [];
    }
  }

  /**
   * Method which clears the instance after pressing X in the search-bar.
   * This method updates the properties [showInstanceItems]{@link #showInstanceItems}, [instance]{@link #instance},
   * [instanceName]{@link #instanceName}, [defaultProfile]{@link #defaultProfile} and [profiles]{@link #profiles}.
   */
  clearInstance(){
    this.clearProfile();
    this.instanceName = '';
    this.filteredInstances = [];
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
    this.instances = this.global.getDiscovery().map((item:any) => {
        if (!('abbr1' in item)) item.abbr1 = this.abbr(item.name.split(" ")).toLowerCase();
        if (!('abbr2' in item)) item.abbr2 = this.abbr(item.name.split(/\/-_ /)).toLowerCase();
        if (!('search' in item)) item.search = [item.name, item.abbr].join(' ').toLowerCase();
        if (!('terms' in item)) item.terms = item.name.toLowerCase().split(' ');
        return item;
      });
    this.clearInstance();
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
    // The instituteSearchBar is not loaded in this context, but when we set a timeout it will be when it fires.
    // Taken from https://angular.io/api/core/ViewChild
    setTimeout(() => {
      this.instituteSearchBar.setFocus()
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
