import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AvatarGeneratorService {
  private readonly COLORS = ['#c8a84b','#3b82f6','#ef4444','#22c55e','#a855f7','#f59e0b','#06b6d4','#ec4899','#84cc16','#f97316','#6366f1','#14b8a6','#e11d48','#0ea5e9','#8b5cf6'];

  generateInitialsAvatar(name: string, size = 128): string {
    const initials = name.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase();
    const color = this.COLORS[Math.abs(this.hash(name)) % this.COLORS.length];
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size*0.15}" fill="${color}"/><text x="50%" y="50%" dy=".1em" fill="white" font-family="Arial" font-size="${size*0.4}" font-weight="bold" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`)}`;
  }

  generateGeometricAvatar(name: string, size = 128): string {
    const h = this.hash(name);
    const shapes: string[] = [];
    const cs = size / 4;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const fill = this.COLORS[Math.abs((h >> (i*4+j)) * 7) % this.COLORS.length];
      shapes.push(`<rect x="${j*cs}" y="${i*cs}" width="${cs}" height="${cs}" fill="${fill}" opacity="${((h>>(i*4+j))&1)?0.9:0.5}"/>`);
    }
    return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size*0.15}" fill="#1e293b"/>${shapes.join('')}</svg>`)}`;
  }

  private hash(s: string): number { let h=0; for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;} return h; }
}
