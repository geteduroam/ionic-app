import { Injectable } from "@angular/core";
import {GlobalProvider} from "../global/global";
import {Plugins} from "@capacitor/core";
import {NetworkStatus} from "@capacitor/core/dist/esm/core-plugin-definitions";
const { WifiEapConfigurator, Network } = Plugins;

@Injectable()
export class ErrorServiceProvider {
  showModal: boolean = false;

  constructor(private global:GlobalProvider) {
  }

  /**
   * Method check type of error
   * @param method
   * @param isFinal
   */
  public async checkAgain(method: string, isFinal: boolean) : Promise<boolean>{
    let returnValue: boolean;

    switch (method) {
        case 'removeConnection':
            const isAssociated = await WifiEapConfigurator.isNetworkAssociated({'ssid': this.global.getSsid()});
            !isAssociated.success && !isAssociated.overridable ? returnValue = false : returnValue = true;
            break;
        case 'enableAccess':
            const connect = await this.statusConnection();
            returnValue = connect.connected;
            break;
        default:
            returnValue = !isFinal;
    }
    return returnValue;
  }

  /**
   * This method check status of connection
   */
  private async statusConnection():Promise<NetworkStatus> {
    return await Network.getStatus()
  }
}
