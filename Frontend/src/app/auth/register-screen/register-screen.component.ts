import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  AuthService,
  EmailAlreadyRegisteredError,
  InvalidCellPhoneError,
} from '../../_shared/services/auth.service';
import { isValidSaMobile, normaliseCellPhone } from '../../_shared/models/user.model';

type Status = 'idle' | 'submitting' | 'success';

interface RegisterForm {
  email: FormControl<string>;
  displayName: FormControl<string>;
  cellPhone: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
}

const matchPasswords = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) return null;
  return password === confirm ? null : { mismatch: true };
};

const saMobileValidator = (control: AbstractControl): ValidationErrors | null => {
  const raw = (control.value ?? '').toString();
  if (!raw) return null; // Required handles empties.
  return isValidSaMobile(normaliseCellPhone(raw)) ? null : { saMobile: true };
};

@Component({
  selector: 'app-register-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register-screen.component.html',
  styleUrl: './register-screen.component.scss',
})
export class RegisterScreenComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = new FormGroup<RegisterForm>(
    {
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(255)],
      }),
      displayName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
      }),
      cellPhone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, saMobileValidator],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchPasswords },
  );

  protected readonly status = signal<Status>('idle');
  protected readonly submitError = signal<string | null>(null);
  protected readonly passwordVisible = signal<boolean>(false);

  protected togglePasswordVisible(): void {
    this.passwordVisible.update((v) => !v);
  }

  protected showError(field: keyof RegisterForm): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  protected errorFor(field: keyof RegisterForm): string {
    const control = this.form.controls[field];
    if (control.hasError('required')) {
      switch (field) {
        case 'email':
          return 'Email is required.';
        case 'displayName':
          return 'Display name is required.';
        case 'cellPhone':
          return 'Cell phone is required.';
        case 'password':
          return 'Password is required.';
        case 'confirmPassword':
          return 'Please confirm your password.';
        default:
          return 'This field is required.';
      }
    }
    if (control.hasError('email')) return 'Enter a valid email address.';
    if (control.hasError('saMobile')) return 'Enter a valid SA mobile number (0XX… or +27XX…).';
    if (control.hasError('minlength')) {
      return field === 'displayName' ? 'At least 2 characters.' : 'At least 6 characters.';
    }
    if (control.hasError('maxlength')) return 'Too long.';
    return 'Invalid value.';
  }

  protected async onSubmit(): Promise<void> {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password, displayName, cellPhone } = this.form.getRawValue();
    this.status.set('submitting');
    this.form.disable({ emitEvent: false });

    try {
      await this.auth.signUp(email, password, displayName, cellPhone);
      this.status.set('success');
      await this.router.navigateByUrl('/account');
    } catch (error) {
      const message =
        error instanceof EmailAlreadyRegisteredError ||
        error instanceof InvalidCellPhoneError
          ? error.message
          : 'Something went wrong. Try again.';
      this.submitError.set(message);
      this.status.set('idle');
      this.form.enable({ emitEvent: false });
    }
  }
}