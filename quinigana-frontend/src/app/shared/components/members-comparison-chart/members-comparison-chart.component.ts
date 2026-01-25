import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

export interface MemberRankingData {
  userId: number;
  userName: string;
  avatarUrl: string | null;
  totalPoints: number;
  correct1x2: number;
  correctPleno: number;
  jornadasPlayed: number;
  isCurrentUser?: boolean;
}

@Component({
  selector: 'app-members-comparison-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  template: `
    <div class="chart-container">
      @if (chartOptions(); as opts) {
        <apx-chart
          [series]="opts.series"
          [chart]="opts.chart"
          [xaxis]="opts.xaxis"
          [yaxis]="opts.yaxis"
          [plotOptions]="opts.plotOptions"
          [colors]="opts.colors"
          [grid]="opts.grid"
          [dataLabels]="opts.dataLabels"
          [tooltip]="opts.tooltip"
          [legend]="opts.legend"
        />
      } @else {
        <div class="empty-state">
          <span>Sin datos de comparativa</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      min-height: 300px;
    }
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--text-muted, #94a3b8);
      font-size: 0.85rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersComparisonChartComponent {
  @Input() set data(value: MemberRankingData[]) {
    this._data.set(value || []);
  }
  @Input() currentUserId: number | null = null;
  @Input() height = 300;
  @Input() maxMembers = 10;

  private _data = signal<MemberRankingData[]>([]);

  chartOptions = computed(() => {
    let data = this._data();
    if (!data.length) return null;

    // Sort by total points and limit
    data = [...data]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, this.maxMembers);

    const colors = data.map(d =>
      d.userId === this.currentUserId ? '#c8a84b' : '#64748b'
    );

    return {
      series: [
        { name: 'Puntos', data: data.map(d => d.totalPoints) },
        { name: 'Aciertos 1X2', data: data.map(d => d.correct1x2) },
        { name: 'Plenos', data: data.map(d => d.correctPleno) },
      ],
      chart: {
        type: 'bar' as const,
        height: Math.max(this.height, data.length * 40),
        toolbar: { show: false },
        background: 'transparent',
        foreColor: 'var(--text-secondary, #64748b)',
        fontFamily: 'inherit',
        stacked: false,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '70%',
          borderRadius: 4,
          dataLabels: { position: 'top' },
        },
      },
      xaxis: {
        categories: data.map(d => d.userName),
        labels: { style: { fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 600,
            colors: data.map(d => d.userId === this.currentUserId ? '#c8a84b' : 'var(--text-primary, #1e293b)'),
          },
        },
      },
      colors: ['#c8a84b', '#3b82f6', '#8b5cf6'],
      grid: {
        borderColor: 'var(--border-color, #e2e8f0)',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        theme: 'light' as const,
        shared: true,
        intersect: false,
        y: { formatter: (val: number) => `${val}` },
      },
      legend: {
        show: true,
        position: 'top' as const,
        horizontalAlign: 'center' as const,
        fontSize: '11px',
        markers: { size: 8, offsetX: -4 },
        itemMargin: { horizontal: 12 },
      },
    };
  });
}
