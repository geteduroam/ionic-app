import { Injectable } from '@angular/core';
import { FilesystemDirectory, FilesystemEncoding, Plugins } from '@capacitor/core';

const { Filesystem, Toast } = Plugins;
declare var window;

@Injectable()
export class StoringProvider {

  /**
   * Method to read file when app is initialized by a eap-config file
   * @param uri: String
   */
  async readExtFile(uri){

    try {
      let data = await Filesystem.readFile({
        path: uri,
        encoding: FilesystemEncoding.UTF8,
      });
      return data;

    } catch (e) {
      console.error(e)
    }
  }

}
