import { BaseJson } from './baseJson';

export class ProviderLocation extends BaseJson {

  longitude: string;
  latitude: string;

  constructor() {
    super();
  }

  fillEntity(jsonAux: any) {
    this.longitude = this.getSingleProperty(jsonAux, 'Longitude', true);
    this.latitude = this.getSingleProperty(jsonAux, 'Latitude', true);
  }


}
