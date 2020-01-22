import {NavController, NavParams} from "ionic-angular";
import {LoadingProvider} from "../providers/loading/loading";
import {ErrorHandlerProvider} from "../providers/error-handler/error-handler";
import {GlobalProvider} from "../providers/global/global";
import {DictionaryService} from "../providers/dictionary-service/dictionary-service";


export class BasePage {

    constructor(protected navCtrl: NavController, protected navParams: NavParams, protected loading: LoadingProvider, protected errorHandler: ErrorHandlerProvider,
                protected global: GlobalProvider, protected dictionary: DictionaryService) {

    }

    /**
     * This method calls the getTranslation method form the service [DictionaryService]{@link ./providers/dictionary-service/DictionaryService.html}.
     * @param key to search in the dictionary
     * @param section in which to look for the key
     * @return the translated phrase
     */
    protected getString(section: string, key:string){
        return this.dictionary.getTranslation(section, key);
    }

    protected async waitingSpinner(methodResponse){
            this.loading.createAndPresent();
            const response = methodResponse;
            this.loading.dismiss();
            return response;
    }
}