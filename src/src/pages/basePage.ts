import {LoadingProvider} from "../providers/loading/loading";
import {DictionaryServiceProvider} from "../providers/dictionary-service/dictionary-service-provider.service";
import {Events} from "ionic-angular";


export abstract class BasePage {

    protected activateNavigation:boolean;

    protected constructor(protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
        protected event:Events) {
        let status = this.event.subscribe('connection', (data) => {
            console.log('Error handler subscribe: ', data);
            this.activateNavigation = data == 'connected';
        });
    }

    /**
     * This method calls the getTranslation method form the service [DictionaryService]{@link ./providers/dictionary-service/DictionaryServiceProvider.html}.
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

    protected getActiveNavigation(){
        return this.activateNavigation;
    }
}