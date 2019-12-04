import { Component, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
import { WifiConfiguration } from '../wifiConfiguration/wifiConfiguration';
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

  constructor(public navCtrl: NavController, public navParams: NavParams, private geteduroamServices: GeteduroamServices) {
    //TODO: LOADING

  }

  toogleProfile() {
    this.stringSearch = '';
    this.showProfile = false;
    this.show = false;
  }

  selectProfile($event) {
    console.log('select Profile', $event);
  }

  selectInstitution($event) {
    this.stringSearch = $event.textContent;
    this.show = false;

    this.instances.forEach((res: any) => {

      if (res.name.toString() === this.stringSearch) {
        this.profiles = res.profiles;
        this.showProfile = true;

      }
    })
  };

  changeInstitution(event) {
    console.log('changeInstitution', event)
    if (event.textContent === '') {
      this.show = false;
    }
    this.show = true;
  }

  navigateTo() {
    this.navCtrl.push(WifiConfiguration)
  }

  async ngOnInit() {
    const response = await this.geteduroamServices.discovery();
    this.instances = response.instances;
    this.profiles = response.instances.profiles;
  }
}
