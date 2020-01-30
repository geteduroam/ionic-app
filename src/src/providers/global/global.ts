import { Injectable } from '@angular/core';
import {ProfileModel} from "../../shared/models/profile-model";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {ProviderInfo} from "../../shared/entities/providerInfo";

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

  private profile: ProfileModel;

  private dictionary: any;

  private authenticationMethod: AuthenticationMethod;
  private providerInfo: ProviderInfo;

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

  getProfile(){
    return this.profile;
  }

  setProfile(profile: ProfileModel){
    this.profile = profile;
  }

  getDictionary(){
    return this.dictionary;
  }

  setDictionary(dictionary: any){
    this.dictionary = dictionary;
  }

  getAuthenticationMethod(){
    return this.authenticationMethod;
  }

  setAuthenticationMethod(authenticationMethod: AuthenticationMethod){
    this.authenticationMethod = authenticationMethod;
  }

  getProviderInfo(){
    return this.providerInfo;
  }

  setProviderInfo(providerInfo: ProviderInfo){
    this.providerInfo = providerInfo;
  }

}
