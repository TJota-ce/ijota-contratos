
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ContractFormData } from "../types";

const getSystemInstruction = (tone: string) => {
  let toneGuidance = "";
  if (tone === 'Formal e Rigoroso') {
    toneGuidance = "Use linguagem jurídica técnica e formal clássica (venerando, outrossim, etc).";
  } else if (tone === 'Equilibrado') {
    toneGuidance = "Use uma linguagem profissional moderna, clara e direta, mantendo a segurança jurídica.";
  } else {
    toneGuidance = "Use 'Plain Language' (Linguagem Simples), sem jargões e com sentenças curtas.";
  }

  return `Você é o "iJota Contratos", um assistente jurídico sênior brasileiro especializado em redação contratual.
Sua tarefa é gerar contratos completos, juridicamente válidos e bem estruturados em português.
ESTILO: ${toneGuidance}

REGRAS OBRIGATÓRIAS:
1. Identifique as Partes (Nacionalidade, Estado Civil, Profissão, CPF/CNPJ, Endereço).
2. Inclua cláusulas de Objeto, Preço/Pagamento, Prazo, Obrigações, Rescisão, Multas e Foro.
3. Formate em Markdown estruturado com títulos claros.`;
};

export const generateContractDraft = async (data: ContractFormData): Promise<string> => {
  // Criar instância no momento da chamada para garantir que pegue a chave mais recente
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `GERE UM CONTRATO COMPLETO: Objetivo: ${data.objective}. Parte A: ${data.partyA}. Parte B: ${data.partyB}. Cláusulas extras desejadas: ${data.specificClauses}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: getSystemInstruction(data.tone),
      temperature: 0.3,
      thinkingConfig: { thinkingBudget: 16000 } // Ativa o raciocínio profundo para contratos
    },
  });

  return response.text || "";
};

export const createContractChat = (initialContext: string, tone: string): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `${getSystemInstruction(tone)}\n\nCONTEXTO DO CONTRATO ATUAL:\n${initialContext}\n\nResponda sempre com o texto integral atualizado do contrato após as mudanças solicitadas.`,
      thinkingConfig: { thinkingBudget: 8000 }
    },
  });
};
