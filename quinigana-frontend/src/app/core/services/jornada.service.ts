import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';
import { Jornada, JornadaWithMatches, CreateJornadaDto, SubmitResultsDto } from '../models/jornada.model';

@Injectable({ providedIn: 'root' })
export class JornadaService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getAll(): Observable<ApiResponse<Jornada[]>> {
    return this.http.get<ApiResponse<Jornada[]>>(`${this.apiUrl}/jornadas`);
  }

  getActive(): Observable<ApiResponse<Jornada | null>> {
    return this.http.get<ApiResponse<Jornada | null>>(`${this.apiUrl}/jornadas/active`);
  }

  getOpenJornadas(): Observable<ApiResponse<Jornada[]>> {
    return this.http.get<ApiResponse<Jornada[]>>(`${this.apiUrl}/jornadas?status=open`);
  }

  getById(id: number): Observable<ApiResponse<JornadaWithMatches>> {
    return this.http.get<ApiResponse<JornadaWithMatches>>(`${this.apiUrl}/jornadas/${id}`);
  }

  // Admin
  create(data: CreateJornadaDto): Observable<ApiResponse<JornadaWithMatches>> {
    return this.http.post<ApiResponse<JornadaWithMatches>>(`${this.apiUrl}/jornadas`, data);
  }

  updateStatus(id: number, status: string): Observable<ApiResponse<Jornada>> {
    return this.http.patch<ApiResponse<Jornada>>(`${this.apiUrl}/jornadas/${id}`, { status });
  }

  submitResults(id: number, data: SubmitResultsDto): Observable<ApiResponse<JornadaWithMatches>> {
    return this.http.post<ApiResponse<JornadaWithMatches>>(`${this.apiUrl}/jornadas/${id}/results`, data);
  }

  delete(id: number): Observable<ApiResponse<{ message: string }>> {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.apiUrl}/jornadas/${id}`);
  }
}
