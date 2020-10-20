import { Injectable } from '@angular/core';
import {ProfileModel} from "../../shared/models/profile-model";
import {AuthenticationMethod} from "../../shared/entities/authenticationMethod";
import {ProviderInfo} from "../../shared/entities/providerInfo";
import { Platform } from 'ionic-angular';
import {CredentialApplicability} from "../../shared/entities/credentialApplicability";

@Injectable()
export class GlobalProvider {

  /**
   * Type auth method
   */
  public auth = {
    MSCHAP: 3,
    MSCHAPv2: 4,
    PAP: 5
  };

  /**
   * Service Set Identifier
   */
  protected ssid: string;
  protected username: string;
  protected pass: string;
  private profile: ProfileModel;
  private dictionary: any;
  private authenticationMethod: AuthenticationMethod;
  private providerInfo: ProviderInfo;
  private credentialApplicability: CredentialApplicability;

  private clientId : string = 'app.geteduroam.ionic';

  private overrideProfile: boolean = false;

  private externalOpen: boolean = false;

  constructor(public platform: Platform) {}

  /**
   * Get Profile
   */
  getProfile(){
    return this.profile;
  }

  /**
   * Set Profile, if app is initialized from eap file
   * @param profile
   */
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

  isAndroid() {
    return this.platform.is('android');
  }

  /**
   * Method to get id client
   */
  getClientId(){
    return this.clientId;
  }

  getCredentialApplicability(){
    return this.credentialApplicability;
  }

  setCredentialApplicability(credentialApplicability: CredentialApplicability){
    this.credentialApplicability = credentialApplicability;
  }

  setExternalOpen() {
    this.externalOpen = !this.externalOpen;
  }

  getExternalOpen() {
    return this.externalOpen;
  }
}
