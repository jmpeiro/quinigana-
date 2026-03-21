import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="t-container">
      <div class="t-header"><h1>Torneos</h1><button mat-flat-button class="create-btn" (click)="createTournament()"><mat-icon>add</mat-icon>Nuevo Torneo</button></div>
      @if(loading()){<div class="loading"><mat-spinner diameter="36"></mat-spinner></div>}
      @else {
        @for(t of tournaments();track t.id){
          <div class="t-card" (click)="loadBracket(t.id)">
            <div class="t-top"><h3>{{t.name}}</h3><span class="badge" [class]="t.status">{{t.status}}</span></div>
            <div class="t-meta"><span><mat-icon>person</mat-icon>{{t.participant_count}}/{{t.bracket_size}}</span></div>
            @if(t.status==='registration'){<button mat-stroked-button class="join-btn" (click)="join(t.id);$event.stopPropagation()"><mat-icon>group_add</mat-icon>Inscribirse</button>}
          </div>
        }@empty{<div class="empty"><mat-icon>emoji_events</mat-icon><p>No hay torneos</p></div>}
        @if(bracket()){
          <h2 class="bracket-title">Bracket</h2>
          <div class="bracket-rounds">
            @for(r of rounds();track r){
              <div class="round"><div class="round-label">Ronda {{r}}</div>
                @for(m of matchesForRound(r);track m.id){
                  <div class="bm"><div class="bm-p">{{m.player1_name||'TBD'}}</div><div class="bm-s">{{m.player1_score??'-'}}-{{m.player2_score??'-'}}</div><div class="bm-p">{{m.player2_name||'TBD'}}</div></div>
                }
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .t-container{max-width:800px;margin:0 auto;padding:1.5rem}
    .t-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem} .t-header h1{font-size:1.4rem;color:var(--text-primary,#1e293b);margin:0}
    .create-btn{background:linear-gradient(135deg,#c8a84b,#dfc56a)!important;color:#1e293b!important;font-weight:600}
    .loading,.empty{display:flex;flex-direction:column;align-items:center;padding:3rem;color:var(--text-muted,#94a3b8);gap:8px} .empty mat-icon{font-size:48px;width:48px;height:48px;opacity:0.4}
    .t-card{background:var(--bg-card,#fff);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:1.25rem;margin-bottom:1rem;cursor:pointer;transition:border-color 0.2s} .t-card:hover{border-color:rgba(200,168,75,0.4)}
    .t-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px} .t-top h3{margin:0;font-size:1rem;color:var(--text-primary,#1e293b)}
    .badge{font-size:0.7rem;padding:3px 10px;border-radius:12px;font-weight:600;text-transform:uppercase} .badge.registration{background:rgba(59,130,246,0.1);color:#3b82f6} .badge.active{background:rgba(34,197,94,0.1);color:#22c55e} .badge.completed{background:rgba(148,163,184,0.1);color:#64748b}
    .t-meta{color:var(--text-muted,#94a3b8);font-size:0.8rem} .t-meta span{display:flex;align-items:center;gap:4px} .t-meta mat-icon{font-size:16px;width:16px;height:16px}
    .join-btn{margin-top:12px;color:#c8a84b;border-color:rgba(200,168,75,0.4)}
    .bracket-title{font-size:1.1rem;color:var(--text-primary,#1e293b);margin:2rem 0 1rem}
    .bracket-rounds{display:flex;gap:2rem;overflow-x:auto;padding-bottom:1rem}
    .round{min-width:180px;display:flex;flex-direction:column;gap:1rem} .round-label{font-size:0.75rem;font-weight:600;color:#c8a84b;text-transform:uppercase;text-align:center}
    .bm{background:var(--bg-secondary,#f8f9fb);border:1px solid var(--border-color,#e2e8f0);border-radius:10px;padding:10px;text-align:center}
    .bm-p{font-size:0.8rem;color:var(--text-primary,#1e293b);padding:4px 0} .bm-s{font-size:0.9rem;font-weight:700;padding:4px 0;border-top:1px dashed var(--border-color,#e2e8f0);border-bottom:1px dashed var(--border-color,#e2e8f0)}
  `]
})
export class TournamentsComponent implements OnInit {
  private http=inject(HttpClient);private route=inject(ActivatedRoute);private snackBar=inject(MatSnackBar);
  tournaments=signal<any[]>([]);bracket=signal<any[]|null>(null);loading=signal(true);groupId=0;

  ngOnInit(){this.groupId=parseInt(this.route.snapshot.params['id']||this.route.parent?.snapshot.params['id']||'0');if(this.groupId)this.load();}
  private load(){this.http.get<any>(`${environment.apiUrl}/tournaments/group/${this.groupId}`,{withCredentials:true}).subscribe({next:r=>{if(r.success)this.tournaments.set(r.data||[]);this.loading.set(false);},error:()=>this.loading.set(false)});}
  loadBracket(id:number){this.http.get<any>(`${environment.apiUrl}/tournaments/${id}/bracket`,{withCredentials:true}).subscribe({next:r=>{if(r.success)this.bracket.set(r.data?.matches||[]);}});}
  join(id:number){this.http.post<any>(`${environment.apiUrl}/tournaments/${id}/join`,{},{withCredentials:true}).subscribe({next:r=>{if(r.success){this.snackBar.open('Inscrito!','OK',{duration:3000});this.load();}},error:()=>this.snackBar.open('Error','OK',{duration:3000})});}
  createTournament(){const n=prompt('Nombre del torneo:');if(!n)return;this.http.post<any>(`${environment.apiUrl}/tournaments`,{group_id:this.groupId,name:n,bracket_size:8},{withCredentials:true}).subscribe({next:r=>{if(r.success){this.snackBar.open('Torneo creado!','OK',{duration:3000});this.load();}},error:()=>this.snackBar.open('Error','OK',{duration:3000})});}
  rounds():number[]{return[...new Set((this.bracket()||[]).map((m:any)=>m.round))].sort();}
  matchesForRound(r:number):any[]{return(this.bracket()||[]).filter((m:any)=>m.round===r);}
}
