import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogRefSpy: jest.Mocked<MatDialogRef<ConfirmDialogComponent>>;

  const defaultData: ConfirmDialogData = {
    title: 'Test Title',
    message: 'Test message',
    confirmText: 'Yes',
    cancelText: 'No',
    confirmColor: 'warn',
    icon: 'delete',
  };

  beforeEach(async () => {
    dialogRefSpy = { close: jest.fn() } as any;

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: defaultData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title and message', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.dialog-title')?.textContent).toContain('Test Title');
    expect(el.querySelector('.dialog-message')?.textContent).toContain('Test message');
  });

  it('should display custom button texts', () => {
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('button');
    expect(buttons[0].textContent).toContain('No');
    expect(buttons[1].textContent).toContain('Yes');
  });

  it('should display icon when provided', () => {
    const el = fixture.nativeElement as HTMLElement;
    const icon = el.querySelector('.dialog-icon mat-icon');
    expect(icon?.textContent?.trim()).toBe('delete');
  });

  it('should close with false when cancel clicked', () => {
    const el = fixture.nativeElement as HTMLElement;
    const cancelBtn = el.querySelectorAll('button')[0] as HTMLButtonElement;
    cancelBtn.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(false);
  });

  it('should close with true when confirm clicked', () => {
    const el = fixture.nativeElement as HTMLElement;
    const confirmBtn = el.querySelectorAll('button')[1] as HTMLButtonElement;
    confirmBtn.click();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should use default button texts when not provided', async () => {
    const minimalData: ConfirmDialogData = { title: 'Title', message: 'Msg' };

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: minimalData },
      ],
    }).compileComponents();

    const fix = TestBed.createComponent(ConfirmDialogComponent);
    fix.detectChanges();

    const el = fix.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('button');
    expect(buttons[0].textContent).toContain('Cancelar');
    expect(buttons[1].textContent).toContain('Confirmar');
  });
});
