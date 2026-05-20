import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, InvalidCredentialsError } from '../../_shared/services/auth.service';

type Status = 'idle' | 'submitting' | 'success';

interface SignInForm {
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-sign-in-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './sign-in-screen.component.html',
  styleUrl: './sign-in-screen.component.scss',
})
export class SignInScreenComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = new FormGroup<SignInForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(6)],
    }),
  });

  protected readonly status = signal<Status>('idle');
  protected readonly submitError = signal<string | null>(null);
  protected readonly passwordVisible = signal<boolean>(false);

  protected togglePasswordVisible(): void {
    this.passwordVisible.update((v) => !v);
  }

  protected showError(field: keyof SignInForm): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.dirty || control.touched);
  }

  protected errorFor(field: keyof SignInForm): string {
    const control = this.form.controls[field];
    if (control.hasError('required')) {
      return field === 'email' ? 'Email is required.' : 'Password is required.';
    }
    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }
    if (control.hasError('minlength')) {
      return 'At least 6 characters.';
    }
    return 'Invalid value.';
  }

  protected async onSubmit(): Promise<void> {
    this.submitError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.status.set('submitting');
    this.form.disable({ emitEvent: false });

    try {
      await this.auth.signIn(email, password);
      this.status.set('success');
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
      await this.router.navigateByUrl(returnUrl);
    } catch (error) {
      const message =
        error instanceof InvalidCredentialsError
          ? error.message
          : 'Something went wrong. Try again.';
      this.submitError.set(message);
      this.status.set('idle');
      this.form.enable({ emitEvent: false });
    }
  }
}
