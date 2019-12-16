import {CaProperties} from "./caProperties";
import {BaseJson} from "./baseJson";


export class Ca extends BaseJson{
    properties : CaProperties;
    content: any;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any){

        this.properties = new CaProperties();

        this.assignComplexProperty(this.properties, 'properties', jsonAux, '$');
        this.assignSingleProperty(this.content, 'content', jsonAux, '_');
    }
}