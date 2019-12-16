import {BaseJson} from "./baseJson";


export class EapMethod extends BaseJson{
    type : number;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any){
        this.assignSingleProperty(this.type, 'type', jsonAux, 'Type');
    }
}