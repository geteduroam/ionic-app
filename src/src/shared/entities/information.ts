import { BaseJson } from './baseJson';
import {Helpdesk} from "./helpdesk";

export class InformationNetwork extends BaseJson {

    ssid: string;
    institutionName: string;
    institution: string;
    authentication: string;
    suffix: string;
    logo: string;
    helpDesk: Helpdesk;
    validUntil: Date;
    eap: string;
    auth: string;
    username: string;
    oids: string;

    constructor() {
        super();
    }

    fillEntity(jsonAux: any): boolean {
        let returnValue: boolean = true;
        this.helpDesk = new Helpdesk();
        this.ssid = this.getSingleProperty(jsonAux, "ssid", false);
        this.institutionName = this.getSingleProperty(jsonAux, "institutionName", false);
        this.institution = this.getSingleProperty(jsonAux, "institution", false);
        this.authentication = this.getSingleProperty(jsonAux, "authentication", false);
        this.suffix = this.getSingleProperty(jsonAux, "suffix", false);
        this.logo = this.getSingleProperty(jsonAux, "logo", false);
        this.helpDesk.webAddress = this.getSingleProperty(jsonAux, "webAddress", false);
        this.helpDesk.emailAddress = this.getSingleProperty(jsonAux, "emailAddress", false);
        this.helpDesk.phone = this.getSingleProperty(jsonAux, "phone", false);
        let valid = this.getSingleProperty(jsonAux, 'date', false);
        this.validUntil = new Date(parseInt(valid));
        this.eap = this.getSingleProperty(jsonAux, 'eap', false);
        this.auth = this.getSingleProperty(jsonAux, 'auth', false);
        this.username = this.getSingleProperty(jsonAux, 'username', false);
        this.oids = this.getSingleProperty(jsonAux, 'oid', false);
        return returnValue;
    }

    getHelpDesk() {
        return this.helpDesk;
    }

}