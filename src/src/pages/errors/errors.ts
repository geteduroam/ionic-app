import { Component } from '@angular/core';
import {Events, NavParams, Platform, ViewController} from "ionic-angular";
import {Plugins} from "@capacitor/core";
import {ValidatorProvider} from "../../providers/validator/validator";
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
const {Browser} = Plugins;


@Component({
  selector: 'page-errors',
  templateUrl: 'errors.html',
})
export class ErrorsPage extends BasePage{

  text: string;
  link: string;
  public isFinal: boolean = false;


  constructor(private platform: Platform, private navParams: NavParams, private viewCtrl: ViewController,
              private validator: ValidatorProvider, protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
              protected event: Events) {
    super(loading, dictionary, event);


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
    if(!this.emptyLink()){
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

  emptyLink(): boolean{
    return !!this.link || this.link.length == 0;
  }

  isLinkEmail(): boolean {
    return this.validator.validateEmail(this.link);
  }
}
