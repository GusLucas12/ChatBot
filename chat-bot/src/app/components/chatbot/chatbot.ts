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
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss',   
})export class ChatbotComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;

  isOpen = true;
  

  private _userInput = '';
  private inputSubject = new Subject<string>();
  private inputSubscription!: Subscription;


  get userInput(): string { return this._userInput; }
  set userInput(val: string) {
    this._userInput = val;
 
    if (this.isExactMatch(val)) {
      this.sendMessage();
    } else {
     
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

    this.chatService.getFlow().subscribe({
      next: (data) => {
        this.flow = data;
        if (this.flow && this.flow['start']) {
          this.addBotMessage('start');
        }
      },
      error: (err) => console.error('Erro ao carregar fluxo:', err)
    });

    this.inputSubscription = this.inputSubject.pipe(
      debounceTime(600),
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

 
  isExactMatch(text: string): boolean {
    if (!this.flow || text.trim().length < 2) return false;
    const lowerText = text.toLowerCase().trim();
    
    const allSteps = Object.values(this.flow);
    for (const step of allSteps) {
      if (step.options) {
  
        const match = step.options.find(opt => opt.label.toLowerCase() === lowerText);
        if (match) return true;
      }
    }
    return false;
  }

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


  handleOption(option: ChatOption) {
    this.metricsService.logEvent('option_click', option.label);
 
    this.messages.push({ text: option.label, sender: 'user' });


    if (option.action === 'url' && option.payload) {
      window.open(option.payload, '_blank');

      setTimeout(() => this.addBotMessage('start'), 500); 
      return;
    }
    if (option.action === 'whatsapp' && option.payload) {
      window.open(`https://wa.me/${option.payload}`, '_blank');
      return;
    }

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

    setTimeout(() => {
      const lowerText = text.toLowerCase();
      let foundStepId: string | null = null;

      if (this.flow[lowerText]) {
        foundStepId = lowerText;
      } 
      else {
        const allSteps = Object.values(this.flow);
        
        for (const step of allSteps) {
          if (!step.options) continue;


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
    
        console.log('🤖 Não achei localmente. Chamando Gemini...');
        
        this.chatService.getAiFallback(text).subscribe({
          next: (res) => {
            console.log('✨ Gemini sugeriu:', res.stepId);
          
            if (res.stepId && this.flow[res.stepId]) {
              this.addBotMessage(res.stepId);
            } else {
              this.addBotMessage('default'); 
            }
          },
          error: () => {
            this.addBotMessage('default');
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