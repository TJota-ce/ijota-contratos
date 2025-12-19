
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ContractFormData } from "../types";

export const createAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_NOT_SET");
  }
  
  return new GoogleGenAI({ apiKey });
};

const getSystemInstruction = (tone: string) => {
  let toneGuidance = "";
  if (tone === 'Formal e Rigoroso') {
    toneGuidance = "Use linguagem jurídica técnica e formal clássica (venerando, outrossim, etc).";
  } else if (tone === 'Equilibrado') {
    toneGuidance = "Use uma linguagem profissional moderna, clara e direta, mantendo a segurança jurídica.";
  } else {
    toneGuidance = "Use 'Plain Language' (Linguagem Simples), sem jargões e com sentenças curtas.";
  }

  return `Você é o "iJota Contratos", um assistente jurídico sênior brasileiro.
Sua tarefa é gerar contratos completos, juridicamente válidos e bem estruturados em português.
ESTILO: ${toneGuidance}

REGRAS:
1. Identifique as Partes claramente.
2. Inclua cláusulas de Objeto, Preço/Pagamento, Prazo, Obrigações das Partes, Rescisão, Multas, Confidencialidade e Foro.
3. Formate em Markdown estruturado com títulos e negritos.`;
};

export const generateContractDraft = async (data: ContractFormData): Promise<string> => {
  const ai = createAIClient();
  const prompt = `GERE UM CONTRATO COMPLETO: Objetivo: ${data.objective}. Parte A: ${data.partyA}. Parte B: ${data.partyB}. Detalhes Adicionais: ${data.specificClauses}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      systemInstruction: getSystemInstruction(data.tone),
      temperature: 0.3, // Menor temperatura para maior consistência jurídica
      thinkingConfig: { thinkingBudget: 4000 }
    },
  });

  return response.text || "";
};

export const createContractChat = (initialContext: string, tone: string): Chat => {
  const ai = createAIClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `${getSystemInstruction(tone)}\n\nO usuário enviará solicitações de alteração para este contrato. Responda sempre com o TEXTO INTEGRAL atualizado.\n\nCONTEXTO DO CONTRATO ATUAL:\n${initialContext}`,
    },
  });
};
