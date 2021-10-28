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
    /**
     * The AnonymousIdentity of the client side credentials (oauth)
     */
    anonymousIdentity: string;
    /**
     * The ClientCertificate of the client side credentials (oauth)
     */
    clientCertificate: any;
    /**
     * The Passphrase of the client side credentials (oauth)
     */
    passphrase: string;
    /**
     * The username of the client side credentials (cat)
     */
    username: string;
    /**
     * The password of the client side credentials (cat)
     */
    password: string;

    constructor() {
        super();
    }

    /**
     * Method which fills the client side credentials by filling every property
     * This method updates the properties [innerIdentitySuffix]{@link #innerIdentitySuffix}, [innerIdentityHint]{@link #innerIdentityHint},
     * [anonymousIdentity]{@link #anonymousIdentity}, [clientCertificate]{@link #clientCertificate} and [passphrase]{@link #passphrase}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any):boolean{
        let returnValue: boolean = true;
        this.innerIdentitySuffix = this.getSingleProperty(jsonAux, 'InnerIdentitySuffix', false);
        this.innerIdentityHint = this.getSingleProperty(jsonAux, 'InnerIdentityHint', false);
        this.anonymousIdentity = this.getSingleProperty(jsonAux, 'OuterIdentity', false);
        this.clientCertificate = this.getSingleProperty(jsonAux, 'ClientCertificate', false);
        this.passphrase = this.getSingleProperty(jsonAux, 'Passphrase', false);

        // XSD states field name is "UserName", but earlier we have accepted "Username"
        // The Windows application refuses "Username", so from now on we do too.
        // If you need to support both apps, just put both UserName and Username in your eap-config.
        this.username = this.getSingleProperty(jsonAux, 'UserName', false);
        this.password = this.getSingleProperty(jsonAux, 'Password', false);
        return returnValue;
    }
}
