import { ErrorHandler, Injectable } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { ErrorsPage } from '../../pages/errors/errors';

@Injectable()
export class ErrorHandlerProvider extends ErrorHandler {

  constructor(public modalCtrl: ModalController) {
    super();
  }

  async handleError(error) {
    let errorModal = this.modalCtrl.create(ErrorsPage, {error: error});
    return await errorModal.present();
  }

}
