import {BaseJson} from "./baseJson";


export class EapMethod extends BaseJson{
    /**
     * The type of the eap method
     */
    type : number;

    constructor() {
        super();
    }

    /**
     * Method which fills the eap method by filling every property
     * This method updates the property [type]{@link #type}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any):boolean{
        let returnValue: boolean = true;
        this.type = this.getSingleProperty(jsonAux, 'Type', true);
        returnValue = returnValue && this.type != null;
        return returnValue
    }
}