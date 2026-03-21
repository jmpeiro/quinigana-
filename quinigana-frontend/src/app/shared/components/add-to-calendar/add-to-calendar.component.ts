import { Component, Input } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-add-to-calendar',
  standalone: true,
  imports: [MatMenuModule, MatButtonModule, MatIconModule],
  template: `
    <button mat-stroked-button [matMenuTriggerFor]="calMenu" class="cal-btn">
      <mat-icon>event</mat-icon> Recordatorio
    </button>
    <mat-menu #calMenu="matMenu">
      <button mat-menu-item (click)="addToGoogle()"><mat-icon>event</mat-icon> Google Calendar</button>
      <button mat-menu-item (click)="downloadIcs()"><mat-icon>download</mat-icon> Descargar .ics</button>
    </mat-menu>
  `,
  styles: [`.cal-btn { font-size: 0.8rem; height: 36px; }`]
})
export class AddToCalendarComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() startDate!: Date;

  addToGoogle(): void {
    const start = this.fmt(this.startDate);
    const end = this.fmt(new Date(this.startDate.getTime() + 3600000));
    const params = new URLSearchParams({ action: 'TEMPLATE', text: this.title, details: this.description, dates: `${start}/${end}` });
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank');
  }

  downloadIcs(): void {
    const start = this.fmt(this.startDate);
    const end = this.fmt(new Date(this.startDate.getTime() + 3600000));
    const ics = ['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${this.title}`,`DESCRIPTION:${this.description.replace(/\n/g,'\n')}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quinigana.ics'; a.click();
  }

  private fmt(d: Date): string { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
}
