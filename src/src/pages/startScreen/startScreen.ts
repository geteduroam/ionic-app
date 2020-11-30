import { Component } from '@angular/core';
import {Events, IonicPage, ModalController, NavController, NavParams} from 'ionic-angular';
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {InformationNetwork} from "../../shared/entities/information";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";
import {ConfigurationScreen} from "../configScreen/configScreen";
import {ActionSheetOptionStyle, Plugins} from "@capacitor/core";
import {InstitutionSearch} from "../institutionSearch/institutionSearch";
import {InformationPage} from "../information/information";
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";
const {Modals} = Plugins;

/**
 * Generated class for the StartScreenPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-start-screen',
  templateUrl: 'startScreen.html',
})
export class StartScreenPage extends BasePage{

  showAll: boolean = false;
  informationNetwork: InformationNetwork;
  logo: boolean = false;
  converted_image: SafeResourceUrl;
  helpDesk: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, protected loading: LoadingProvider,
              protected dictionary: DictionaryServiceProvider, protected event: Events, protected global: GlobalProvider,
              private sanitizer: DomSanitizer, private modalCtrl: ModalController, private getEduroamServices: GeteduroamServices) {
    super(loading, dictionary, event, global);
  }

  ionViewDidEnter() {
    this.informationNetwork = this.global.getInformationNetwork();
    this.getLogo();
    this.checkHelpDesk();
    this.showAll = true;
  }

  getLogo() {
    if (this.informationNetwork.logo) {
      this.converted_image = this.sanitizer.bypassSecurityTrustResourceUrl(this.informationNetwork.logo);
      this.logo = true;
    }
  }

  async reconfigure() {
    await this.navCtrl.push(ConfigurationScreen, {}, {animation: 'transition'});
  }

  checkHelpDesk() {
    if (this.global.getProviderInfo().helpdesk.webAddress ||
        this.global.getProviderInfo().helpdesk.emailAddress ||
        this.global.getProviderInfo().helpdesk.phone) {
      this.helpDesk = true;
    }
  }

  async showInformation() {
    let searchModal = this.modalCtrl.create(InformationPage, {
      informationNetwork: this.informationNetwork,
      showAll: false
    });

    return await searchModal.present();
  }

  async removeNetwork() {
    if (this.global.isAndroid()) {
      await this.getEduroamServices.removeNetwork({ssid: this.informationNetwork.ssid});
    } else {
      await this.getEduroamServices.removeNetwork({ssid: [this.informationNetwork.ssid], domain: null});
    }
    await this.navCtrl.push(ConfigurationScreen, {}, {animation: 'transition'});
  }

}
