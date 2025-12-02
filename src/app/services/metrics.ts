import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MetricEvent {
  type: 'visit' | 'option_click';
  label: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private storageKey = 'ong_metrics';
  private metrics: MetricEvent[] = [];
  private apiUrl = 'https://script.google.com/macros/s/AKfycbzPFxF5AWL7hhaMx9_6SuVTqVs0UvyiomGbM9HwSPAcLJJSW02XN3TJ1eLZtagMUPwn/exec';
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.storageKey);
      this.metrics = saved ? JSON.parse(saved) : [];
    }
  }

  logEvent(type: 'visit' | 'option_click', label: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });

    const payload = { type, label };

    this.http.post(
      `${this.apiUrl}?action=logMetric`,
      JSON.stringify(payload),
      { headers }
    ).subscribe({
      next: () => console.log('Métrica enviada:', label),
      error: (err) => console.warn('Erro ao enviar métrica (pode ser CORS falso positivo):', err)
    });
  }
  getAllMetrics(): Observable<MetricEvent[]> {
    return this.http.get<MetricEvent[]>(`${this.apiUrl}?action=getMetrics`);
  }
  getTopInterests() {
    const counts: { [key: string]: number } = {};

    this.metrics
      .filter(m => m.type === 'option_click')
      .forEach(m => {
        counts[m.label] = (counts[m.label] || 0) + 1;
      });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  getTotalInteractions() {
    return this.metrics.length;
  }

  private save() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.metrics));
  }
}