
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ContractFormData } from "../types";

export const createAIClient = () => {
  // Tenta buscar a chave de múltiplas fontes possíveis em ambientes de deploy
  const apiKey = (window as any).process?.env?.API_KEY || (process as any).env?.API_KEY;
  
  if (!apiKey || apiKey === "undefined" || apiKey === "" || apiKey === "null") {
    console.error("API_KEY não encontrada nas variáveis de ambiente.");
    throw new Error("CONFIG_MISSING");
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

  return `Você é o "iJota Contratos", um assistente jurídico brasileiro.
Sua tarefa é gerar contratos completos em português.
ESTILO: ${toneGuidance}

REGRAS:
1. Identifique as Partes claramente.
2. Inclua cláusulas de Objeto, Pagamento, Prazo, Obrigações, Rescisão e Foro.
3. Formate em Markdown.`;
};

export const generateContractDraft = async (data: ContractFormData): Promise<string> => {
  try {
    const ai = createAIClient();
    const prompt = `GERE UM CONTRATO COMPLETO: Objetivo: ${data.objective}. Parte A: ${data.partyA}. Parte B: ${data.partyB}. Extras: ${data.specificClauses}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: getSystemInstruction(data.tone),
        temperature: 0.4,
      },
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Erro Gemini:", error);
    throw error;
  }
};

export const createContractChat = (initialContext: string, tone: string): Chat => {
  const ai = createAIClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `${getSystemInstruction(tone)}\n\nCONTEXTO:\n${initialContext}`,
    },
  });
};
