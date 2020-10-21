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
    PAP: 1,
    MSCHAP: 2,
    MSCHAPv2: 3,
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

  discovery: any;
  institutionNames: string[] = [];

  constructor(public platform: Platform) {}

  /**
   * SSID network
   */
  getSsid() {
    return this.ssid;
  }

  setSsid(value: string) {
    this.ssid = value;
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

  setExternalOpen() {
    this.externalOpen = !this.externalOpen;
  }

  getExternalOpen() {
    return this.externalOpen;
  }

  setDiscovery(list: any) {
    this.discovery = list;
    if (!!list) {
      list.map((res) => {
        if (res.name) {
          this.institutionNames.push(res.name);
        }
      })
    }
  }

  getDiscovery() {
    return this.discovery;
  }

  getInstitutionNames() {
    return this.institutionNames;
  }
}
