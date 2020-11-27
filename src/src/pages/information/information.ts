import { Component } from '@angular/core';
import {Events, IonicPage, NavController, NavParams, ViewController} from 'ionic-angular';
import {InformationNetwork} from "../../shared/entities/information";
import {BasePage} from "../basePage";
import {LoadingProvider} from "../../providers/loading/loading";
import {DictionaryServiceProvider} from "../../providers/dictionary-service/dictionary-service-provider.service";
import {GlobalProvider} from "../../providers/global/global";
import {GeteduroamServices} from "../../providers/geteduroam-services/geteduroam-services";

/**
 * Generated class for the InformationPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@Component({
  selector: 'page-information',
  templateUrl: 'information.html',
})
export class InformationPage extends BasePage{

  informationNetwork: InformationNetwork;

  showTechnicalInformation: boolean = false;

  showAll: boolean = false;

  constructor(public navCtrl: NavController, public navParams: NavParams, private viewCtrl: ViewController,
              protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
              protected event: Events, protected global: GlobalProvider) {
    super(loading, dictionary, event, global);
  }

  ionViewDidEnter() {
    this.informationNetwork = this.navParams.get('informationNetwork');
    this.showAll = true;
  }

  close() {
    this.viewCtrl.dismiss();
  }

}
