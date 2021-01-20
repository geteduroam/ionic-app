import {IEEE80211} from "./iEEE80211";
import {BaseJson} from "./baseJson";
import {isArray, isObject} from "ionic-angular/util/util";
import {GlobalProvider} from "../../providers/global/global";


export class CredentialApplicability extends BaseJson{
  /**
   * The IEEE80211
   */
  iEEE80211 : IEEE80211[];

  constructor(private global: GlobalProvider) {
    super();
  }

  /**
   * Method which fills the CredentialApplicability by filling every IEEE80211
   * This method updates the property [iEEE80211]{@link #iEEE80211}
   * @param {any} jsonAux json from which to retrieve the info.
   */
  fillEntity(jsonAux: any):boolean{
    this.iEEE80211 = jsonAux['IEEE80211'];
    return true;
  }
}
