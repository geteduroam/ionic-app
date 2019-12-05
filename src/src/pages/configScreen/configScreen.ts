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
  nameInstitution: string = '';
  profile: any;
  recommend = false;
  recommendName = '';
  selectedProfile = '';
  profileName= '';

  constructor(public navCtrl: NavController, public navParams: NavParams, private geteduroamServices: GeteduroamServices) {
    //TODO: LOADING
  }

  toogleProfile() {
    this.nameInstitution = '';
    this.showProfile = false;
    this.show = false;
    this.profile = undefined;
    this.recommend = false;
    this.recommendName = '';

  }

  selectProfile($event) {
    let idProfile = $event;

    this.profiles.forEach((res: any) => {

      if (res.id === idProfile.toString()) {
        this.selectedProfile = res.name;
        this.profile = res;
      }
    });
    this.recommendProfile(this.profile)
  }

  selectInstitution($event) {
    this.nameInstitution = $event.textContent;
    this.show = false;

    this.instances.forEach((res: any) => {

      if (res.name.toString() === this.nameInstitution) {

        this.profiles = res.profiles;

        if (this.profiles.length > 1) {
          this.showProfile = true;

          this.profiles.forEach(res => {

            if (!!res.default) {
              this.recommend = true;
              this.profile = res;
              this.recommendName = res.name;
              this.selectProfile(this.profile.id);
            }
          });

        } else if (this.profiles.length === 1) {

          this.profile = this.profiles;
        }
      }
    })
  };

  recommendProfile(profile) {
    console.log('profile', profile);

      if (!!profile.default) {
        this.recommend = true;
        this.profile = profile;
        this.selectedProfile = profile.name;
        this.recommendName = profile.name;
        this.selectProfile(this.profile.id);
      }


  }

  changeInstitution(event) {
    this.toogleProfile();
    if (event.textContent === '') {
      this.show = false;
    }
    this.show = true;
  }

  navigateTo(profile) {
    !!profile.oauth ? this.navCtrl.push(Oauthflow) : this.navCtrl.push(ProfilePage, {profile});

  }

  async ngOnInit() {
    const response = await this.geteduroamServices.discovery();
    this.instances = response.instances;
    this.profiles = response.instances.profiles;

  }
}
