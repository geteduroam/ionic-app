import {EapMethod} from "./eapMethod";
import {ServerSideCredential} from "./serverSideCredential";
import {ClientSideCredential} from "./clientSideCredential";
import {InnerAuthenticationMethod} from "./innerAuthenticationMethod";
import {BaseJson} from "./baseJson";


export class AuthenticationMethod extends BaseJson {
    eapMethod : EapMethod;
    serverSideCredential : ServerSideCredential;
    clientSideCredential : ClientSideCredential;
    innerAuthenticationMethod: InnerAuthenticationMethod;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any){

        this.eapMethod = new EapMethod();
        this.serverSideCredential = new ServerSideCredential();
        this.clientSideCredential = new ClientSideCredential();
        this.innerAuthenticationMethod = new InnerAuthenticationMethod();

        this.assignComplexProperty(this.eapMethod, 'eapMethod', jsonAux, 'EAPMethod');
        this.assignComplexProperty(this.serverSideCredential, 'serverSideCredential', jsonAux, 'ServerSideCredential');
        this.assignComplexProperty(this.clientSideCredential, 'clientSideCredential', jsonAux, 'ClientSideCredential');
        this.assignComplexProperty(this.innerAuthenticationMethod, 'innerAuthenticationMethod', jsonAux, 'InnerAuthenticationMethod');
    }
}