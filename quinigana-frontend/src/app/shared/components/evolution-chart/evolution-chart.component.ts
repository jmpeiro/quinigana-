import { Component, Input, ChangeDetectionStrategy, computed, signal, effect } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexOptions } from 'apexcharts';

export interface EvolutionDataPoint {
  jornadaId: number;
  jornadaName: string;
  points: number;
  accuracy: number;
}

@Component({
  selector: 'app-evolution-chart',
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
          [fill]="opts.fill"
          [stroke]="opts.stroke"
          [colors]="opts.colors"
          [grid]="opts.grid"
          [dataLabels]="opts.dataLabels"
          [tooltip]="opts.tooltip"
          [markers]="opts.markers"
          [legend]="opts.legend"
        />
      } @else {
        <div class="empty-state">
          <span>Sin datos de evolución</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      min-height: 280px;
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
export class EvolutionChartComponent {
  @Input() set data(value: EvolutionDataPoint[]) {
    this._data.set(value || []);
  }
  @Input() height = 280;
  @Input() showAccuracy = true;

  private _data = signal<EvolutionDataPoint[]>([]);

  chartOptions = computed(() => {
    const data = this._data();
    if (!data.length) return null;

    const series: ApexOptions['series'] = [
      { name: 'Puntos', type: 'area', data: data.map(d => d.points) },
    ];

    if (this.showAccuracy) {
      series.push({ name: 'Precisión %', type: 'line', data: data.map(d => d.accuracy) });
    }

    return {
      series,
      chart: {
        type: 'line' as const,
        height: this.height,
        toolbar: { show: false },
        background: 'transparent',
        foreColor: 'var(--text-secondary, #64748b)',
        fontFamily: 'inherit',
        zoom: { enabled: false },
        animations: { enabled: true, easing: 'easeinout', speed: 600 },
      },
      xaxis: {
        categories: data.map(d => d.jornadaName.replace('Jornada ', 'J')),
        labels: { style: { fontSize: '10px' }, rotate: -45, rotateAlways: data.length > 8 },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: this.showAccuracy ? [
        {
          title: { text: 'Puntos', style: { fontSize: '11px', color: 'var(--text-muted)' } },
          labels: { style: { fontSize: '10px' } },
        },
        {
          opposite: true,
          title: { text: 'Precisión %', style: { fontSize: '11px', color: 'var(--text-muted)' } },
          labels: { style: { fontSize: '10px' }, formatter: (v: number) => `${v}%` },
          min: 0,
          max: 100,
        }
      ] : [{
        labels: { style: { fontSize: '10px' } },
      }],
      fill: {
        type: ['gradient', 'solid'],
        gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 95, 100] },
      },
      stroke: { curve: 'smooth' as const, width: [2.5, 2] },
      colors: ['#c8a84b', '#3b82f6'],
      grid: {
        borderColor: 'var(--border-color, #e2e8f0)',
        strokeDashArray: 4,
        padding: { left: 8, right: 8 },
      },
      dataLabels: { enabled: false },
      tooltip: {
        theme: 'light' as const,
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number, { seriesIndex }: { seriesIndex: number }) =>
            seriesIndex === 1 ? `${val}%` : `${val} pts`,
        },
      },
      markers: { size: [4, 3], hover: { sizeOffset: 2 } },
      legend: {
        show: this.showAccuracy,
        position: 'top' as const,
        horizontalAlign: 'right' as const,
        fontSize: '11px',
        markers: { size: 8, offsetX: -4 },
        itemMargin: { horizontal: 8 },
      },
    };
  });
}
