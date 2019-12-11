import { NgModule, ErrorHandler } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { IonicApp, IonicModule, IonicErrorHandler, Platform } from 'ionic-angular';
import { MyApp } from './app.component';
import { ScreenOrientation } from '@ionic-native/screen-orientation/ngx';

import { StatusBar } from '@ionic-native/status-bar/ngx';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { InAppBrowser } from '@ionic-native/in-app-browser/ngx';
import { PagesModule } from '../pages/pages.module';
import { LetswifiProvider } from '../providers/letswifi/letswifi';

@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    BrowserModule,
    PagesModule,
    IonicModule.forRoot(MyApp),
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
  ],
  providers: [
    AndroidPermissions,
    StatusBar,
    SplashScreen,
    InAppBrowser,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    LetswifiProvider,
    ScreenOrientation
  ]
})
export class AppModule {
}
