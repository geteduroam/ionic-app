import {EapMethod} from "./eapMethod";
import {BaseJson} from "./baseJson";

export class InnerAuthenticationMethod extends BaseJson{
    /**
     * The eap method
     */
    eapMethod : EapMethod;
    /**
     * The non eap auth method
     */
    nonEAPAuthMethod : EapMethod;

    constructor() {
        super();
    }

    /**
     * Method which fills the inner authentication method by filling every property
     * This method updates the properties [eapMethod]{@link #eapMethod} and [nonEAPAuthMethod]{@link #nonEAPAuthMethod}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any): boolean{
        let returnValue: boolean = true;
        this.eapMethod = new EapMethod();
        this.nonEAPAuthMethod = new EapMethod();
        this.assignComplexProperty(this.eapMethod, 'eapMethod', jsonAux, 'EAPMethod', false);
        this.assignComplexProperty(this.nonEAPAuthMethod, 'nonEAPAuthMethod', jsonAux, 'NonEAPAuthMethod', false);
        return returnValue;
    }
}