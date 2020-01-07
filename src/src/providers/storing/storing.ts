import { Injectable } from '@angular/core';
import { FilesystemDirectory, FilesystemEncoding, Plugins } from '@capacitor/core';

const { Filesystem, Toast } = Plugins;

@Injectable()
export class StoringProvider {

  /**
   * Method when to check if file just already exist
   * Catch function if not exist, throw storeFile method.
   * If exist, throw existFile method.
   */
  async readFile(fileCert) {

    Filesystem.readFile({
      path: 'certs/eap-cert.eap-config',
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8

    }).then(async () => {
      await this.existFile(fileCert);

    }).catch(async () => {

      await this.storeFile(fileCert)
    });

  }

  /**
   * Method when file just already exist.
   * Remove direction and throw storeFile method.
   */
  async existFile(fileCert) {
    await this.rmdir();
    await this.storeFile(fileCert);
  }

  /**
   * Method to storeFile.
   */
  async storeFile(fileCert) {
    this.createFolder();
    this.writeFile(fileCert);
    this.readFile(fileCert);
    this.appendFile(fileCert);
    this.getUri();
  }

  /**
   * Method to get direction where it store the file.
   */
  async getUri() {
    const uri = await Filesystem.getUri({
      path: 'certs/eap-cert.eap-config',
      directory: FilesystemDirectory.Documents,
    });
    this.successSave(uri);
  }

  /**
   * Method to show message successfully.
   */
  async successSave(uri) {
    await Toast.show({
      text: "Success save file in " + uri.uri,
      duration: 'long'
    });
  }

  /**
   * Method to append file and store it.
   */
  async appendFile(fileCert) {
    await Filesystem.appendFile({
      path: 'certs/eap-cert.eap-config',
      data: fileCert,
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
  }

  /**
   * Method to remove direction if just already exist.
   */
  async rmdir() {
    return await Filesystem.rmdir({
        path: 'certs',
        directory: FilesystemDirectory.Documents,
        recursive: true,
    });
  }

  /**
   * This method create the folder 'certs' to save it certificates
   */
  async createFolder() {
    return await Filesystem.mkdir({
      createIntermediateDirectories: true,
      path: 'certs',
      directory: FilesystemDirectory.Documents,
      recursive: true
    });
  }

  /**
   * This method write file to save it after.
   */
  async writeFile(fileCert) {
    await Filesystem.writeFile({
      path: 'certs/eap-cert.eap-config',
      data: fileCert,
      directory: FilesystemDirectory.Documents,
      encoding: FilesystemEncoding.UTF8
    });
  }

}
