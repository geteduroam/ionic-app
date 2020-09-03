import {BaseJson} from "./baseJson";


export class IEEE80211 extends BaseJson{
    /**
     * The type of the eap method
     */
    ssid : string;
    minRSNProto: string;
    consortiumOID: string;

    constructor() {
        super();
    }

    /**
     * Method which fills the IEEE80211 by filling every property
     * This method updates the properties [ssid]{@link #ssid}, [minRSNProto]{@link #minRSNProto} and [consortiumOID]{@link #consortiumOID}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any):boolean{
        let returnValue: boolean = true;
        this.ssid = this.getSingleProperty(jsonAux, 'SSID', false);
        this.minRSNProto = this.getSingleProperty(jsonAux, 'MinRSNProto', false);
        this.consortiumOID = this.getSingleProperty(jsonAux, 'ConsortiumOID', false);
        return returnValue
    }
}
