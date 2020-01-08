import { BaseJson } from './baseJson';

export class Helpdesk extends BaseJson {

  emailAddress: string;
  phone: string;
  webAddress: string;

  constructor() {
    super();
  }

  // TODO: create model and fillEntity ProviderInfo
  fillEntity(jsonAux: any) {
    this.emailAddress = jsonAux.EmailAddress;
    this.phone = jsonAux.Phone;
    this.webAddress = jsonAux.WebAddress;
  }


}
