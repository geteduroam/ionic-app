import {Ca} from "./ca";
import {BaseJson} from "./baseJson";
import {isArray, isObject} from "ionic-angular/util/util";
import {CaProperties} from "./caProperties";


export class ServerSideCredential extends BaseJson{
    /**
     * The CA certificate
     */
    ca : Ca[];
    /**
     * The server ID
     */
    serverID: string[];

    constructor() {
        super();
    }

    /**
     * Method which fills the server side credential by filling every property
     * This method updates the properties [ca]{@link #ca} and [serverID]{@link #serverID}
     * @param {any} jsonAux json from which to retrieve the info.
     */
    fillEntity(jsonAux: any):boolean{
        let returnValue: boolean = true;
        returnValue = returnValue && this.fillProperties(jsonAux);
        //this.ca = new Ca();
        // returnValue = returnValue && this.assignCaArray(this.ca, 'ca', jsonAux, 'CA', true);
        // this.serverID = this.getSingleProperty(jsonAux, 'ServerID', false);
        //console.log('ServerSideCredential', this);
        return returnValue;
    }

    /**
     * Method which updates the value for complex-type properties form a json file
     * @param {T} property the class to modify
     * @param {string} propertyName the field form property to be updated
     * @param {any} propertyValue json form which to get the information
     * @param {string} keyName the key to find in the json
     * @param {boolean} mandatory whether or not the property is mandatory
     */
    protected fillProperties<T extends BaseJson> (propertyValue: any):boolean {
        let returnValue: boolean = true;
        //console.log(propertyValue);
        if (isArray(propertyValue)) {
            // console.log('CA', propertyValue[0]['CA']);
            let certificates = propertyValue[0]['CA'];
            this.ca = [];
            for(let certificate of certificates){
                try {
                    let caAux = new Ca();
                    // console.log('CERTIFICATE: ', certificate);
                    // console.log('CERTIFICATE properties: ', certificate['$']);
                    // console.log('CERTIFICATE content: ', certificate['_']);
                    // returnValue = returnValue && this.assignComplexProperty(caAux.properties, 'properties', certificate, '$', true);
                    caAux.properties = new CaProperties();
                    caAux.properties.encoding = this.getSingleProperty(certificate['$'], 'encoding', true);
                    caAux.properties.format = this.getSingleProperty(certificate['$'], 'format', true);
                    caAux.content = this.getSingleProperty(certificate, '_', true);
                    //console.log('caAux', caAux);
                    this.ca.push(caAux);
                } catch (e) {
                    returnValue = false;
                }
            } try {
                //console.log('SERVER ID', propertyValue[0]['ServerID']);
                this.serverID = propertyValue[0]['ServerID'];
            } catch (e) {
                returnValue = false;
            }
        } else {
            returnValue = false;
        }
        return returnValue;
    }
}