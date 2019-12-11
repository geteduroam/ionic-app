import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { GeteduroamServices } from '../../providers/geteduroam-services/geteduroam-services';


@Component({
  selector: 'page-auth',
  templateUrl: 'auth.html',
})
export class AuthPage {

  constructor(public navCtrl: NavController, public navParams: NavParams, private provider: GeteduroamServices) {

  }
}
