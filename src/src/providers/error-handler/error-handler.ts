import { ErrorHandler, Injectable } from '@angular/core';
import {ModalController, NavController} from 'ionic-angular';
import { ErrorsPage } from '../../pages/errors/errors';
import {ConfigurationScreen} from "../../pages/configScreen/configScreen";


@Injectable()
export class ErrorHandlerProvider extends ErrorHandler {
  showModal: boolean = false;

  constructor(public modalCtrl: ModalController) {
    super();

  }

  async handleError(errorText: string, isFinal?:boolean, helpDeskUrl?:string) {

    let localFinal: boolean = !!isFinal? isFinal : false;
    let localUrl:string = !!helpDeskUrl? helpDeskUrl : '';

    if (!this.showModal) {
      let errorModal = this.modalCtrl.create(ErrorsPage, {error: errorText, isFinal: localFinal, link: localUrl});
      this.showModal = true;

      errorModal.onDidDismiss(res => {
        this.showModal = false;
      });

      return await errorModal.present();
    }

  }
}
