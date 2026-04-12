import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AvatarGeneratorService } from '../../../core/services/avatar-generator.service';

export interface AvatarPickerData {
  userName: string;
}

export interface AvatarPickerResult {
  file: File;
}

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatTabsModule, MatProgressSpinnerModule],
  template: `
    <div class="avatar-picker">
      <h2 class="picker-title">Generar Avatar</h2>
      <p class="picker-subtitle">Elige un estilo para tu avatar</p>

      <mat-tab-group (selectedIndexChange)="onTabChange($event)" animationDuration="200ms">
        <mat-tab label="Iniciales">
          <div class="preview-area">
            <img [src]="initialsPreview()" alt="Initials avatar" class="avatar-preview" />
          </div>
        </mat-tab>
        <mat-tab label="Geometrico">
          <div class="preview-area">
            <img [src]="geometricPreview()" alt="Geometric avatar" class="avatar-preview" />
          </div>
        </mat-tab>
        <mat-tab label="Gradiente">
          <div class="preview-area">
            <img [src]="gradientPreview()" alt="Gradient avatar" class="avatar-preview" />
          </div>
        </mat-tab>
      </mat-tab-group>

      <div class="picker-actions">
        <button mat-stroked-button (click)="onCancel()">Cancelar</button>
        <button mat-flat-button color="primary" (click)="onUseAvatar()" [disabled]="isConverting()">
          @if (isConverting()) {
            <mat-spinner diameter="20" class="btn-spinner"></mat-spinner>
          }
          {{ isConverting() ? 'Procesando...' : 'Usar este avatar' }}
        </button>
      </div>

      <div class="upload-divider">
        <span>o sube una foto</span>
      </div>

      <button mat-stroked-button class="upload-btn" (click)="fileInput.click()">
        <mat-icon>upload</mat-icon>
        Subir imagen
      </button>
      <input #fileInput type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="onFileSelected($event)" />
    </div>
  `,
  styles: [`
    .avatar-picker {
      padding: 1.5rem;
      text-align: center;
      min-width: 320px;
      max-width: 400px;
    }

    .picker-title {
      margin: 0 0 0.25rem;
      color: var(--text-primary, #1e293b);
      font-size: 1.25rem;
      font-weight: 700;
    }

    .picker-subtitle {
      margin: 0 0 1.25rem;
      color: var(--text-muted, #64748b);
      font-size: 0.85rem;
    }

    .preview-area {
      display: flex;
      justify-content: center;
      padding: 1.5rem 0;
    }

    .avatar-preview {
      width: 128px;
      height: 128px;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .picker-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-top: 1rem;

      button {
        min-width: 120px;
      }
    }

    .btn-spinner {
      display: inline-block;
      margin-right: 8px;

      ::ng-deep circle {
        stroke: white;
      }
    }

    .upload-divider {
      display: flex;
      align-items: center;
      margin: 1.25rem 0;
      color: var(--text-muted, #64748b);
      font-size: 0.8rem;

      &::before,
      &::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid var(--divider-color, #334155);
      }

      span {
        padding: 0 0.75rem;
      }
    }

    .upload-btn {
      width: 100%;
    }

    ::ng-deep .mat-mdc-tab-group {
      .mat-mdc-tab-labels {
        justify-content: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarPickerComponent {
  private dialogRef = inject(MatDialogRef<AvatarPickerComponent>);
  private data: AvatarPickerData = inject(MAT_DIALOG_DATA);
  private avatarService = inject(AvatarGeneratorService);

  selectedTab = signal(0);
  isConverting = signal(false);

  initialsPreview = computed(() =>
    this.avatarService.generateInitialsAvatar(this.data.userName, 128)
  );

  geometricPreview = computed(() =>
    this.avatarService.generateGeometricAvatar(this.data.userName, 128)
  );

  gradientPreview = computed(() =>
    this.avatarService.generateGradientAvatar(this.data.userName, 128)
  );

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  async onUseAvatar(): Promise<void> {
    this.isConverting.set(true);
    try {
      const styles = ['initials', 'geometric', 'gradient'] as const;
      const style = styles[this.selectedTab()];
      const dataUrl = this.avatarService.generateAvatar(style, this.data.userName, 128);
      const file = await this.avatarService.svgToFile(dataUrl, `avatar-${style}.png`);
      this.dialogRef.close({ file } as AvatarPickerResult);
    } catch {
      this.isConverting.set(false);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return;
    this.dialogRef.close({ file } as AvatarPickerResult);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }
}
