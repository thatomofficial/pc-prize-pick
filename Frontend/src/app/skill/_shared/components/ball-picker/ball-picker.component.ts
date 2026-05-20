import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

export interface PickerCoordinate {
  /** Pixel x in the image's natural coordinate space. */
  x: number;
  /** Pixel y in the image's natural coordinate space. */
  y: number;
  /** Percent from the left of the image (0–100). */
  xPct: number;
  /** Percent from the top of the image (0–100). */
  yPct: number;
}

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

@Component({
  selector: 'app-ball-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ball-picker.component.html',
  styleUrl: './ball-picker.component.scss',
})
export class BallPickerComponent {
  readonly imageUrl = input.required<string>();
  readonly imageAlt = input<string>('Spot the ball challenge image');
  readonly locked = input<boolean>(false);

  readonly submit = output<PickerCoordinate>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly naturalSize = signal<{ width: number; height: number } | null>(null);

  protected readonly placed = signal<PickerCoordinate | null>(null);

  protected readonly hasImage = computed(() => this.naturalSize() !== null);

  protected onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;
    this.naturalSize.set({ width: img.naturalWidth, height: img.naturalHeight });
  }

  protected onSurfaceClick(event: MouseEvent): void {
    if (this.locked()) return;
    const size = this.naturalSize();
    if (!size) return;

    const figure = event.currentTarget as HTMLElement;
    const rect = figure.getBoundingClientRect();
    const xPct = clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100);
    const yPct = clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100);
    this.placeAtPct(xPct, yPct);

    figure.focus();
  }

  protected onKey(event: KeyboardEvent): void {
    if (this.locked()) return;
    const current = this.placed();
    if (!current) return;

    const step = event.shiftKey ? 10 : 1;
    let dx = 0;
    let dy = 0;
    switch (event.key) {
      case 'ArrowLeft':
        dx = -step;
        break;
      case 'ArrowRight':
        dx = step;
        break;
      case 'ArrowUp':
        dy = -step;
        break;
      case 'ArrowDown':
        dy = step;
        break;
      case 'Enter':
        event.preventDefault();
        this.onSubmit();
        return;
      default:
        return;
    }

    event.preventDefault();
    const size = this.naturalSize();
    if (!size) return;
    const nextX = clamp(current.x + dx, 0, size.width - 1);
    const nextY = clamp(current.y + dy, 0, size.height - 1);
    this.placeAtPixel(nextX, nextY);
  }

  protected onSubmit(): void {
    const coord = this.placed();
    if (!coord || this.locked()) return;
    this.submit.emit(coord);
  }

  private placeAtPct(xPct: number, yPct: number): void {
    const size = this.naturalSize();
    if (!size) return;
    const x = Math.round((xPct / 100) * (size.width - 1));
    const y = Math.round((yPct / 100) * (size.height - 1));
    this.placed.set({ x, y, xPct, yPct });
  }

  private placeAtPixel(x: number, y: number): void {
    const size = this.naturalSize();
    if (!size) return;
    const xPct = (x / (size.width - 1)) * 100;
    const yPct = (y / (size.height - 1)) * 100;
    this.placed.set({ x, y, xPct, yPct });
  }
}
