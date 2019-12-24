import { ErrorHandler, Injectable } from '@angular/core';
import {ModalController, NavController} from 'ionic-angular';
import { ErrorsPage } from '../../pages/errors/errors';


@Injectable()
export class ErrorHandlerProvider extends ErrorHandler {
  showModal: boolean = false;

  constructor(public modalCtrl: ModalController) {
    super();

  }

  async handleError(errorText: string, isFinal?:boolean, helpDeskUrl?:string) {

    let localFinal: boolean = !!isFinal ? isFinal : false;
    let localUrl:string = !!helpDeskUrl ? helpDeskUrl : '';
    let errorModal = this.modalCtrl.create(ErrorsPage, {error: errorText, isFinal: localFinal, link: localUrl});

    if ( !this.showModal ) {
      this.showModal = true;

      return await errorModal.present();
    }

    errorModal.onDidDismiss(res => {
      console.log('onDidDismiss modal: ', res);
      this.showModal = false;
    });
  }
}
