import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Ajuste este caminho conforme a estrutura da sua pasta
import { ChatFlow, ChatMessage, ChatOption } from '../../modules/chat.models';
import { ChatService } from '../../services/chat';
import { MetricsService } from '../../services/metrics';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = true;
  userInput = '';
  messages: ChatMessage[] = [];

  // Começa vazio, será preenchido pela Planilha Google
  flow: ChatFlow = {}; 

  constructor(
    private chatService: ChatService, 
    private metricsService: MetricsService
  ) { }

  ngOnInit() {
    // 1. Registra a visita na planilha
    this.metricsService.logEvent('visit', 'Site Acessado');

    // 2. Busca os dados da Planilha (ASSÍNCRONO)
    this.chatService.getFlow().subscribe({
      next: (data) => {
        // Quando os dados chegarem da planilha, salvamos aqui
        this.flow = data;
        // E só AGORA iniciamos a conversa
        this.addBotMessage('start');
      },
      error: (err) => {
        console.error('Erro ao carregar fluxo da planilha', err);
        // Opcional: Adicionar uma mensagem de erro visual para o usuário
        this.messages.push({ 
          text: 'Erro ao conectar com o servidor. Tente recarregar.', 
          sender: 'bot' 
        });
      }
    });
  }

  // Adiciona mensagem do bot baseada no passo (step)
  addBotMessage(stepKey: string) {
    // Garante que o flow existe antes de tentar acessar
    if (!this.flow) return;

    const step = this.flow[stepKey] || this.flow['default'];

    // Se caiu no default (não achou o passo), volta opções do início
    // Verificamos se 'start' existe para evitar erro se a planilha estiver vazia
    const startOptions = this.flow['start'] ? this.flow['start'].options : [];
    const options = step === this.flow['default'] ? startOptions : step.options;

    this.messages.push({
      text: step?.text || 'Olá! (Carregando...)', // Fallback caso texto esteja vazio
      sender: 'bot',
      options: options
    });
  }

  // Trata o clique nas opções
  handleOption(option: ChatOption) {
    // --- NOVO: Registra o clique na aba 'metricas' da planilha ---
    this.metricsService.logEvent('option_click', option.label);

    // 1. Adiciona a escolha do usuário como mensagem visual
    this.messages.push({ text: option.label, sender: 'user' });

    // 2. Verifica se é uma ação externa (Link ou WhatsApp)
    if (option.action === 'url' && option.payload) {
      window.open(option.payload, '_blank');
      // Pequeno delay para o usuário ver o que aconteceu antes do bot falar de novo
      setTimeout(() => this.addBotMessage('start'), 1000); 
      return;
    }

    if (option.action === 'whatsapp' && option.payload) {
      window.open(`https://wa.me/${option.payload}`, '_blank');
      return;
    }

    // 3. Navegação normal do fluxo
    setTimeout(() => {
      if (option.nextStep) {
        this.addBotMessage(option.nextStep);
      }
    }, 500);
  }

  // Trata o input de texto livre
  sendMessage() {
    if (!this.userInput.trim()) return;

    const text = this.userInput;
    this.messages.push({ text, sender: 'user' });
    this.userInput = '';

    // Lógica simples de palavra-chave
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      // Verifica se o fluxo já carregou antes de tentar navegar
      if (lowerText.includes('pix') || lowerText.includes('doar')) {
        this.addBotMessage('doacao');
      } else if (lowerText.includes('voluntari')) {
        this.addBotMessage('voluntario');
      } else {
        this.addBotMessage('default');
      }
    }, 500);
  }

  // Mantém o scroll sempre no final
  ngAfterViewChecked() {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}