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
    this.emailAddress = this.getSingleProperty(jsonAux, 'EmailAddress', false);
    this.phone = this.getSingleProperty(jsonAux, 'Phone', false);
    this.webAddress = this.getSingleProperty(jsonAux, 'WebAddress', false);
  }


}
