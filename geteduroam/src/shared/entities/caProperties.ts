import {BaseJson} from "./baseJson";


export class CaProperties extends BaseJson{
    /**
     * The format of the CA certificate
     */
    format : string;
    /**
     * The encoding of the CA certificate
     */
    encoding: string;

    constructor() {
        super();
    }

    /**
     * Method which fills the CA properties by filling every property
     * This method updates the properties [format]{@link #format} and [encoding]{@link #encoding}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any): boolean{
        let returnValue: boolean = true;
        this.format = this.getSingleProperty(jsonAux, 'format', true);
        this.encoding = this.getSingleProperty(jsonAux, 'encoding', true);
        returnValue = returnValue && this.format != null && this.encoding != null;
        return returnValue;
    }
}