import { ErrorHandler, Injectable } from '@angular/core';
import {ModalController, NavController} from 'ionic-angular';
import { ErrorsPage } from '../../pages/errors/errors';


@Injectable()
export class ErrorHandlerProvider extends ErrorHandler {
  showModal: boolean = false;

  constructor(public modalCtrl: ModalController) {
    super();

  }

  async handleError(errorText: string, isFinal?:boolean, helpDeskUrl?:string, method?:string) {

  //  errorText = errorText.includes('associated') ? errorText + ".\nPlease delete the eduroam network stored in 'Saved networks'" : errorText;


    // let localNavigation: boolean = navigation == undefined ? true : navigation;
    let localFinal: boolean = !!isFinal ? isFinal : false;
    let localUrl:string = !!helpDeskUrl ? helpDeskUrl : '';
    let localMethod:string = !!method ? method : '';
    let errorModal = this.modalCtrl.create(ErrorsPage, {error: errorText, isFinal: localFinal, link: localUrl, method: localMethod});
    if ( !this.showModal ) {
      this.showModal = true;

      return await errorModal.present();
    }

    errorModal.onDidDismiss(res => {
      this.showModal = false;
    });
  }
}
