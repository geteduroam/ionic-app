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
      duration: 5000
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



  // initLoading() {
  //   let loading = this.loadingCtrl.create({
  //     spinner: 'circles',
  //     dismissOnPageChange: true
  //   });
  //
  //   loading.present();
  //
  //   setTimeout(() => {
  //     loading.dismiss();
  //   }, 5000);
  // }

}
