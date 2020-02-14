import { BaseJson } from './baseJson';

export class ProviderLocation extends BaseJson {

  longitude: string;
  latitude: string;

  constructor() {
    super();
  }

  fillEntity(jsonAux: any):boolean {
    let returnValue: boolean = true;
    this.longitude = this.getSingleProperty(jsonAux, 'Longitude', true);
    returnValue = returnValue && this.longitude != null;
    this.latitude = this.getSingleProperty(jsonAux, 'Latitude', true);
    returnValue = returnValue && this.latitude != null;
    return returnValue;
  }


}
