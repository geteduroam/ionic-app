import { BaseJson } from './baseJson';

export class ProviderLocation extends BaseJson {

  longitude: string;
  latitude: string;

  constructor() {
    super();
  }

  // TODO: create model and fillEntity ProviderInfo
  fillEntity(jsonAux: any) {
    this.longitude = jsonAux.Longitude;
    this.latitude = jsonAux.Latitude;
  }


}
