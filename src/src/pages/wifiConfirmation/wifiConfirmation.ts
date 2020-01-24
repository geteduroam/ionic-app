import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavParams, Platform } from 'ionic-angular';
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

  logoProvider: any;
  logo: boolean = false;

  converted_image: SafeResourceUrl;

  @ViewChild('imgLogo') imgLogo: ElementRef;

  constructor(private navParams: NavParams, private platform: Platform,
              protected loading: LoadingProvider, private sanitizer: DomSanitizer,
              protected dictionary:DictionaryServiceProvider, private global: GlobalProvider) {
    super(loading, dictionary);
  }

  ionViewWillEnter() {
    // TODO: EXIST LOGO ?
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
  async ngOnInit(){
    this.loading.createAndPresent();


    this.loading.dismiss();
    this.showAll = true;
  }
  // TODO: REMOVE THIS NAVIGATE, AFTER IMPLEMENTS NAVIGATION FROM PAGES
  exitApp() {
      this.platform.exitApp();
  }

}
