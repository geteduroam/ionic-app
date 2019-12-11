import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable()
export class LetswifiProvider {

  constructor(public http: HttpClient) {
    console.log('Hello LetswifiProvider Provider');
  }

}
