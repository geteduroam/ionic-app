import {Ca} from "./ca";
import {BaseJson} from "./baseJson";


export class ServerSideCredential extends BaseJson{
    ca : Ca;
    serverID: string;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any){

        this.ca = new Ca();

        this.assignComplexProperty(this.ca, 'ca', jsonAux, 'CA');
        this.assignSingleProperty(this.serverID, 'serverID', jsonAux, 'ServerID');
    }
}