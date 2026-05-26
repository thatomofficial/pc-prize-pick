import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';

interface WaveSegments {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  totalMs: number;
}

const pad = (n: number): string => String(Math.max(0, Math.floor(n))).padStart(2, '0');

@Component({
  selector: 'app-wave-clock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './wave-clock.component.html',
  styleUrl: './wave-clock.component.scss',
})
export class WaveClockComponent {
  readonly closesAt = input.required<string>();
  readonly waveCode = input.required<string>();

  private readonly now = signal(Date.now());

  protected readonly segments = computed<WaveSegments>(() => {
    const target = new Date(this.closesAt()).getTime();
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
      totalMs: diff,
    };
  });

  protected readonly critical = computed(() => this.segments().totalMs <= 72 * 3_600_000);

  constructor() {
    const handle = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(handle));
  }
}