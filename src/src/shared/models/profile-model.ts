/**
 * Model to Profile before oAuth flow
 */
export class ProfileModel {
  id: string;
  name: string;
  eapconfig_endpoint: string;
  oauth: boolean;
  token_endpoint?: string;
  authorization_endpoint?: string;
  token?: string;
}
