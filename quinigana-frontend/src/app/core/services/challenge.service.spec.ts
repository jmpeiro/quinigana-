import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChallengeService } from './challenge.service';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ChallengeService],
    });
    service = TestBed.inject(ChallengeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('should call auto-generate weekly endpoint', () => {
    service.autoGenerateWeekly().subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data?.created).toBe(3);
    });

    const req = httpMock.expectOne((r) => r.method === 'POST' && r.url.includes('/challenges/auto-generate'));
    req.flush({
      success: true,
      data: {
        created: 3,
        skippedExisting: 1,
        skippedInsufficientMembers: 0,
        jornadasProcessed: 2,
      },
    });
  });

  it('should include limit when loading head to head', () => {
    service.getHeadToHead(77, 15).subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne((r) =>
      r.method === 'GET' &&
      r.url.includes('/challenges/head-to-head/77') &&
      r.urlWithParams.includes('limit=15')
    );
    req.flush({ success: true, data: { stats: {}, recent: [] } });
  });
});
