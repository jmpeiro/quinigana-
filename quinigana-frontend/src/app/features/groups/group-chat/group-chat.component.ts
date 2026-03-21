import { Component, Input, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-group-chat',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="chat-container">
      <div class="chat-header"><mat-icon>chat</mat-icon><h2>Chat del Grupo</h2></div>
      <div class="chat-messages" #messagesContainer>
        @if (hasMore()) { <button mat-button class="load-more" (click)="loadMore()">Cargar anteriores</button> }
        @for (msg of messages(); track msg.id) {
          <div class="message" [class.own]="msg.user_id === currentUserId">
            <div class="msg-avatar">@if(msg.avatar_url){<img [src]="msg.avatar_url"/>}@else{<mat-icon>person</mat-icon>}</div>
            <div class="msg-content"><div class="msg-header"><span class="msg-name">{{msg.first_name}}</span><span class="msg-time">{{formatTime(msg.created_at)}}</span></div><div class="msg-text">{{msg.message}}</div></div>
          </div>
        } @empty { @if(!loading()){<div class="empty-chat"><mat-icon>forum</mat-icon><p>No hay mensajes aun</p></div>} }
      </div>
      <div class="chat-input">
        <input [(ngModel)]="newMessage" placeholder="Escribe un mensaje..." (keyup.enter)="send()" [disabled]="sending()" maxlength="500"/>
        <button mat-icon-button (click)="send()" [disabled]="!newMessage.trim()||sending()"><mat-icon>send</mat-icon></button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container{display:flex;flex-direction:column;height:500px;background:var(--bg-card,#fff);border-radius:16px;border:1px solid var(--border-color,#e2e8f0);overflow:hidden}
    .chat-header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border-color,#e2e8f0)} .chat-header mat-icon{color:#c8a84b} .chat-header h2{margin:0;font-size:1rem;color:var(--text-primary,#1e293b)}
    .chat-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
    .empty-chat{display:flex;flex-direction:column;align-items:center;padding:2rem;color:var(--text-muted,#94a3b8);gap:8px} .empty-chat mat-icon{font-size:40px;width:40px;height:40px;opacity:0.4}
    .load-more{align-self:center;color:#c8a84b;font-size:0.8rem}
    .message{display:flex;gap:10px} .message.own{flex-direction:row-reverse} .message.own .msg-content{align-items:flex-end} .message.own .msg-text{background:rgba(200,168,75,0.1);border-color:rgba(200,168,75,0.2)}
    .msg-avatar{width:32px;height:32px;border-radius:50%;overflow:hidden;flex-shrink:0;background:var(--bg-secondary,#f1f5f9);display:flex;align-items:center;justify-content:center} .msg-avatar img{width:100%;height:100%;object-fit:cover} .msg-avatar mat-icon{font-size:18px;color:var(--text-muted,#94a3b8)}
    .msg-content{display:flex;flex-direction:column;gap:2px;max-width:75%}
    .msg-header{display:flex;gap:8px;align-items:baseline} .msg-name{font-size:0.75rem;font-weight:600;color:var(--text-primary,#1e293b)} .msg-time{font-size:0.65rem;color:var(--text-muted,#94a3b8)}
    .msg-text{font-size:0.85rem;color:var(--text-primary,#1e293b);background:var(--bg-secondary,#f8f9fb);border:1px solid var(--border-color,#e2e8f0);border-radius:12px;padding:8px 12px;line-height:1.4;word-break:break-word}
    .chat-input{display:flex;align-items:center;gap:8px;padding:12px 16px;border-top:1px solid var(--border-color,#e2e8f0)} .chat-input input{flex:1;border:1px solid var(--border-color,#e2e8f0);border-radius:20px;padding:8px 16px;font-size:0.85rem;background:var(--bg-secondary,#f8f9fb);color:var(--text-primary,#1e293b);outline:none} .chat-input input:focus{border-color:#c8a84b} .chat-input button mat-icon{color:#c8a84b}
  `]
})
export class GroupChatComponent implements OnInit {
  @Input() groupId!: number;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  messages = signal<any[]>([]);
  loading = signal(true);
  sending = signal(false);
  hasMore = signal(false);
  newMessage = '';
  currentUserId = 0;

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser()?.id ?? 0;
    this.http.get<any>(`${environment.apiUrl}/groups/${this.groupId}/chat/messages`, { withCredentials: true }).subscribe({
      next: res => { if(res.success){this.messages.set(res.data||[]);this.hasMore.set((res.data||[]).length>=50);} this.loading.set(false); setTimeout(()=>this.scrollBottom(),100); },
      error: () => this.loading.set(false)
    });
  }

  loadMore(): void {
    const msgs = this.messages(); if(!msgs.length) return;
    this.http.get<any>(`${environment.apiUrl}/groups/${this.groupId}/chat/messages?before=${msgs[0].id}`, { withCredentials: true }).subscribe({
      next: res => { if(res.success&&res.data?.length){this.messages.update(c=>[...res.data,...c]);this.hasMore.set(res.data.length>=50);}else{this.hasMore.set(false);} }
    });
  }

  send(): void {
    const msg = this.newMessage.trim(); if(!msg) return;
    this.sending.set(true);
    this.http.post<any>(`${environment.apiUrl}/groups/${this.groupId}/chat/messages`, { message: msg }, { withCredentials: true }).subscribe({
      next: res => { if(res.success&&res.data){this.messages.update(m=>[...m,res.data]);this.newMessage='';setTimeout(()=>this.scrollBottom(),50);} this.sending.set(false); },
      error: () => this.sending.set(false)
    });
  }

  formatTime(d: string): string {
    const diff = Date.now() - new Date(d).getTime();
    if(diff<60000) return 'Ahora';
    if(diff<3600000) return Math.floor(diff/60000)+'m';
    if(diff<86400000) return Math.floor(diff/3600000)+'h';
    return new Date(d).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
  }

  private scrollBottom(): void { try{this.messagesContainer.nativeElement.scrollTop=this.messagesContainer.nativeElement.scrollHeight;}catch{} }
}
