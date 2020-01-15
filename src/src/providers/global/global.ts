import { Injectable } from '@angular/core';

@Injectable()
export class GlobalProvider {

  public auth = {
    MSCHAP: 3,
    MSCHAPv2: 4,
    PAP: 5
  };
  protected ssid: string;
  protected username: string;
  protected pass: string;

  //TODO: CREATE METHODS TO GET DATA
  getSsid() {
    return 'eduroam';
  }

  getUsername() {
    return "emergya@sysuser.uninett.no";
  }

  getPass() {
    return "Jaisoo6d";
  }

  getServerName() {
    return ""
  }

  getAnonUser() {
    return ""
  }

}
