import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../../services/chat';
import { MetricsService, MetricEvent } from '../../../services/metrics'; // Certifique-se de importar MetricEvent
import { ChatFlow, ChatOption } from '../../../modules/chat.models';
import { AddCardComponent } from '../../add-card/add-card';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';

// Interface auxiliar para facilitar a edição visual
interface EditableCard {
  id: string;
  text: string;
  options: ChatOption[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, AddCardComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  activeTab: 'dashboard' | 'editor' = 'dashboard';
  isMobileMenuOpen = false;


  isModalOpen = false;

  cards: EditableCard[] = [];
  isLoading = false;


  topInterests: { name: string, value: number }[] = [];
  totalInteractions = 0;
  totalVisits = 0;
  conversionRate = '0%';

  constructor(
    private chatService: ChatService,
    private metricsService: MetricsService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadFlow();
    this.loadMetrics();
  }


  loadFlow() {
    this.isLoading = true;
    this.chatService.getFlow().subscribe({
      next: (data) => {
        this.cards = Object.keys(data).map(key => ({
          id: key, text: data[key].text, options: data[key].options || []
        }));
        this.isLoading = false;
      },
      error: () => this.isLoading = false
    });
  }

  loadMetrics() {
    this.metricsService.getAllMetrics().subscribe(data => {
      this.totalInteractions = data.length;
      this.totalVisits = data.filter(m => m.type === 'visit').length;
      const donationClicks = data.filter(m => m.type === 'option_click' &&
        (m.label.toLowerCase().includes('pix') || m.label.toLowerCase().includes('doar'))).length;

      if (this.totalVisits > 0) {
        this.conversionRate = ((donationClicks / this.totalVisits) * 100).toFixed(1) + '%';
      }
      const counts: { [key: string]: number } = {};
      data.filter(m => m.type === 'option_click').forEach(m => {
        counts[m.label] = (counts[m.label] || 0) + 1;
      });
      this.topInterests = Object.entries(counts)
        .map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    });
  }
  toggleMobileMenu() { this.isMobileMenuOpen = !this.isMobileMenuOpen; }

  getCardIds(): string[] {
    return this.cards.map(c => c.id);
  }

  handleNewCard(newId: string) {
    this.cards.push({ id: newId, text: 'Nova mensagem...', options: [] });
    this.isModalOpen = false; 


    setTimeout(() => {
      const wrapper = document.querySelector('.cards-wrapper');
      if (wrapper) wrapper.scrollTop = wrapper.scrollHeight;
    }, 100);
  }

  removeCard(index: number) {
    if (confirm('Apagar este card?')) this.cards.splice(index, 1);
  }
  addOption(card: EditableCard) {
    card.options.push({ label: 'Novo Botão', nextStep: 'start' });
  }
  removeOption(card: EditableCard, index: number) {
    card.options.splice(index, 1);
  }
  save() {
    this.isLoading = true;
    const flowToSave: ChatFlow = {};
    this.cards.forEach(card => {
      if (!card.id) return;
      const cleanOptions = card.options.map(opt => {
        const newOpt: ChatOption = { label: opt.label };
        const valorDigitado = String(opt.nextStep || "").trim();
        if (valorDigitado.startsWith('http')) {
          newOpt.action = valorDigitado.includes('wa.me') ? 'whatsapp' : 'url';
          newOpt.payload = valorDigitado;
        } else {
          newOpt.nextStep = valorDigitado;
        }
        return newOpt;
      });
      flowToSave[card.id] = { text: card.text, options: cleanOptions };
    });

    this.chatService.saveFlow(flowToSave).subscribe({
      next: () => {
        Swal.fire({
          title: 'Sucesso!',
          text: 'As alterações foram salvas !.',
          icon: 'success',
          confirmButtonText: 'Ótimo',
          confirmButtonColor: '#DA577C' 
        });
      },
      error: () => {
        Swal.fire({
          title: 'Ops!',
          text: 'Ocorreu um erro ao salvar as atualizações.',
          icon: 'warning',
          confirmButtonText: 'Ótimo',
          confirmButtonColor: '#DA577C' 
        }); this.isLoading = false;
      }
    });
  }
  goHome() { this.router.navigate(['/']); }
}