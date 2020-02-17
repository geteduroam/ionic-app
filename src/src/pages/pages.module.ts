import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ReconfigurePage } from './welcome/reconfigure';
import { ErrorsPage } from './errors/errors';
import { ConfigurationScreen } from "./configScreen/configScreen";
import { WifiConfirmation} from "./wifiConfirmation/wifiConfirmation";
import { FormsModule } from '@angular/forms';
import { ProfilePage } from './profile/profile';
import { OauthFlow } from './oauthFlow/oauthFlow';
import { ErrorHandlerProvider } from '../providers/error-handler/error-handler';
import { InstitutionSearch } from './institutionSearch/institutionSearch';
import { ValidatorProvider } from '../providers/validator/validator';
import {DictionaryServiceProvider} from "../providers/dictionary-service/dictionary-service-provider.service";

const Pages = [
  ReconfigurePage,
  ErrorsPage,
  ProfilePage,
  OauthFlow,
  InstitutionSearch,
  ConfigurationScreen,
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
    FormsModule,
    ErrorHandlerProvider,
    ValidatorProvider,
    DictionaryServiceProvider
  ]
})
export class PagesModule {}
