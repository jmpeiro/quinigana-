import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BottomNavComponent } from './bottom-nav.component';

describe('BottomNavComponent', () => {
  let component: BottomNavComponent;
  let fixture: ComponentFixture<BottomNavComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [BottomNavComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BottomNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 5 navigation items', () => {
    const el = fixture.nativeElement as HTMLElement;
    const navItems = el.querySelectorAll('.nav-item');
    expect(navItems.length).toBe(5);
  });

  it('should display correct labels', () => {
    const el = fixture.nativeElement as HTMLElement;
    const spans = el.querySelectorAll('.nav-item span');
    const labels = Array.from(spans).map(s => s.textContent?.trim());
    expect(labels).toEqual(['Inicio', 'Jornadas', 'Grupos', 'Stats', 'Perfil']);
  });

  it('should display correct icons', () => {
    const el = fixture.nativeElement as HTMLElement;
    const icons = el.querySelectorAll('.nav-item mat-icon');
    const iconNames = Array.from(icons).map(i => i.textContent?.trim());
    expect(iconNames).toEqual(['home', 'sports_soccer', 'group', 'bar_chart', 'person']);
  });

  it('should have routerLink attributes on all links', () => {
    const el = fixture.nativeElement as HTMLElement;
    const links = el.querySelectorAll('a.nav-item');
    expect(links.length).toBe(5);
  });
});
