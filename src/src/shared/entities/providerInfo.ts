import { BaseJson } from './baseJson';
import {ProviderLocation} from "./providerLocation";
import {Helpdesk} from "./helpdesk";

export class ProviderInfo extends BaseJson {

  displayName: string;
  description: string;
  providerLocation: ProviderLocation;
  providerLogo: any;
  termsOfUse: any;
  helpdesk: Helpdesk;

  constructor() {
    super();
  }

  // TODO: create model and fillEntity ProviderInfo
  async fillEntity(jsonAux: any) {

    this.providerLocation = new ProviderLocation();
    this.helpdesk = new Helpdesk();

    this.displayName = jsonAux.DisplayName;
    this.description = jsonAux.Description;
    this.assignComplexProperty(this.providerLocation, 'providerLocation', jsonAux, 'ProviderLocation', true);
    this.providerLogo = jsonAux.ProviderLogo;
    this.termsOfUse = jsonAux.TermsOfUse;
    this.assignComplexProperty(this.helpdesk, 'helpdesk', jsonAux, 'Helpdesk', true);

  }


}
