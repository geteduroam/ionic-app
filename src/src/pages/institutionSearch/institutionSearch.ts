import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NavController, NavParams, Searchbar, ViewController } from 'ionic-angular';
import { Plugins } from '@capacitor/core';
const { Keyboard } = Plugins;

@Component({
  selector: 'page-institution-search',
  templateUrl: 'institutionSearch.html',
})
export class InstitutionSearch implements OnDestroy {
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

  @ViewChild('searchBar') searchBar: Searchbar;

  constructor(public navCtrl: NavController, public navParams: NavParams, private viewCtrl: ViewController,
              ) {

    this.instances = this.navParams.get('instances');
    this.instanceName = this.navParams.get('instanceName');
    this.filterInstances(this.instanceName);
  }

  /**
   * Method which manages the selection of a new institution.
   * This method updates the properties [instance]{@link #instance}, [instanceName]{@link #instanceName}
   * and [showInstanceItems]{@link #showInstanceItems}.
   * This method also calls the methods [initializeProfiles()]{@link #initializeProfiles} and [checkProfiles()]{@link #checkProfiles}.
   * @param {any} institution the selected institution.
   */
  async selectInstitution(institution: any) {
    this.instances = institution;

    await this.viewCtrl.dismiss(institution);
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

  filterInstances(stringAux: string){
    if (stringAux && stringAux.trim() != '') {

      this.filteredInstances = this.instances.filter((item:any) => {
        return (item.name.toLowerCase().indexOf(stringAux.toLowerCase()) > -1);
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

  ionViewDidEnter() {

    setTimeout(() => {
      this.searchBar.setFocus()
    }, 10);
  }

  ngOnDestroy() {
    Keyboard.hide();
  }
}
