import {BaseJson} from "./baseJson";


export class ClientSideCredential extends BaseJson{
    innerIdentitySuffix : string;
    innerIdentityHint: string;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any){
        this.assignSingleProperty(this.innerIdentitySuffix, 'innerIdentitySuffix', jsonAux, 'InnerIdentitySuffix');
        this.assignSingleProperty(this.innerIdentityHint, 'innerIdentityHint', jsonAux, 'InnerIdentityHint');
    }
}