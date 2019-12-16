import {EapMethod} from "./eapMethod";
import {BaseJson} from "./baseJson";

export class InnerAuthenticationMethod extends BaseJson{
    eapMethod : EapMethod;
    nonEAPAuthMethod : EapMethod;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any){

        this.eapMethod = new EapMethod();
        this.nonEAPAuthMethod = new EapMethod();

        this.assignComplexProperty(this.eapMethod, 'eapMethod', jsonAux, 'EAPMethod');
        this.assignComplexProperty(this.nonEAPAuthMethod, 'nonEAPAuthMethod', jsonAux, 'NonEAPAuthMethod');
    }
}