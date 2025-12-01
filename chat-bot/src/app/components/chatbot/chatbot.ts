import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ChatService } from '../../services/chat';
import { MetricsService } from '../../services/metrics';
import { ChatFlow, ChatMessage, ChatOption } from '../../modules/chat.models';
import { Router } from '@angular/router';

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

  private hasSentMessage = false;
  private _userInput = '';

  isBotTyping = false;

  get userInput(): string { return this._userInput; }
  set userInput(val: string) {

    this._userInput = val;
  }

  messages: ChatMessage[] = [];
  flow: ChatFlow = {};

  constructor(
    private chatService: ChatService,
    private router: Router,
    private metricsService: MetricsService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.metricsService.logEvent('visit', 'Site Acessado');

    this.chatService.getFlow().subscribe({
      next: (data) => {
        this.flow = data || {};
        if (this.flow && this.flow['start']) {
          this.addBotMessage('start');
        }
      },
      error: (err) => console.error('Erro ao carregar fluxo:', err)
    });
  }


  isExactMatch(text: string): boolean {
    if (!this.flow || !text) return false;
    const trimmed = text.toLowerCase().trim();
    if (trimmed.length < 2) return false;

    const allSteps = Object.values(this.flow);
    for (const step of allSteps) {
      if (step.options) {
        const match = step.options.find(opt => opt.label.toLowerCase() === trimmed);
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

  showTyping() {
    if (this.isBotTyping) return;
    this.isBotTyping = true;
    this.messages.push({

      sender: 'bot',
      typing: true 
    });
  }

  hideTyping() {
    this.isBotTyping = false;
    this.messages = this.messages.filter(m => !m.typing);
  }


  sendMessage() {
    const raw = this._userInput || '';
    const trimmed = raw.trim();
    if (!trimmed) return;


    if (this.hasSentMessage) return;
    this.hasSentMessage = true;


    this.messages.push({ text: trimmed, sender: 'user' });


    this._userInput = '';


    this.showTyping();

    setTimeout(() => {
      try {
        const lowerText = trimmed.toLowerCase();
        let foundStepId: string | null = null;

        if (this.flow && (this.flow as any)[lowerText]) {
          foundStepId = lowerText;
        } else {

          const allSteps = Object.values(this.flow || {});
          for (const step of allSteps) {
            if (!step.options) continue;

            const match = step.options.find(opt =>
              opt.label.toLowerCase().includes(lowerText)
            );

            if (match) {
              if (match.nextStep) {
                foundStepId = match.nextStep;
              } else if (match.action === 'whatsapp' || match.action === 'url') {
               
                this.hideTyping();
                this.hasSentMessage = false;
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
          this.hideTyping();
          this.addBotMessage(foundStepId);
          this.hasSentMessage = false;
          return;
        }


        this.chatService.getAiFallback(trimmed).subscribe({
          next: (res) => {

            this.ngZone.run(() => {
              this.hideTyping();

              if (res.stepId && this.flow[res.stepId]) {
                this.hasSentMessage = false;
                this.addBotMessage(res.stepId);
                this.cdr.detectChanges(); 
                return;
              }

              this.hasSentMessage = false;
              this.addBotMessage('default');
              this.cdr.detectChanges(); 
            });

          },
          error: (err) => {
            console.error('Erro no fallback IA:', err);
            this.hasSentMessage = false;
            this.hideTyping();
            this.addBotMessage('default');
          }
        });
      } catch (err) {
        console.error('Erro no processamento da mensagem:', err);
        this.hasSentMessage = false;
        this.hideTyping();
        this.addBotMessage('default');
      }
    }, 300);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  ngAfterViewChecked() {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
