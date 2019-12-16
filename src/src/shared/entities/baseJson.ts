import {isArray, isObject} from "ionic-angular/util/util";
import {EapMethod} from "./eapMethod";

export abstract class BaseJson {


    protected constructor() {
    }


    protected assignSingleProperty(property: any, propertyName: string, propertyValue: any, keyName: string){
        if(isArray(propertyValue)){
            if(propertyValue[0].hasOwnProperty(keyName)){
                try{
                    property = propertyValue[0][keyName];
                } catch (e) {
                    console.error('Error on assigning the value '+propertyValue[0][keyName]+' to the property '+propertyName, e);
                }
            } else {
                console.error('The json does not contain a key '+keyName, propertyValue);
            }
        } else if (isObject(propertyValue)){
            if(propertyValue.hasOwnProperty(keyName)){
                try{
                    property = propertyValue[keyName];
                }catch (e) {
                    console.error('Error on assigning the value '+propertyValue[keyName]+' to the property '+propertyName, e);
                }

            } else {
                console.error('The json does not contain a key '+keyName, propertyValue);
            }
        } else{
            console.error('Invalid json file', propertyValue);
        }
    }

    protected assignComplexProperty<T extends BaseJson>(property: T, propertyName: string, propertyValue: any, keyName: string){
        if(isArray(propertyValue)){
            if(propertyValue[0].hasOwnProperty(keyName)){
                try{
                    if(property instanceof EapMethod) {
                        console.log('entra por array con EapMethod', propertyValue[0][keyName]);
                    }
                    property.fillEntity(propertyValue[0][keyName]);
                } catch (e) {
                    console.error('Error on assigning the value '+propertyValue[0][keyName]+' to the property '+propertyName, e);
                }
            } else {
                console.error('The json does not contain a key '+keyName, propertyValue);
            }
        } else if (isObject(propertyValue)){
            if(propertyValue.hasOwnProperty(keyName)){
                try{
                    if(property instanceof EapMethod) {
                        console.log('entra por array con EapMethod', propertyValue[keyName]);
                    }
                    property.fillEntity(propertyValue[keyName]);
                }catch (e) {
                    console.error('Error on assigning the value '+propertyValue[keyName]+' to the property '+propertyName, e);
                }

            } else {
                console.error('The json does not contain a key '+keyName, propertyValue);
            }
        } else{
            console.error('Invalid json file', propertyValue);
        }
    }

    protected abstract fillEntity(jsonAux: any);

}