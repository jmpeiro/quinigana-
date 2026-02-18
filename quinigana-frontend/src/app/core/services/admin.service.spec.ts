import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should fetch ops metrics with default limit', () => {
    service.getOpsMetrics().subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.method === 'GET' && r.url.includes('/admin/ops') && r.urlWithParams.includes('limit=10'));
    req.flush({ success: true, data: { totals: {}, topRoutes: [], recentErrors: [] } });
  });

  it('should fetch football-data matches with provided params', () => {
    service.getFootballDataMatches('PD', 21).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne((r) =>
      r.method === 'GET' &&
      r.url.includes('/admin/football-data/matches') &&
      r.urlWithParams.includes('competition=PD') &&
      r.urlWithParams.includes('matchday=21')
    );
    req.flush({ success: true, data: [] });
  });
});
