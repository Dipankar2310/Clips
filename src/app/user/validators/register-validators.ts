import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
export class RegisterValidators {
  static match(controlName: string, matcingControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const control = group.get(controlName);
      const matchingControl = group.get(matcingControlName);

      if (!control || !matchingControl) {
        return { controlNotFound: true };
      }
      const error =
        control.value === matchingControl.value ? null : { noMatch: true };

      matchingControl.setErrors(error);
      return error;
    };
  }
}
