import {LoadingProvider} from "../providers/loading/loading";
import {DictionaryServiceProvider} from "../providers/dictionary-service/dictionary-service-provider.service";
import {Events} from "ionic-angular";
import {Plugins} from "@capacitor/core";
import {GlobalProvider} from "../providers/global/global";
const { Toast, Network } = Plugins;


export abstract class BasePage {

    protected activeNavigation:boolean = true;

    protected messageShown:boolean = false;

    protected constructor(protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
        protected event:Events, protected global: GlobalProvider) {
        this.statusConnection();
        this.event.subscribe('connection', (data) => {
           this.activeNavigation = data == 'connected';
        });
    }
    protected async statusConnection() {
      let connect = await Network.getStatus();
      this.activeNavigation = connect.connected;
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
        return methodResponse;
    }

    protected removeSpinner() {
      this.loading.dismiss();
    }

    protected getActiveNavigation(){
        return this.activeNavigation;
    }

    /**
     * This method show a toast message
     */
    protected async alertConnectionDisabled() {
        // if (!this.messageShown) {
        //     await Toast.show({
        //         text: this.dictionary.getTranslation('error', 'turn-on')+this.global.getSsid()+'.',
        //         duration: 'long'
        //     });
        //     this.messageShown = true;
        // }
        this.showToast(this.dictionary.getTranslation('error', 'turn-on')+this.global.getSsid()+'.');
    }

    /**
     * This method show a toast message
     */
    protected async showToast(message: string) {
        if (!this.messageShown) {
            await Toast.show({
                text: message,
                duration: 'long'
            });
            this.messageShown = true;
        }
    }

}
