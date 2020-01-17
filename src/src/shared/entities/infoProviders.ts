import { BaseJson } from './baseJson';

export class infoProviders extends BaseJson {

  displayName: string;
  providerLocation: any;
  providerLogo: any;
  helpDesk: any;

  constructor() {
    super();
  }

  // TODO: create model and fillEntity ProviderInfo
  fillEntity(jsonAux: any) {
    this.displayName = jsonAux.DisplayName;
    this.providerLocation = jsonAux.ProviderLocation;
    this.providerLogo = jsonAux.ProviderLogo;
    this.helpDesk = jsonAux.HelpDesk;

  }


}
