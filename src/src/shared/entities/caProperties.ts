import {BaseJson} from "./baseJson";


export class CaProperties extends BaseJson{
    format : string;
    encoding: string;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any){
        this.assignSingleProperty(this.format, 'format', jsonAux, 'format');
        this.assignSingleProperty(this.encoding, 'encoding', jsonAux, 'encoding');
    }
}