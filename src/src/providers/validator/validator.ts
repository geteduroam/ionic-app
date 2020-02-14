import {Injectable} from "@angular/core";
import {Validators} from "@angular/forms";
import {isArray, isObject} from "ionic-angular/util/util";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";

@Injectable()
export class ValidatorProvider extends Validators {
    constructor() {
        super();
    }

    validateEmail(email: string, suffix?: string): boolean{
        let regExpEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

        return !!suffix ? regExpEmail.test(String(email).toLowerCase()) && email.includes(suffix) :
          regExpEmail.test(String(email).toLowerCase());
    }
}
