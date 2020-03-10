import {isArray, isObject} from "ionic-angular/util/util";

export abstract class BaseJson {


    protected constructor() {    }

    /**
     * Method which returns the value for basic-type properties form a json file
     * @param {any} propertyValue json form which to get the information
     * @param {string} keyName the key to find in the json
     * @param {boolean} mandatory whether or not the property is mandatory
     * @return The value of the key in the json
     */
    protected getSingleProperty(propertyValue: any, keyName: string, mandatory: boolean):any {
        let returnValue;
        if(!!isArray(propertyValue)){
            if(keyName == 'ServerID'){
                let returnArray : any[] = [];
                for(let entry of propertyValue){
                    try{
                        returnArray.push(entry[keyName]);
                    } catch (e) {
                        returnValue = null;
                    }
                    return returnArray;
                }
            }
            else if(propertyValue[0].hasOwnProperty(keyName)){
                try{
                    returnValue = propertyValue[0][keyName];
                } catch (e) {
                    returnValue = null;
                }
            } else {
                if (mandatory) {
                    returnValue = null;
                }
            }
        } else if (!!isObject(propertyValue)){
            if (propertyValue.hasOwnProperty(keyName)){
                try{
                    returnValue = propertyValue[keyName];
                }catch (e) {
                    returnValue = null;
                }

            } else {
                if (mandatory) {
                    returnValue = null;
                }
            }
        } else{
            returnValue = null;
        }

        return !!isArray(returnValue) ? returnValue[0] : returnValue;
    }

    /**
     * Method which updates the value for complex-type properties form a json file
     * @param {T} property the class to modify
     * @param {string} propertyName the field form property to be updated
     * @param {any} propertyValue json form which to get the information
     * @param {string} keyName the key to find in the json
     * @param {boolean} mandatory whether or not the property is mandatory
     */
    protected assignComplexProperty<T extends BaseJson>(property: T, propertyName: string, propertyValue: any, keyName: string, mandatory: boolean):boolean {
        let returnValue: boolean;
        if (isArray(propertyValue)) {
            if(keyName == 'CA'){
                for(let entry of propertyValue){
                    try {
                        returnValue = property.fillEntity(entry[keyName]);
                    } catch (e) {
                        returnValue = false;
                    }
                }
            }
            else if (propertyValue[0].hasOwnProperty(keyName)) {
                try {
                    returnValue = property.fillEntity(propertyValue[0][keyName]);
                } catch (e) {
                    returnValue = false;
                }
            } else {
                if (mandatory){
                    returnValue = false;
                }
            }
        } else if (isObject(propertyValue)) {
            if (propertyValue.hasOwnProperty(keyName)) {
                try {
                    returnValue = property.fillEntity(propertyValue[keyName]);
                } catch (e) {
                    returnValue = false;
                }

            } else {
                if (mandatory) {
                    returnValue = false;
                }
            }
        } else {
            returnValue = false;
        }
        return returnValue;
    }

    /**
     * Abstract method which must be implemented by every descendant class
     * @param {any} jsonAux the jsom form which to get the information
     */
    protected abstract fillEntity(jsonAux: any):boolean;

}
