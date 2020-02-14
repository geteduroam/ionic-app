import {isArray, isObject} from "ionic-angular/util/util";

export abstract class BaseJson {


    protected constructor() {
    }

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
            if(propertyValue[0].hasOwnProperty(keyName)){
                try{
                    returnValue = propertyValue[0][keyName];
                } catch (e) {
                    console.error('Error on assigning the value '+propertyValue[0][keyName], e);
                    returnValue = null;
                }
            } else {
                if (mandatory) {
                    //TODO redirect to error vew when available
                    console.error('The json does not contain a key ' + keyName, propertyValue);
                    returnValue = null;
                }
            }
        } else if (!!isObject(propertyValue)){
            if (propertyValue.hasOwnProperty(keyName)){
                try{
                    returnValue = propertyValue[keyName];
                }catch (e) {
                    console.error('Error on assigning the value '+propertyValue[keyName], e);
                    returnValue = null;
                }

            } else {
                if (mandatory) {
                    //TODO redirect to error vew when available
                    console.error('The json does not contain a key ' + keyName, propertyValue);
                    returnValue = null;
                }
            }
        } else{
            //TODO redirect to error vew when available
            console.error('Invalid json file', propertyValue);
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
            if (propertyValue[0].hasOwnProperty(keyName)) {
                try {
                    returnValue = property.fillEntity(propertyValue[0][keyName]);
                } catch (e) {
                    console.error('Error on assigning the value ' + propertyValue[0][keyName] + ' to the property ' + propertyName, e);
                    returnValue = false;
                }
            } else {
                if (mandatory){
                    //TODO redirect to error vew when available
                    console.error('The json does not contain a key ' + keyName, propertyValue);
                    returnValue = false;
                }
            }
        } else if (isObject(propertyValue)) {
            if (propertyValue.hasOwnProperty(keyName)) {
                try {
                    returnValue = property.fillEntity(propertyValue[keyName]);
                } catch (e) {
                    console.error('Error on assigning the value ' + propertyValue[keyName] + ' to the property ' + propertyName, e);
                    returnValue = false;
                }

            } else {
                if (mandatory) {
                    //TODO redirect to error vew when available
                    console.error('The json does not contain a key ' + keyName, propertyValue);
                    returnValue = false;
                }
            }
        } else {
            //TODO redirect to error vew when available
            console.error('Invalid json file', propertyValue);
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
