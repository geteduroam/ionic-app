import {CaProperties} from "./caProperties";
import {BaseJson} from "./baseJson";


export class Ca extends BaseJson{
    /**
     * The [CaProperties] {@link ./caProperties.html}
     */
    properties : CaProperties;
    /**
     * The content of the CA certificate
     */
    content: any;

    constructor() {
        super();
    }

    /**
     * Method which fills the CA certificate by filling every property
     * This method updates the properties [properties]{@link #properties} and [content]{@link #content}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any){
        this.properties = new CaProperties();
        this.assignComplexProperty(this.properties, 'properties', jsonAux, '$', true);
        this.content = this.getSingleProperty(jsonAux, '_', false);
    }
}