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

  private clientId : string = 'f817fbcc-e8f4-459e-af75-0822d86ff47a';

  private overrideProfile: boolean = false;

  constructor(public platform: Platform) {}

  /**
   * SSID network
   */
  getSsid() {
    return 'eduroam';
  }

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

  /**
   * Method to get profile if is overridable
   */
  getOverrideProfile(){
    return this.overrideProfile;
  }

  /**
   * Method to setting profile if is overridable
   * @param profile
   */
  setOverrideProfile(profile: boolean){
    this.overrideProfile = profile;
  }

  getCredentialApplicability(){
    return this.credentialApplicability;
  }

  setCredentialApplicability(credentialApplicability: CredentialApplicability){
    this.credentialApplicability = credentialApplicability;
  }
}
