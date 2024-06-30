import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Injectable } from '@angular/core';
import {
  AsyncValidator,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

@Injectable({ providedIn: 'root' })
export class EmailTaken implements AsyncValidator {
  constructor(private auth: AngularFireAuth) {}

  validate = async (
    control: AbstractControl
  ): Promise<ValidationErrors | null> => {
    const response = await this.auth.fetchSignInMethodsForEmail(control.value);
    console.log(response);
    console.log(response.length == 0 ? { emailTaken: true } : null);
    return response.length ? { emailTaken: true } : null;
  };
}
