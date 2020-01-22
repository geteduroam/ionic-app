import {Ca} from "./ca";
import {BaseJson} from "./baseJson";


export class ServerSideCredential extends BaseJson{
    /**
     * The CA certificate
     */
    ca : Ca;
    /**
     * The server ID
     */
    serverID: string;

    constructor() {
        super();
    }

    /**
     * Method which fills the server side credential by filling every property
     * This method updates the properties [ca]{@link #ca} and [serverID]{@link #serverID}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any){
        this.ca = new Ca();
        this.assignComplexProperty(this.ca, 'ca', jsonAux, 'CA', true);
        this.serverID = this.getSingleProperty(jsonAux, 'ServerID', true);
    }
}