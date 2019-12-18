import { ErrorHandler, Injectable } from '@angular/core';
import { ModalController } from 'ionic-angular';
import { ErrorsPage } from '../../pages/errors/errors';


@Injectable()
export class ErrorHandlerProvider extends ErrorHandler {
  showModal: boolean = false;

  constructor(public modalCtrl: ModalController ) {
    super();

  }

  async handleError(error) {

    if (!this.showModal) {
      let errorModal = this.modalCtrl.create(ErrorsPage, {error: error});

      this.showModal = true;

      errorModal.onDidDismiss(res => {
        this.showModal = false;
      });

      return await errorModal.present();
    }

  }
}
