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

    validateEmail(email: string): boolean{
        let regExpEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return regExpEmail.test(String(email).toLowerCase());
    }

    /**
     * Method to validate the eapconfig file and obtain its elements.
     * This method validates and updates the property [authenticationMethods]{@link #authenticationMethods}
     */
    async validateEapconfig(eapConfig: any, authenticationMethods: AuthenticationMethod[], providerInfo: ProviderInfo): Promise <boolean>{

        let keys = [
            'EAPIdentityProviderList',
            'EAPIdentityProvider',
            'AuthenticationMethods',
            'AuthenticationMethod'
        ];

        let jsonAux = eapConfig;

        //--------
        // EAP-CONFIG
        //--------
        if (!!jsonAux){
            for (let key of keys){
                if (isArray(jsonAux)){
                    if (jsonAux[0].hasOwnProperty(key)){
                        console.log('adding the array key', key, jsonAux[0][key]);
                        jsonAux = jsonAux[0][key];
                    } else {
                        console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
                        return false;
                    }
                } else if (isObject(jsonAux)) {
                    if (jsonAux.hasOwnProperty(key)) {
                        console.log('adding the object key', key, jsonAux[key]);
                        jsonAux = jsonAux[key];
                    } else {
                        console.error('Invalid eapconfig file, it does not contain the key '+key, jsonAux);
                        return false;
                    }
                    //--------
                    // Provider Info
                    //--------
                    if (key === 'EAPIdentityProvider') {
                        // providerInfo = new ProviderInfo();

                        if (!!jsonAux[0] !== undefined && !!jsonAux[0].ProviderInfo) {
                            await providerInfo.fillEntity(jsonAux[0].ProviderInfo);
                        }
                    }

                } else {
                    console.error('Invalid eapconfig file', jsonAux);
                    return false;
                }
            }

            //--------
            // AUTHENTICATION METHODS
            //--------

            // authenticationMethods = [];

            for (let i in jsonAux){
                console.log('AuthenticationMethod: ', jsonAux[i]);
                if(!!jsonAux[i]){
                    let authenticationMethodAux = new AuthenticationMethod();
                    try {
                        await authenticationMethodAux.fillEntity(jsonAux[i]);
                    } catch (e) {
                        return false;
                    }
                    authenticationMethods.push(authenticationMethodAux);
                }
            }
            //--------

        } else {
            console.error('wrong json', jsonAux);
            return false;
        }
        console.log('authentication: ', authenticationMethods);
        return true;
    }
}