import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { GeteduroamApp } from './app.component';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { PagesModule } from '../pages/pages.module';
import { GeteduroamServices } from '../providers/geteduroam-services/geteduroam-services';

@NgModule({
  declarations: [
    GeteduroamApp
  ],
  imports: [
    BrowserModule,
    PagesModule,
    IonicModule.forRoot(GeteduroamApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    GeteduroamApp
  ],
  providers: [
    AndroidPermissions,
    StatusBar,
    SplashScreen,
    InAppBrowser,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    GeteduroamServices,
    ScreenOrientation
  ]
})
export class AppModule {

}
