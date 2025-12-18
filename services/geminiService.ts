
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ContractFormData } from "../types";

// Inicializa o cliente verificando a existência da chave
export const createAIClient = () => {
  const apiKey = process.env.API_KEY;
  
  // Verifica se a chave existe e não é a string "undefined" que alguns sistemas injetam
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("CONFIG_MISSING: API_KEY não configurada. Adicione-a nas Environment Variables do Vercel.");
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
    toneGuidance = "Use 'Plain Language' (Linguagem Simples), sem jargões e com sentenças curtas para fácil compreensão por leigos.";
  }

  return `Você é o "iJota Contratos", um assistente jurídico brasileiro especialista em redação contratual.
Sua tarefa é gerar contratos completos, juridicamente válidos no Brasil, em português.
ESTILO: ${toneGuidance}

REGRAS:
1. Identifique claramente as Partes: Parte A (CONTRATANTE/LOCADOR) e Parte B (CONTRATADO/LOCATÁRIO).
2. Inclua obrigatoriamente as cláusulas: Objeto, Valor e Forma de Pagamento, Prazo, Obrigações, Rescisão e Foro.
3. Formate o texto usando Markdown (Use ## para títulos de cláusulas e negrito para termos importantes).
4. Retorne SEMPRE o texto integral do contrato, pronto para uso.`;
};

export const generateContractDraft = async (data: ContractFormData): Promise<string> => {
  try {
    const ai = createAIClient();
    const prompt = `
      GERE UM CONTRATO COMPLETO COM ESTES DADOS:
      - Objetivo Principal: ${data.objective}
      - Nome/Razão Social Parte A: ${data.partyA}
      - Nome/Razão Social Parte B: ${data.partyB}
      - Detalhes/Cláusulas Adicionais solicitadas: ${data.specificClauses || "Seguir padrão de mercado para este tipo de contrato."}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: getSystemInstruction(data.tone),
        temperature: 0.4, // Menor temperatura para maior consistência jurídica
      },
    });

    if (!response.text) throw new Error("A API retornou um conteúdo vazio.");
    return response.text;
  } catch (error: any) {
    console.error("Erro Gemini Service:", error);
    throw error;
  }
};

export const createContractChat = (initialContext: string, tone: string): Chat => {
  const ai = createAIClient();
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `${getSystemInstruction(tone)}\n\nCONTEXTO DO CONTRATO ATUAL (Sempre baseie suas respostas e alterações neste texto):\n${initialContext}`,
    },
  });
};
