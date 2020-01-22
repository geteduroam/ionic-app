import { Component } from '@angular/core';
import {NavController, NavParams, Platform, ViewController} from "ionic-angular";
import {Plugins} from "@capacitor/core";
import {ValidatorProvider} from "../../providers/validator/validator";
const {Browser} = Plugins;


@Component({
  selector: 'page-errors',
  templateUrl: 'errors.html',
})
export class ErrorsPage {

  text: string;
  link: string;
  public isFinal: boolean = false;


  constructor(private platform: Platform, public navParams: NavParams, public viewCtrl: ViewController, public navCtrl: NavController, private validator: ValidatorProvider) {

    if (!!this.navParams.get('isFinal')) {

      this.link = this.navParams.get('link');
      this.text =  this.navParams.get('error');
      this.isFinal = true;

    } else {
      this.text = this.navParams.get('error');
      this.isFinal = false;
    }

  }


  async exitApp() {
    if (!this.isFinal) {
      await this.viewCtrl.dismiss();

    } else {
      this.platform.exitApp();
    }

  }

  async closeModal() {
    await this.viewCtrl.dismiss();
  }

  async clickKnowMore() {
    if(!!this.link){
      await Browser.open({'url': this.link});
    }

  }

  getEmail(): string {
    if(!!this.link && this.isLinkEmail()){
      return 'mailto:'+this.link+'Subject=Error';
    } else {
      return '';
    }
  }

  isLinkEmail(): boolean {
    return this.validator.validateEmail(this.link);
  }
}
