import { Injectable } from '@angular/core';
import { Loading, LoadingController } from 'ionic-angular';


@Injectable()
export class LoadingProvider {

  /**
   * Element loading spinner
   */
  loadingAttribute: Loading;

  constructor(public loadingCtrl: LoadingController) {}

  /**
   * Method to create loading spinner
   */
  create() {
    this.loadingAttribute = this.loadingCtrl.create({
      spinner: 'circles',
      showBackdrop: true,
      duration: 4000
    });
  }

  /**
   * Method to create and initialize loading spinner
   */
  createAndPresent(){
    this.create();
    this.present();
  }

  /**
   * Method to initialize loading spinner
   */
  present(){
    this.loadingAttribute.present();
  }

  /**
   * Method to remove loading spinner
   */
  dismiss(){
    this.loadingAttribute.dismiss();
  }

}
