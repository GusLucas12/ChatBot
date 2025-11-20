import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Ajuste este caminho conforme a estrutura da sua pasta se necessário
import { ChatFlow, ChatMessage, ChatOption } from '../../modules/chat.models';
import { ChatService } from '../../services/chat';

@Component({
  selector: 'app-chatbot',
  standalone: true, // Adicionei o standalone: true explicitamente para garantir
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  // Mudei para true para o chat já aparecer aberto na tela cheia
  isOpen = true;
  userInput = '';
  messages: ChatMessage[] = [];

  // --- Configuração do Fluxo (Sua Árvore de Decisão) ---
  flow: ChatFlow = {}; // Começa vazio

  // Injete o serviço aqui
  constructor(private chatService: ChatService) { }

  ngOnInit() {
    // PEGA OS DADOS ATUALIZADOS DO SERVIÇO
    this.flow = this.chatService.getFlow();

    this.addBotMessage('start');
  }



  // Adiciona mensagem do bot baseada no passo (step)
  addBotMessage(stepKey: string) {
    const step = this.flow[stepKey] || this.flow['default'];

    // Se caiu no default, damos as opções do início para recuperar
    const options = step === this.flow['default'] ? this.flow['start'].options : step.options;

    this.messages.push({
      text: step.text,
      sender: 'bot',
      options: options
    });
  }

  // Trata o clique nas opções
  handleOption(option: ChatOption) {
    // 1. Adiciona a escolha do usuário como mensagem
    this.messages.push({ text: option.label, sender: 'user' });

    // 2. Verifica se é uma ação externa
    if (option.action === 'url' && option.payload) {
      window.open(option.payload, '_blank');
      this.addBotMessage('start'); // Reinicia ou agradece
      return;
    }

    if (option.action === 'whatsapp' && option.payload) {
      window.open(`https://wa.me/${option.payload}`, '_blank');
      return;
    }

    // 3. Simula um pequeno delay para parecer natural e avança
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