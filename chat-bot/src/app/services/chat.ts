import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChatFlow } from '../modules/chat.models'; // Ajuste o caminho se necessário

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private storageKey = 'ong_chat_flow';

  // O fluxo padrão inicial
  private defaultFlow: ChatFlow = {
    start: {
      text: 'Olá! Bem-vindo à ONG Esperança. Como podemos ajudar você hoje?',
      options: [
        { label: 'Quero Doar ❤️', nextStep: 'doacao' },
        { label: 'Ser Voluntário 🤝', nextStep: 'voluntario' },
        { label: 'Contato / Endereço 📍', nextStep: 'contato' }
      ]
    },
    doacao: {
      text: 'Sua ajuda transforma vidas! Como prefere fazer sua doação?',
      options: [
        { label: 'Chave PIX', nextStep: 'pix' },
        { label: 'Transferência Bancária', nextStep: 'banco' },
        { label: 'Voltar', nextStep: 'start' }
      ]
    },
    pix: {
      text: 'Nossa chave PIX é: doacao@ongesperanca.org.br',
      options: [{ label: 'Voltar ao Início', nextStep: 'start' }]
    },
    banco: {
      text: 'Banco do Brasil | Ag: 1234-5 | CC: 98765-0 | CNPJ: 00.000.000/0001-99',
      options: [{ label: 'Voltar ao Início', nextStep: 'start' }]
    },
    voluntario: {
      text: 'Precisamos de gente como você! Preencha nosso formulário online ou venha nos visitar.',
      options: [
        { label: 'Preencher Formulário', action: 'url', payload: 'https://google.com/forms' },
        { label: 'Voltar', nextStep: 'start' }
      ]
    },
    contato: {
      text: 'Ficamos na Rua das Flores, 100. Abertos Seg-Sex das 9h às 18h.',
      options: [
        { label: 'Falar no WhatsApp', action: 'whatsapp', payload: '5511999999999' },
        { label: 'Voltar', nextStep: 'start' }
      ]
    },
    default: {
      text: 'Desculpe, não entendi.',
      options: []
    }
  };

  // Injetamos o ID da plataforma para saber se estamos no Servidor ou Navegador
  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  // Pega o fluxo
  getFlow(): ChatFlow {
    // VERIFICAÇÃO IMPORTANTE: Só roda se for navegador
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : this.defaultFlow;
    }
    // Se estiver no servidor, retorna o padrão para não dar erro
    return this.defaultFlow;
  }

  // Salva as alterações
  saveFlow(newFlow: ChatFlow) {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.storageKey, JSON.stringify(newFlow));
    }
  }
  
  // Reseta para o padrão
  resetFactory() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.storageKey);
    }
  }
}