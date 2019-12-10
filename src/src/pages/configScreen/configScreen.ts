import {Component, OnInit} from '@angular/core';
import {NavController, NavParams} from 'ionic-angular';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import { ProfilePage } from '../profile/profile';
import { Oauthflow } from '../oauthflow/oauthflow';

//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES

@Component({
  selector: 'page-welcome',
  templateUrl: 'configScreen.html',
})
export class ConfigurationScreen implements OnInit {
  profiles: any;
  filteredProfiles: any;
  instances: any;
  filteredInstances: any;

  instance: any;
  instanceName : any = '';
  profile: any;
  defaultProfile: any;
  profileName: any = '';
  selectedProfileId: any;

  showInstanceItems: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, private getEduroamServices: GeteduroamServices) {
  }

  //TODO remove parameter isInstance as it is no longer needed (no filtering by profile)
  getItems(ev: any) {
    const val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.filteredInstances = this.instances.filter((item:any) => {
        this.showInstanceItems= true;
        return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
      })
    } else { //val is empty
      this.clearInstance();
    }
  }

  getAllItems(){
    this.filteredInstances = this.instances;
    this.showInstanceItems= true;
  }

  clearProfile(){
    this.profile = '';
    this.profileName = '';
    this.selectedProfileId = '';
  }

  clearInstance(){
    this.showInstanceItems= false;
    this.instance = '';
    this.instanceName = '';
    this.filteredProfiles = '';
    this.defaultProfile = '';
    this.profiles = '';
    this.clearProfile();
    this.getAllItems();
  }

  selectInstitution(institution: any){
    this.instance = institution;
    this.instanceName = institution.name;
    this.showInstanceItems = false;
    this.initializeProfiles(institution);
    this.checkProfiles();
  }

  selectProfile(){
    let selectedProfile = this.profiles.filter((item:any) => {
      return (item.id == this.selectedProfileId);
    });
    this.profile = selectedProfile[0];
    this.profileName = this.profile.name;
    console.log('selected profile', this.profileName);
  }


  initializeProfiles(institution: any) {
    this.profiles = institution.profiles;
  }

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
    console.log('selected profile', this.profileName);
  }



  navigateTo(profile) {
    !!profile.oauth ? this.navCtrl.push(Oauthflow) : this.navCtrl.push(ProfilePage, {profile});

  }

  async ngOnInit() {
    const response = await this.getEduroamServices.discovery();
    this.instances = response.instances;
    //this.profiles = response.instances.profiles;

  }
}
