import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(passwordField: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField);
    const confirm = group.get(confirmField);

    if (!password || !confirm) return null;

    if (password.value !== confirm.value) {
      confirm.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirm.hasError('passwordMismatch')) {
      confirm.setErrors(null);
    }
    return null;
  };
}

export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const errors: ValidationErrors = {};

    if (value.length < 8) errors['minLength'] = true;
    if (!/[A-Z]/.test(value)) errors['noUppercase'] = true;
    if (!/[a-z]/.test(value)) errors['noLowercase'] = true;
    if (!/\d/.test(value)) errors['noNumber'] = true;
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors['noSpecial'] = true;

    return Object.keys(errors).length ? errors : null;
  };
}
