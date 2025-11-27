import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MetricEvent {
  type: 'visit' | 'option_click';
  label: string; // Ex: 'Quero Doar', 'Voluntário'
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private storageKey = 'ong_metrics';
  private metrics: MetricEvent[] = [];
  private apiUrl = 'https://script.google.com/macros/s/AKfycbzD5ft5Fd3gtyL7PcD9lOW0kpmubLdS9TqEv1N1maIjcna7_NHnVxJD_qiO2FPoMI3U/exec';
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private http: HttpClient) {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.storageKey);
      this.metrics = saved ? JSON.parse(saved) : [];
    }
  }

  // ENVIA O DADO PARA A PLANILHA
  logEvent(type: 'visit' | 'option_click', label: string) {
    // TRUQUE ANTI-CORS: 
    // O Google Apps Script exige 'text/plain' para não bloquear requisições de outros domínios.
    const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });

    const payload = { type, label };

    // Dispara o POST
    this.http.post(
      `${this.apiUrl}?action=logMetric`,
      JSON.stringify(payload), // Envia como string JSON
      { headers }
    ).subscribe({
      next: () => console.log('Métrica enviada:', label),
      error: (err) => console.warn('Erro ao enviar métrica (pode ser CORS falso positivo):', err)
    });
  }
  getAllMetrics(): Observable<MetricEvent[]> {
    return this.http.get<MetricEvent[]>(`${this.apiUrl}?action=getMetrics`);
  }
  // Retorna contagem de cliques por opção (Para o Gráfico)
  getTopInterests() {
    const counts: { [key: string]: number } = {};

    this.metrics
      .filter(m => m.type === 'option_click')
      .forEach(m => {
        counts[m.label] = (counts[m.label] || 0) + 1;
      });

    // Transforma em array ordenado
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