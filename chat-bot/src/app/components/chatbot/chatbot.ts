import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatService } from '../../services/chat';
import { MetricsService } from '../../services/metrics';
import { ChatFlow, ChatMessage, ChatOption } from '../../modules/chat.models';
import { debounceTime, distinctUntilChanged, filter, Subject, Subscription } from 'rxjs';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html', // Certifique-se que o nome do arquivo está certo
  styleUrl: './chatbot.scss',    // Certifique-se que o nome do arquivo está certo
})export class ChatbotComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = true;
  
  // Controle do Input com Debounce (Resposta Automática)
  private _userInput = '';
  private inputSubject = new Subject<string>();
  private inputSubscription!: Subscription;

  // Getter e Setter: Intercepta cada letra digitada
  get userInput(): string { return this._userInput; }
  set userInput(val: string) {
    this._userInput = val;
    
    // VERIFICAÇÃO DE ENVIO IMEDIATO (Sem esperar debounce)
    // Se o usuário digitou algo que corresponde EXATAMENTE a uma opção, envia na hora
    if (this.isExactMatch(val)) {
      this.sendMessage();
    } else {
      // Caso contrário, espera o usuário parar de digitar
      this.inputSubject.next(val); 
    }
  }

  messages: ChatMessage[] = [];
  flow: ChatFlow = {}; 

  constructor(
    private chatService: ChatService, 
    private metricsService: MetricsService
  ) { }

  ngOnInit() {
    this.metricsService.logEvent('visit', 'Site Acessado');

    // Carrega os dados da planilha
    this.chatService.getFlow().subscribe({
      next: (data) => {
        this.flow = data;
        if (this.flow && this.flow['start']) {
          this.addBotMessage('start');
        }
      },
      error: (err) => console.error('Erro ao carregar fluxo:', err)
    });

    // --- CONFIGURAÇÃO DA RESPOSTA AUTOMÁTICA AO DIGITAR ---
    this.inputSubscription = this.inputSubject.pipe(
      debounceTime(600), // Reduzido de 1200ms para 600ms (Mais rápido)
      distinctUntilChanged(), 
      filter(text => text.trim().length > 0) 
    ).subscribe(() => {
      this.sendMessage();
    });
  }

  ngOnDestroy() {
    if (this.inputSubscription) {
      this.inputSubscription.unsubscribe();
    }
  }

  // Verifica se o texto digitado é igual ao rótulo de algum botão (Case insensitive)
  isExactMatch(text: string): boolean {
    if (!this.flow || text.trim().length < 2) return false;
    const lowerText = text.toLowerCase().trim();
    
    const allSteps = Object.values(this.flow);
    for (const step of allSteps) {
      if (step.options) {
        // Se achar um botão com nome IDÊNTICO, retorna true para envio imediato
        const match = step.options.find(opt => opt.label.toLowerCase() === lowerText);
        if (match) return true;
      }
    }
    return false;
  }

  // Adiciona mensagem do bot na tela
  addBotMessage(stepKey: string) {
    if (!this.flow) return;

    const step = this.flow[stepKey] || this.flow['default'] || this.flow['start'];
    
    if (!step) return;

    const options = step.options || [];

    this.messages.push({
      text: step.text,
      sender: 'bot',
      options: options
    });
  }

  // --- 1. CLIQUE NO BOTÃO (Resposta Imediata) ---
  handleOption(option: ChatOption) {
    this.metricsService.logEvent('option_click', option.label);
    
    // Mostra o que foi clicado
    this.messages.push({ text: option.label, sender: 'user' });

    // Ações externas (Links)
    if (option.action === 'url' && option.payload) {
      window.open(option.payload, '_blank');
      // Pequeno delay visual apenas para resetar caso volte
      setTimeout(() => this.addBotMessage('start'), 500); 
      return;
    }
    if (option.action === 'whatsapp' && option.payload) {
      window.open(`https://wa.me/${option.payload}`, '_blank');
      return;
    }

    // Navegação interna - SEM TIMEOUT (Resposta Instantânea)
    // Isso garante que o Angular detecte a mudança na hora, sem precisar de Enter
    if (option.nextStep) {
      this.addBotMessage(option.nextStep);
    }
  }

  // --- 2. DIGITOU ALGO (Busca Automática) ---
  sendMessage() {
    if (!this._userInput.trim()) return;

    const text = this._userInput.trim();
    this.messages.push({ text, sender: 'user' });
    this._userInput = ''; // Limpa o campo

    // Simula processamento - Reduzido para 300ms
    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let foundStepId: string | null = null;

      // ESTRATÉGIA DE BUSCA INTELIGENTE:
      if (this.flow[lowerText]) {
        foundStepId = lowerText;
      } 
      else {
        const allSteps = Object.values(this.flow);
        
        for (const step of allSteps) {
          if (!step.options) continue;

          // Procura parcial (ex: "roupa" acha "Doar Roupas")
          const match = step.options.find(opt => 
            opt.label.toLowerCase().includes(lowerText)
          );

          if (match) {
            if (match.nextStep) {
              foundStepId = match.nextStep;
            } else if (match.action === 'whatsapp' || match.action === 'url') {
               this.messages.push({ 
                 text: `Acessando: ${match.label}...`, 
                 sender: 'bot' 
               });
               window.open(match.payload, '_blank');
               return;
            }
            break;
          }
        }
      }

     if (foundStepId) {
        this.addBotMessage(foundStepId);
      } else {
        // --- AQUI ENTRA O GEMINI ---
        console.log('🤖 Não achei localmente. Chamando Gemini...');
        
        this.chatService.getAiFallback(text).subscribe({
          next: (res) => {
            console.log('✨ Gemini sugeriu:', res.stepId);
            
            // Verifica se a sugestão existe no fluxo
            if (res.stepId && this.flow[res.stepId]) {
              this.addBotMessage(res.stepId);
            } else {
              this.addBotMessage('default'); // Se a IA alucinar um ID que não existe
            }
          },
          error: () => {
            this.addBotMessage('default'); // Se a internet falhar
          }
        });
      }
    }, 300);

 
  }

  ngAfterViewChecked() {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}