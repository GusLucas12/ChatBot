import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService } from '../../../services/chat';
import { MetricsService, MetricEvent } from '../../../services/metrics'; // Certifique-se de importar MetricEvent
import { ChatFlow, ChatOption } from '../../../modules/chat.models';

// Interface auxiliar para facilitar a edição visual
interface EditableCard {
  id: string;
  text: string;
  options: ChatOption[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.scss'
})
export class AdminComponent implements OnInit {
  activeTab: 'dashboard' | 'editor' = 'dashboard';
  
  // Controle do Menu Mobile
  isMobileMenuOpen = false;

  // Lista editável de Cards
  cards: EditableCard[] = []; 
  
  isLoading = false;

  // Variáveis do Dashboard
  topInterests: { name: string, value: number }[] = [];
  totalInteractions = 0;
  totalVisits = 0;
  conversionRate = '0%';

  constructor(
    private chatService: ChatService,
    private metricsService: MetricsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFlow();
    this.loadMetrics();
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  // --- CARREGAMENTO DE DADOS ---

  loadFlow() {
    this.isLoading = true;
    this.chatService.getFlow().subscribe({
      next: (data) => {
        // Converte o Objeto JSON { start: {...}, doacao: {...} } 
        // para um Array de Cards [ {id:'start'...}, {id:'doacao'...} ]
        // Isso facilita exibir no HTML com *ngFor
        this.cards = Object.keys(data).map(key => ({
          id: key,
          text: data[key].text,
          options: data[key].options || []
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadMetrics() {
    this.metricsService.getAllMetrics().subscribe({
      next: (data: MetricEvent[]) => {
        // 1. Total Geral
        this.totalInteractions = data.length;

        // 2. Total de Visitas (Calculado filtrando o tipo 'visit')
        this.totalVisits = data.filter(m => m.type === 'visit').length;

        // 3. Taxa de Conversão (Cliques em Doação / Visitas)
        const donationClicks = data.filter(m => m.type === 'option_click' && 
          (m.label.toLowerCase().includes('pix') || m.label.toLowerCase().includes('doar'))).length;
        
        if (this.totalVisits > 0) {
          this.conversionRate = ((donationClicks / this.totalVisits) * 100).toFixed(1) + '%';
        }

        // 4. Ranking de Interesses (Cálculo matemático)
        const counts: { [key: string]: number } = {};
        
        data.filter(m => m.type === 'option_click').forEach(m => {
          counts[m.label] = (counts[m.label] || 0) + 1;
        });

        // Transforma em array e ordena do maior para o menor
        this.topInterests = Object.entries(counts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5); // Pega só os top 5
      },
      error: (err) => console.error('Erro ao carregar métricas', err)
    });
  }

  // --- FUNÇÕES DE EDIÇÃO VISUAL ---

  addCard() {
    const newId = prompt('Nome do novo passo (ID sem espaços, ex: projetos):');
    if (newId) {
      // Validação simples para não duplicar IDs
      const cleanId = newId.toLowerCase().trim().replace(/\s/g, '');
      
      if (this.cards.find(c => c.id === cleanId)) {
        alert('Já existe um card com este ID!');
        return;
      }
      this.cards.push({ id: cleanId, text: 'Escreva a mensagem aqui...', options: [] });
    }
  }

  removeCard(index: number) {
    if (confirm('Tem certeza que quer apagar este card?')) {
      this.cards.splice(index, 1);
    }
  }

  addOption(card: EditableCard) {
    card.options.push({ label: 'Novo Botão', nextStep: 'start' });
  }

  removeOption(card: EditableCard, index: number) {
    card.options.splice(index, 1);
  }

  // --- SALVAMENTO (ENVIO PARA O GOOGLE SHEETS) ---

  save() {
    this.isLoading = true;
    
    // 1. Reconstrói o Objeto ChatFlow a partir do Array visual
    const flowToSave: ChatFlow = {};
    
    this.cards.forEach(card => {
      // Ignora cards sem ID (segurança)
      if (!card.id) return;

      const cleanOptions = card.options.map(opt => {
        const newOpt: ChatOption = { label: opt.label };
        
        // Pega o valor digitado no input (que pode ser ID ou Link)
        // No HTML usamos [(ngModel)]="opt.nextStep", então lemos de lá
        const valorDigitado = String(opt.nextStep || "").trim();

        // Lógica para decidir se é Link ou Próximo Passo
        if (valorDigitado.startsWith('http')) {
           // É um link externo (WhatsApp ou Site)
           newOpt.action = valorDigitado.includes('wa.me') ? 'whatsapp' : 'url';
           newOpt.payload = valorDigitado;
        } else {
           // É um passo interno (ID)
           newOpt.nextStep = valorDigitado;
        }
        
        return newOpt;
      });

      flowToSave[card.id] = {
        text: card.text,
        options: cleanOptions
      };
    });

    console.log('Enviando para o Google:', flowToSave);

    // 2. Envia para o Google Script
    this.chatService.saveFlow(flowToSave).subscribe({
      next: (res) => {
        console.log('Resposta do Google:', res);
        alert('Salvo com sucesso na Planilha!');
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erro detalhado:', err);
        alert('Erro ao salvar. Verifique se o Script está implantado como "Qualquer Pessoa".');
        this.isLoading = false;
      }
    });
  }

  goHome() { 
    this.router.navigate(['/']); 
  }
}