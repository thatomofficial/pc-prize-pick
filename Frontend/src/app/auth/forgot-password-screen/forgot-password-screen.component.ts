import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../_shared/services/auth.service';

type Status = 'idle' | 'submitting' | 'sent';

interface ForgotPasswordForm {
  email: FormControl<string>;
}

@Component({
  selector: 'app-forgot-password-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-screen.component.html',
  styleUrl: './forgot-password-screen.component.scss',
})
export class ForgotPasswordScreenComponent {
  private readonly auth = inject(AuthService);

  protected readonly form = new FormGroup<ForgotPasswordForm>({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });

  protected readonly status = signal<Status>('idle');
  protected readonly submittedEmail = signal<string>('');

  protected showError(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  protected errorMessage(): string {
    const control = this.form.controls.email;
    if (control.hasError('required')) return 'Email is required.';
    if (control.hasError('email')) return 'Enter a valid email address.';
    return 'Invalid value.';
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email } = this.form.getRawValue();
    this.status.set('submitting');
    this.form.disable({ emitEvent: false });

    await this.auth.requestPasswordReset(email);

    this.submittedEmail.set(email);
    this.status.set('sent');
  }

  protected reset(): void {
    this.form.enable({ emitEvent: false });
    this.form.reset();
    this.submittedEmail.set('');
    this.status.set('idle');
  }
}