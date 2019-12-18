import { Injectable } from '@angular/core';
import { LoadingController } from 'ionic-angular';


@Injectable()
export class LoadingProvider {

  constructor(public loadingCtrl: LoadingController) {}

  initLoading() {
    let loading = this.loadingCtrl.create({
      spinner: 'circles'
    });

    loading.present();

    setTimeout(() => {
      loading.dismiss();
    }, 1200);
  }
}
