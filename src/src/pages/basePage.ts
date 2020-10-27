import {LoadingProvider} from "../providers/loading/loading";
import {DictionaryServiceProvider} from "../providers/dictionary-service/dictionary-service-provider.service";
import {Events} from "ionic-angular";
import { Plugins } from '@capacitor/core';
import {GlobalProvider} from "../providers/global/global";
const { Toast, Network, Modals, Browser } = Plugins;
declare var window: any;
export abstract class BasePage {

  /**
   * It checks if navigation is active
   */
  protected activeNavigation: boolean = true;

  /**
   * It checks if toast message is active
   */
  protected messageShown: boolean = false;

  protected constructor(protected loading: LoadingProvider, protected dictionary: DictionaryServiceProvider,
      protected event:Events, protected global: GlobalProvider) {

      this.statusConnection();
      this.event.subscribe('connection', (data) => {
         this.activeNavigation = data == 'connected';
      });
  }

  /**
   * Method to check status connection
   */
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

  /**
   * Method called to show spinner
   * @param methodResponse
   */
  protected async waitingSpinner(methodResponse){
      this.loading.createAndPresent();
      return methodResponse;
  }

  /**
   * Method called to remove loading spinner
   */
  protected removeSpinner() {
    this.loading.dismiss();
  }

  /**
   * Method called to check status navigation
   */
  protected getActiveNavigation(){
      return this.activeNavigation;
  }

  /**
   * This method show a toast message
   */
  protected async alertConnectionDisabled() {
      this.showToast(this.dictionary.getTranslation('error', 'turn-on'));
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
  async modalSupport() {
    const providerInfo = this.global.getProviderInfo();
    let options = {
      title: this.dictionary.getTranslation('modalSupport', 'title'),
      message: this.dictionary.getTranslation('modalSupport', 'message'),
      options: []
    };
    if (providerInfo.helpdesk.webAddress) options.options.push({title: this.dictionary.getTranslation('modalSupport', 'web')});
    if (providerInfo.helpdesk.emailAddress) options.options.push({title: this.dictionary.getTranslation('modalSupport', 'email')});
    if (providerInfo.helpdesk.phone) options.options.push({title: this.dictionary.getTranslation('modalSupport', 'phone')});

    let supportOption = await Modals.showActions(options);

    switch(options.options[supportOption.index].title) {
      case this.dictionary.getTranslation('modalSupport', 'web'):
        return await Browser.open({url: providerInfo.helpdesk.webAddress});
      case this.dictionary.getTranslation('modalSupport', 'email'):
        return window.location.href = 'mailto:' + providerInfo.helpdesk.emailAddress + '?Subject=' + this.dictionary.getTranslation('modalSupport', 'help');
      case this.dictionary.getTranslation('modalSupport', 'phone'):
        return window.location.href = 'tel:'+providerInfo.helpdesk.phone;
    }

}

}
