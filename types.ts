
export type LanguageTone = 'Formal e Rigoroso' | 'Equilibrado' | 'Linguagem Simples (Plain Language)';

export interface ContractFormData {
  objective: string;
  partyA: string;
  partyB: string;
  tone: LanguageTone;
  specificClauses: string;
}

export interface Contract {
  id: string;
  title: string;
  content: string;
  formData: ContractFormData;
  createdAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum GenerationState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
