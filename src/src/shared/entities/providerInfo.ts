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

    this.assignComplexProperty(this.providerLocation, 'providerLocation', jsonAux, 'ProviderLocation', true);
    this.assignComplexProperty(this.helpdesk, 'helpdesk', jsonAux, 'Helpdesk', true);

    this.displayName = this.getSingleProperty(jsonAux, 'DisplayName', true);
    this.description = this.getSingleProperty(jsonAux, 'Description', false);
    this.providerLogo = this.getSingleProperty(jsonAux, 'ProviderLogo', false);
    this.termsOfUse = this.getSingleProperty(jsonAux, 'TermsOfUse', false);


  }


}
