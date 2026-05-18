import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal
} from '@angular/core';

interface CountdownSegments {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  totalMs: number;
}

const pad = (n: number): string => String(Math.max(0, Math.floor(n))).padStart(2, '0');

@Component({
  selector: 'app-countdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="countdown" [class.countdown--critical]="critical()">
      <span class="countdown__unit">
        <span class="countdown__value">{{ segments().days }}</span>
        <span class="countdown__label">d</span>
      </span>
      <span class="countdown__sep">:</span>
      <span class="countdown__unit">
        <span class="countdown__value">{{ segments().hours }}</span>
        <span class="countdown__label">h</span>
      </span>
      <span class="countdown__sep">:</span>
      <span class="countdown__unit">
        <span class="countdown__value">{{ segments().minutes }}</span>
        <span class="countdown__label">m</span>
      </span>
      <span class="countdown__sep">:</span>
      <span class="countdown__unit">
        <span class="countdown__value">{{ segments().seconds }}</span>
        <span class="countdown__label">s</span>
      </span>
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
    }

    .countdown {
      display: inline-flex;
      align-items: baseline;
      gap: 0.1ch;
      font-family: var(--font-mono);
      font-feature-settings: 'tnum' 1, 'zero' 1;
      font-variant-numeric: tabular-nums;
      color: var(--cream-100);

      &--critical {
        color: var(--signal);
      }

      &__unit {
        display: inline-flex;
        align-items: baseline;
      }

      &__value {
        font-size: inherit;
        letter-spacing: -0.02em;
      }

      &__label {
        font-size: 0.55em;
        color: var(--cream-300);
        margin-left: 0.15ch;
        text-transform: lowercase;
      }

      &__sep {
        color: var(--cream-400);
        margin: 0 0.15ch;
      }

      &--critical &__label,
      &--critical &__sep {
        color: var(--signal);
        opacity: 0.7;
      }
    }
  `
})
export class CountdownComponent {
  readonly target = input.required<string>();

  private readonly now = signal(Date.now());

  protected readonly segments = computed<CountdownSegments>(() => {
    const target = new Date(this.target()).getTime();
    const diff = Math.max(0, target - this.now());
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1000);
    return {
      days: pad(days),
      hours: pad(hours),
      minutes: pad(minutes),
      seconds: pad(seconds),
      totalMs: diff
    };
  });

  protected readonly critical = computed(() => this.segments().totalMs <= 24 * 3_600_000);

  constructor() {
    const handle = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(handle));
  }
}
