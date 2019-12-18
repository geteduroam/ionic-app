import { Component, EventEmitter, Output } from '@angular/core';
import { NavController, NavParams, Platform, ViewController } from 'ionic-angular';
import { ErrorHandlerProvider } from '../../providers/error-handler/error-handler';


@Component({
  selector: 'page-errors',
  templateUrl: 'errors.html',
})
export class ErrorsPage {

  text: string;
  link: string;
  public isFinal: boolean = false;

  constructor(private platform: Platform, public navParams: NavParams, public viewCtrl: ViewController, public navCtrl: NavController) {

    if (!!this.navParams.get('isFinal')) {

      this.link = this.navParams.get('link');
      this.text =  this.navParams.get('error');
      this.isFinal = true;

    } else {
      this.text = this.navParams.get('error');
      this.isFinal = false;
    }
  }

  async navigateTo() {
    //TODO: navigate to link
  }

  async exitApp() {
    if (!this.isFinal) {
      await this.viewCtrl.dismiss();

    } else {
      this.platform.exitApp();
    }

  }
}
