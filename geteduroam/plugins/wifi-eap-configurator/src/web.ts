import { WebPlugin } from '@capacitor/core';
import { WifiEapConfiguratorPlugin } from './definitions';

export class WifiEapConfiguratorWeb extends WebPlugin implements WifiEapConfiguratorPlugin {
  constructor() {
    super({
      name: 'WifiEapConfigurator',
      platforms: ['web']
    });
  }

  async echo(options: { value: string }): Promise<{value: string}> {
    //console.log('ECHO', options);
    return options;
  }
}

const WifiEapConfigurator = new WifiEapConfiguratorWeb();

export { WifiEapConfigurator };

import { registerWebPlugin } from '@capacitor/core';
registerWebPlugin(WifiEapConfigurator);
