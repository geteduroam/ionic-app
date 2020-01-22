import {BaseJson} from "./baseJson";


export class ClientSideCredential extends BaseJson{
    /**
     * The innerIdentitySuffix of the client side credentials
     */
    innerIdentitySuffix : string;
    /**
     * The innerIdentityHint of the client side credentials
     */
    innerIdentityHint: string;

    constructor() {
        super();
    }

    /**
     * Method which fills the client side credentials by filling every property
     * This method updates the properties [innerIdentitySuffix]{@link #innerIdentitySuffix} and [innerIdentityHint]{@link #innerIdentityHint}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any){
        this.innerIdentitySuffix = this.getSingleProperty(jsonAux, 'InnerIdentitySuffix', false);
        this.innerIdentityHint = this.getSingleProperty(jsonAux, 'InnerIdentityHint', false);
    }
}