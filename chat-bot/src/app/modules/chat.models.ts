export interface ChatOption {
  label: string;
  nextStep?: string; // Chave para o próximo passo no fluxo
  action?: 'url' | 'whatsapp'; // Ações externas
  payload?: string; // O link em si
}

export interface ChatMessage {
  text: string;
  sender: 'bot' | 'user';
  options?: ChatOption[]; // Apenas mensagens do bot têm opções
}

export interface ChatFlow {
  [key: string]: {
    text: string;
    options?: ChatOption[];
  };
}