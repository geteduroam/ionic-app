import { Component, NgZone } from '@angular/core';
import {Events, NavParams, Platform, ViewController} from "ionic-angular";
import {Plugins} from "@capacitor/core";
import {ValidatorProvider} from "../../providers/validator/validator";
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {ErrorServiceProvider} from "../../providers/error-service/error-service";
const {Browser, Network } = Plugins;


@Component({
  selector: 'page-errors',
  templateUrl: 'errors.html',
})
export class ErrorsPage extends BasePage{

  /**
   * Error text
   */
  text: string;

  /**
   *  Link to external page
   */
  link: string;

  /**
   * Method check, enabled access network or
   * error when network is associated
   */
  checkMethod : string;

  enabledButton: boolean;

  /**
   * It checks if the error page have permission
   * to continue navigate or finish app
   */
  public isFinal: boolean = false;


  constructor(private platform: Platform, private navParams: NavParams, private viewCtrl: ViewController, private ngZone: NgZone,
              private validator: ValidatorProvider, protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
              protected event: Events, protected global: GlobalProvider, private errorService: ErrorServiceProvider) {
    super(loading, dictionary, event, global);

    this.checkConnection();

    if (!!this.navParams.get('isFinal')) {

      this.link = this.navParams.get('link');
      this.text =  this.navParams.get('error');
      this.isFinal = this.navParams.get('isFinal');

    } else {

      this.text = this.navParams.get('error');
      this.isFinal = false;
      this.checkMethod = this.navParams.get('method');
    }

    this.event.subscribe('connection', (data) => {
      this.ngZone.run(() => {
        this.enabledButton = data == 'connected';
      });

    });
  }

  /**
   * This method close app.
   * [ Only Android can closed app ]
   */
  async exitApp() {
    if (!this.isFinal || !this.platform.is('android')) {
      await this.viewCtrl.dismiss();

    } else {
      this.platform.exitApp();
    }
  }

  /**
   * This method close error page on modal screen.
   */
  async closeModal() {
    if (this.checkMethod === 'enableAccess' && !this.isFinal ||
        this.checkMethod === 'removeConnection' && !this.isFinal) {
      await this.viewCtrl.dismiss();
    } else if (await this.errorService.checkAgain(this.checkMethod, this.isFinal)) {
      await this.viewCtrl.dismiss();
    } else {
      this.showToast(this.text);
    }
  }

  /**
   * This method include link on button in error page
   */
  async clickKnowMore() {
    if(!this.emptyLink()){
      await Browser.open({'url': this.link});
    }
  }

  /**
   * This method include link on button in error page when link is a mail
   * When tapped button, it opens email page with a subject: Error
   */
  getEmail(): string {
    if(!!this.link && this.isLinkEmail()){
      return 'mailto:'+this.link+'Subject=Error';
    } else {
      return '';
    }
  }

  /**
   * This method fix button when not a linked
   */
  emptyLink(): boolean{
    return !!this.link || this.link.length == 0;
  }

  /**
   * This method validate email when has a link
   */
  isLinkEmail(): boolean {
    return this.validator.validateEmail(this.link);
  }

   async checkConnection(){
     let connect = await Network.getStatus();
     this.enabledButton = connect.connected;

  }
}
