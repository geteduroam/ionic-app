import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import { WifiConfiguration } from '../wifiConfiguration/wifiConfiguration';

import { ProfilePage } from '../profile/profile';
import { Oauthflow } from '../oauthflow/oauthflow';
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES


@Component({
  selector: 'page-config-screen',
  templateUrl: 'configScreen.html',
})
export class ConfigurationScreen implements OnInit {

  profiles: any;
  instances: any;
  show = false;
  showProfile = false;
  stringSearch: string = '';
  profile: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private geteduroamServices: GeteduroamServices) {
    //TODO: LOADING
  }

  toogleProfile() {
    this.stringSearch = '';
    this.showProfile = false;
    this.show = false;
    this.profile = undefined;
  }

  selectProfile($event) {
    let idProfile = $event;

    this.profiles.forEach((res: any) => {

      if (res.id === idProfile.toString()) {
        this.profile = res;
      }
    })
  }

  selectInstitution($event) {
    this.stringSearch = $event.textContent;
    this.show = false;

    this.instances.forEach((res: any) => {

      if (res.name.toString() === this.stringSearch) {
        this.profiles = res.profiles;
        if (this.profiles.length > 1) {
          this.showProfile = true;
        }
      }
    })
  };

  changeInstitution(event) {
    if (event.textContent === '') {
      this.show = false;
    }
    this.show = true;
  }

  navigateTo(profile) {
    !!profile.oauth ? this.navCtrl.push(ProfilePage, {profile}) : this.navCtrl.push(Oauthflow) ;

  }

  async ngOnInit() {
    const response = await this.geteduroamServices.discovery();
    this.instances = response.instances;
    this.profiles = response.instances.profiles;

    if (this.profiles.length === 1) {
      this.profile = this.profiles;
    }
  }
}
