
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ContractFormData } from "../types";

// Always use process.env.API_KEY directly as per guidelines
export const createAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const getSystemInstruction = (tone: string) => {
  let toneGuidance = "";
  if (tone === 'Formal e Rigoroso') {
    toneGuidance = "Use linguagem jurídica erudita (juridiquês técnico), com termos latinos seculares quando apropriado e estrutura formal clássica.";
  } else if (tone === 'Equilibrado') {
    toneGuidance = "Use uma linguagem profissional moderna, clara e direta, evitando arcaísmos mas mantendo a seriedade jurídica necessária.";
  } else {
    toneGuidance = "Use 'Plain Language' (Linguagem Simples). Evite jargões, use sentenças curtas e garanta que qualquer pessoa sem formação jurídica entenda perfeitamente os direitos e deveres.";
  }

  return `Você é o "iJota Contratos", um Consultor Jurídico Sênior brasileiro de elite.
Sua tarefa é gerar e AJUSTAR contratos estruturados em português do Brasil.
ESTILO: ${toneGuidance}

REGRAS OBRIGATÓRIAS:
1. Identifique claramente as Partes no preâmbulo. 
   - A Parte A deve ser tratada como CONTRATANTE ou LOCADOR.
   - A Parte B deve ser tratada como CONTRATADO ou LOCATÁRIO.
2. Inclua cláusulas essenciais (Objeto, Preço/Aluguel, Prazo, Rescisão, Foro, Penalidades, LGPD).
3. Formate em Markdown profissional (Use negrito para títulos de cláusulas).
4. REFINAMENTO: Quando o usuário pedir um ajuste, você DEVE retornar o TEXTO INTEGRAL DO CONTRATO com o ajuste aplicado. Não envie apenas a cláusula nova, envie o documento todo atualizado.`;
};

export const generateContractDraft = async (data: ContractFormData): Promise<string> => {
  const ai = createAIClient();
  const prompt = `
    DADOS PARA O CONTRATO:
    - Objetivo: ${data.objective}
    - Parte A (Contratante / Locador): ${data.partyA}
    - Parte B (Contratado / Locatário): ${data.partyB}
    - Cláusulas Adicionais: ${data.specificClauses || "Nenhuma específica, use o padrão jurídico"}
    
    Por favor, redija a minuta completa do contrato agora.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(data.tone),
      temperature: 0.4,
    },
  });
  return response.text || "Erro ao gerar o contrato.";
};

export const createContractChat = (initialContext: string, tone: string): Chat => {
  const ai = createAIClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `${getSystemInstruction(tone)}\n\nCONTEXTO DO CONTRATO ATUAL:\n${initialContext}\n\nSempre que solicitado um ajuste, devolva o contrato completo atualizado.`,
    },
  });
};
