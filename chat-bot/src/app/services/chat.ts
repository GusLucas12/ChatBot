import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChatFlow } from '../modules/chat.models'; // Ajuste o caminho se necessário
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private storageKey = 'ong_chat_flow';
  private apiUrl = 'https://script.google.com/macros/s/AKfycbzD5ft5Fd3gtyL7PcD9lOW0kpmubLdS9TqEv1N1maIjcna7_NHnVxJD_qiO2FPoMI3U/exec';

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
  constructor(@Inject(PLATFORM_ID) private platformId: Object,private http: HttpClient) { }

  // Pega o fluxo
  getFlow(): Observable<ChatFlow> {
    // Adiciona o param action=getFlow
    return this.http.get<ChatFlow>(`${this.apiUrl}?action=getFlow`);
  }

 saveFlow(newFlow: ChatFlow): Observable<any> {
  // O TRUQUE: 'text/plain' evita que o navegador faça a pergunta de segurança que o Google bloqueia
  const headers = new HttpHeaders({ 'Content-Type': 'text/plain' });
  
  // Enviamos o objeto transformado em string manualmente
  return this.http.post(
    `${this.apiUrl}?action=saveFlow`, 
    JSON.stringify(newFlow), 
    { headers }
  );
}
  // Reseta para o padrão
  resetFactory() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.storageKey);
    }
  }
}