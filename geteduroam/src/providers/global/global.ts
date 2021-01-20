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
    PAP: -1,
    MSCHAP: -2,
    MSCHAPv2: -3,
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
  private validUntil;

  /*
   * Client ID of the application. Must match the following strings:
   * * src/android/app/build.gradle (applicationId)
   * * src/android/app/build.gradle (manifestPlaceholders) (appAuthRedirectScheme)
   * * src/android/app/src/main/AndroidManifest.xml (package)
   * * src/android/app/src/main/assets/capacitor.config.json (appId)
   * * src/android/app/src/main/res/values/strings.xml (package_name)
   * * src/android/app/src/main/res/values/strings.xml (custom_url_scheme)
   * * src/capacitor.config.json (appId)
   * * src/config.xml (<widget id>)
   * * src/ios/App/App.xcodeproj/project.pbxproj (PRODUCT_BUNDLE_IDENTIFIER 2x)
   * * src/ios/App/App/Info.plist (3x)
   * * src/ios/App/App/capacitor.config.json (appId)
   */
  private clientId : string = 'app.eduroam.geteduroam';

  private overrideProfile: boolean = false;

  private externalOpen: boolean = false;

  private idInstitution: string;

  discovery: any[];

  reconfigure: boolean;

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

  setDiscovery(list: any) {
    this.discovery = list;
  }

  getDiscovery() {
    return this.discovery;
  }

  setIdInstitution(idInstitution: string) {
    this.idInstitution = idInstitution;
  }

  getIdInstitution() {
    return this.idInstitution;
  }

  setIsReconfigure(reconfigure: boolean) {
    this.reconfigure = reconfigure;
  }

  getIsReconfigure() {
    return this.reconfigure;
  }

  setValidUntil(valid) {
    this.validUntil = valid.toString();
  }

  getValidUntil() {
    return this.validUntil;
  }
}
