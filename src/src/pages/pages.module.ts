import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { WelcomePage } from './welcome/welcome';

import { ErrorsPage } from './errors/errors';

import { ConfigurationScreen } from "./configScreen/configScreen";
import { WifiConfiguration} from "./wifiConfiguration/wifiConfiguration";
import { WifiConfirmation} from "./wifiConfirmation/wifiConfirmation";
import { FormsModule } from '@angular/forms';
import { ProfilePage } from './profile/profile';
import { OauthFlow } from './oauthFlow/oauthFlow';

const Pages = [
  WelcomePage,
  ErrorsPage,
  ProfilePage,
  OauthFlow,
  ConfigurationScreen,
  WifiConfiguration,
  WifiConfirmation
];

@NgModule({
  declarations: [
    Pages,
  ],
  imports: [
    IonicPageModule.forChild(Pages),
  ],
  providers: [
    FormsModule
  ]
})
export class PagesModule {}
