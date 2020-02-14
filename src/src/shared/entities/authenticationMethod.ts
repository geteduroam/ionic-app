import {EapMethod} from "./eapMethod";
import {ServerSideCredential} from "./serverSideCredential";
import {ClientSideCredential} from "./clientSideCredential";
import {InnerAuthenticationMethod} from "./innerAuthenticationMethod";
import {BaseJson} from "./baseJson";


export class AuthenticationMethod extends BaseJson {
    /**
     * The [EapMethod] {@link ./eapMethod.html}
     */
    eapMethod : EapMethod;
    /**
     * The [ServerSideCredential] {@link ./serverSideCredential.html}
     */
    serverSideCredential : ServerSideCredential;
    /**
     * The [ClientSideCredential] {@link ./clientSideCredential.html}
     */
    clientSideCredential : ClientSideCredential;
    /**
     * The [InnerAuthenticationMethod] {@link ./innerAuthenticationMethod.html}
     */
    innerAuthenticationMethod: InnerAuthenticationMethod;

    constructor() {
        super();
    }

    /**
     * Method which fills the authentication method by filling every property
     * This method updates the properties [eapMethod]{@link #eapMethod}, [serverSideCredential]{@link #serverSideCredential}, [clientSideCredential]{@link #clientSideCredential} and [innerAuthenticationMethod]{@link #innerAuthenticationMethod}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any):boolean{

        let returnValue: boolean = true;

        this.eapMethod = new EapMethod();
        this.serverSideCredential = new ServerSideCredential();
        this.clientSideCredential = new ClientSideCredential();
        this.innerAuthenticationMethod = new InnerAuthenticationMethod();

        returnValue = returnValue && this.assignComplexProperty(this.eapMethod, 'eapMethod', jsonAux, 'EAPMethod', true);
        returnValue = returnValue && this.assignComplexProperty(this.serverSideCredential, 'serverSideCredential', jsonAux, 'ServerSideCredential', true);
        returnValue = returnValue && this.assignComplexProperty(this.clientSideCredential, 'clientSideCredential', jsonAux, 'ClientSideCredential', true);
        this.assignComplexProperty(this.innerAuthenticationMethod, 'innerAuthenticationMethod', jsonAux, 'InnerAuthenticationMethod', false);

        return returnValue;
    }
}