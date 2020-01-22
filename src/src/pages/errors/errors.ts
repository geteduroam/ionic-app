import { Component } from '@angular/core';
import {NavController, NavParams, Platform, ViewController} from "ionic-angular";
import {Plugins} from "@capacitor/core";
import {ValidatorProvider} from "../../providers/validator/validator";
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {GlobalProvider} from "../../providers/global/global";
import {ErrorHandlerProvider} from "../../providers/error-handler/error-handler";
import {DictionaryService} from "../../providers/dictionary-service/dictionary-service";
const {Browser} = Plugins;


@Component({
  selector: 'page-errors',
  templateUrl: 'errors.html',
})
export class ErrorsPage extends BasePage{

  text: string;
  link: string;
  public isFinal: boolean = false;


  constructor(private platform: Platform, protected navParams: NavParams, public viewCtrl: ViewController, protected navCtrl: NavController,
              private validator: ValidatorProvider, protected loading: LoadingProvider, protected global: GlobalProvider, protected errorHandler: ErrorHandlerProvider, protected dictionary: DictionaryService) {
    super(navCtrl, navParams, loading, errorHandler, global, dictionary);

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
