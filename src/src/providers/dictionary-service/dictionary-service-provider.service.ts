import { Injectable } from '@angular/core';
import { GlobalProvider } from '../global/global';
import {catchError} from "rxjs/operators";


/**
 *  @class DictionaryServiceProvider provider
 */
@Injectable()
export class DictionaryServiceProvider {

    constructor(private global: GlobalProvider) {

    }

    /**
     * This method sets the global variable dictionary regarding the param received
     * @param language to set the global dictionary
     */
    loadDictionary(language: string){
        let dictionaryPath;
        try {
            dictionaryPath = require(`../../../resources/dictionaries/${language}.json`);
        } catch(e){
            dictionaryPath = require(`../../../resources/dictionaries/en.json`);
        }
        this.global.setDictionary(dictionaryPath);
    }

    /**
     * This method returns the translation for the received key.
     * @param key to search in the dictionary
     * @param section in which to look for the key
     * @return the translated phrase
     */
    getTranslation(section: string, key: string){
        let response;
        try {
            response = this.global.getDictionary()[section][key];
        } catch (e) {
            response = this.global.getDictionary().defaultError;
        }
        if(!response){
            response = this.global.getDictionary().defaultError;
        }
        return response;
    }

}
