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
  fillEntity(jsonAux: any):boolean {

    let returnValue: boolean = true;
    this.providerLocation = new ProviderLocation();
    this.helpdesk = new Helpdesk();

    returnValue = returnValue && this.assignComplexProperty(this.providerLocation, 'providerLocation', jsonAux, 'ProviderLocation', true);
    returnValue = returnValue && this.assignComplexProperty(this.helpdesk, 'helpdesk', jsonAux, 'Helpdesk', true);

    this.displayName = this.getSingleProperty(jsonAux, 'DisplayName', true);
    returnValue = returnValue && this.displayName != null;

    this.description = this.getSingleProperty(jsonAux, 'Description', false);
    this.providerLogo = this.getSingleProperty(jsonAux, 'ProviderLogo', false);
    this.termsOfUse = this.getSingleProperty(jsonAux, 'TermsOfUse', false);

    return returnValue;


  }


}
