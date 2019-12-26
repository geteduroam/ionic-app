import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';


@Injectable()
export class LoadingProvider {

  loadingAttribute;

  constructor(public loadingCtrl: LoadingController) {}

  create(){
    this.loadingAttribute = this.loadingCtrl.create({
      spinner: 'circles',
      showBackdrop: false,
      duration: 1500
    });
  }

  createAndPresent(){
    this.create();
    this.present();
  }

  present(){
    this.loadingAttribute.present();
  }

  dismiss(){
    this.loadingAttribute.dismiss();
  }

}
