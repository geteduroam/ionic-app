import { ErrorHandler, Injectable } from '@angular/core';
import {ModalController, NavController} from 'ionic-angular';
import { ErrorsPage } from '../../pages/errors/errors';


@Injectable()
export class ErrorHandlerProvider extends ErrorHandler {
  showModal: boolean = false;

  constructor(public modalCtrl: ModalController) {
    super();

  }

  /**
   * Method to handler error
   * @param errorText: String error message
   * @param isFinal: Boolean (Optional)
   * @param helpDeskUrl: String url to link (Optional)
   * @param method: String (Optional)
   * @param showModal: Boolean (Optional)
   *
   */
  async handleError(errorText: string, isFinal?:boolean, helpDeskUrl?:string, method?:string, showModal?: boolean) {

    let localFinal: boolean = !!isFinal ? isFinal : false;
    let localUrl:string = !!helpDeskUrl ? helpDeskUrl : '';
    let localMethod:string = !!method ? method : '';

    let errorModal = this.modalCtrl.create(ErrorsPage, {error: errorText, isFinal: localFinal, link: localUrl, method: localMethod});

    if (!!showModal) {
      this.showModal = !showModal;
    }

    if (!this.showModal) {
      this.showModal = true;

      return await errorModal.present();
    }

    errorModal.onDidDismiss(res => {
      this.showModal = false;
    });
  }
}
