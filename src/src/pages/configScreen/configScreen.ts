import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
//TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES


@Component({
  selector: 'page-welcome',
  templateUrl: 'configScreen.html',
})
export class ConfigurationScreen {

  profiles: any;
  instances: any;

  constructor(public navCtrl: NavController, public navParams: NavParams, private geteduroamServices: GeteduroamServices) {

  }

  async ionViewDidLoad() {

    const response = await this.geteduroamServices.discovery();

    this.instances = response.instances;

    this.profiles = response.instances.profiles;
    console.log('response', this.profiles);
  }
}
