import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 *  @class GeteduroamServices provider
 */
@Injectable()
export class GeteduroamServices {

  private readonly url = "https://demo.eduroam.no/";

  constructor(public http: HttpClient) {

  }

  /**
   * This method is to work wih the discovery method:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#discovery}
   *
   */
  async discovery() {
    return this.http.get(`http://discovery.geteduroam.no/discovery-v1.json`, { });
  }

  /**
   * This method is to work with the oAuthEndpoint method:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#authorization-endpoint}
   *
   * @param data
   */
  buildAuthUrl(data: any) {

    // TODO: Build code_challenge
    const oauthParams = {
      client_id: data.client_id,
      oAuthUrl: "authorize.php",
      type: "code",
      redirectUrl: 'http://localhost:8080/',
      pkce: true,
      scope: 'eap-metadata',
      code_challenge: data.code_challenge
    };

    // Example: https://demo.eduroam.no/authorize.php?response_type=code&code_challenge_method=S256&scope=eap-metadata&code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM&redirect_uri=http://localhost:8080/authorize.php&client_id=00000000-0000-0000-0000-000000000000&state=0
    const url = `${this.url}/${oauthParams.oAuthUrl}/response_type=${oauthParams.type}&code_challenge_method=&scope=${oauthParams.scope}&code_challenge=${oauthParams.code_challenge}&redirect_uri=${oauthParams.redirectUrl}/authorize.php&client_id=${oauthParams.client_id}&state=0`;

    this.http.get(url, {}).subscribe((data) => {
      console.log('Method get to oAuthEndpoint', data);

      this.buildTokenUrl('')
    })
  }

  /**
   * This method is to work with the token endpoint method:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#token-endpoint}
   *
   * @param {string} code
   */
  buildTokenUrl(code: string) {

    // TODO: Build code_verifier
    const tokenParams = {
      grant_type: 'authorization_code',
      code,
      code_verifier: ''
    };

    // Example: GET /token.php?grant_type=authorization_code&code=v2.local.AAAAAA&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
    const url = `${this.url}/token.php?grant_type=${tokenParams.grant_type}&code=${code}&code_verifier=${tokenParams.code_verifier}`;

    this.http.get(url, {}).subscribe((token) => {
      console.log('Method get TokenAuth: ', token);
      this.buildGenerator(token);
    });
  }

  /**
   * This method is to work with the generator endpoint method:
   * [Api Documentation]{@link https://github.com/Uninett/lets-wifi/blob/master/API.md#generator-endpoint}
   *
   * @param data
   */
  buildGenerator(data: any){

  // Example: /generate.php?format=eap-metadata
    const url = ``;

    //TODO: Build Header Authorization: Bearer AAAAAA==${token}
    this.http.get(url, {}).subscribe((res) => {
      console.log('Method get generator: ', res);

    });
  }
}
