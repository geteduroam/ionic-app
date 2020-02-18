import {Injectable} from "@angular/core";
import {Validators} from "@angular/forms";

@Injectable()
export class ValidatorProvider extends Validators {
  constructor() {
    super();
  }

  /**
   * Method to validate email and it checks if contain identity suffix
   * @param email
   * @param suffix
   */
  validateEmail(email: string, suffix?: string): boolean{
    let regExpEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    return !!suffix ? regExpEmail.test(String(email).toLowerCase()) && email.includes(suffix) :
      regExpEmail.test(String(email).toLowerCase());
  }
}
