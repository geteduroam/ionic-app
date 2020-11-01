import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {Events, NavParams, Platform, ViewController} from 'ionic-angular';
import { LoadingProvider } from '../../providers/loading/loading';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {BasePage} from "../basePage";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";


@Component({
  selector: 'page-wifi-confirm',
  templateUrl: 'wifiConfirmation.html',
})
export class WifiConfirmation extends BasePage implements OnInit {

  showAll: boolean = false;

  /**
   * It checks if provider has a logo
   */
  logoProvider: any;

  /**
   * It checks if provider has a logo
   */
  logo: boolean = false;

  /**
   * DOM Sanitizer
   */
  converted_image: SafeResourceUrl;

  /**
   * Element to include logo
   */
  @ViewChild('imgLogo') imgLogo: ElementRef;

  constructor(private navParams: NavParams, private platform: Platform,
              protected loading: LoadingProvider, private sanitizer: DomSanitizer,
              protected dictionary:DictionaryServiceProvider, protected global: GlobalProvider,
              protected event: Events, private viewCtrl: ViewController) {
    super(loading, dictionary, event, global);
  }


  isAndroid() {
    return this.platform.is('android');
  }

  exitApp() {
      this.platform.exitApp();
  }

  /**
   *  Lifecycle when it is active
   */
  async ngOnInit(){
    this.loading?.dismiss();
    this.showAll = true;
  }

  /**
   *  Lifecycle when entering a page, before it becomes the active one
   *
   */
  ionViewWillEnter() {

    this.logoProvider = this.navParams.get('logo');

    if (!!this.logoProvider) {
      this.logo = true;
      let imageData = this.logoProvider._;
      let mimeType = this.logoProvider.$.mime;
      let encoding = this.logoProvider.$.encoding;

      const data = `data:${mimeType};${encoding},${imageData}`;

      this.converted_image = this.sanitizer.bypassSecurityTrustResourceUrl(data);

    } else {
      // Image default
      this.converted_image = this.sanitizer.bypassSecurityTrustResourceUrl("../../assets/icon/ios_thumbs_up.png");
    }

  }

  async backToConfig() {
    await this.statusConnection();
    if (!!this.activeNavigation) {
      document.getElementById('btn-back').style.opacity = '0';
      document.getElementById('dismissable-back').style.opacity = '0';
      await this.viewCtrl.dismiss()
    } else {
      await this.alertConnectionDisabled();
    }
  }
}
