/**
 * Model to oAuth Flow
 * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#authorization-endpoint}
 */
export class oAuthModel {
  client_id: string;
  scope: string;
  type: string;
  pkce: boolean;
  oAuthUrl: string;
  redirectUrl: string;
}
