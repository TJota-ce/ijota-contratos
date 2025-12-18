
import React, { useState, useEffect, useRef } from 'react';
import { createContractChat } from '../services/geminiService';
import { ChatMessage, GenerationState } from '../types';
import { Button } from './Button';

interface ChatBotProps {
  contractContent: string;
  tone: string;
  onRefine: (newContent: string) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ contractContent, tone, onRefine }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);

  useEffect(() => {
    chatRef.current = createContractChat(contractContent, tone);
  }, [tone]);

  const handleRefine = async () => {
    if (!input.trim() || isLoading) return;

    const instruction = input.trim();
    const userMessage = `ALTERAÇÃO SOLICITADA PELO USUÁRIO: "${instruction}". 
    
    AJA AGORA: Com base no contrato que temos no contexto, aplique esta alteração e me devolva o CONTRATO COMPLETO ATUALIZADO. 
    Não envie apenas comentários, envie o texto integral do contrato com as mudanças aplicadas.`;
    
    setIsLoading(true);

    try {
      const result = await chatRef.current.sendMessage({ message: userMessage });
      const responseText = result.text;
      
      if (responseText && responseText.length > 100) {
        onRefine(responseText);
        setInput('');
      } else {
        alert('Tente ser mais específico na solicitação.');
      }
    } catch (error) {
      console.error("Erro no Refine:", error);
      alert('Erro na comunicação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] border-l border-slate-200 w-full p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto">
      
      {/* Card Assistente */}
      <div className="bg-[#101827] rounded-xl md:rounded-2xl p-4 md:p-6 shadow-xl space-y-4 shrink-0">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-slate-800 rounded-lg shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h3 className="text-base md:text-lg font-bold">Assistente Jurídico</h3>
        </div>
        
        <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
          Peça para a IA reescrever cláusulas ou adicionar novos termos.
        </p>

        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ex: Adicione uma multa de 10% por atraso."
            className="w-full h-24 md:h-40 p-3 md:p-4 bg-[#1F2937] border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-100 text-xs md:text-sm resize-none placeholder:text-slate-500 transition-all"
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-0 bg-[#1F2937]/50 rounded-xl flex items-center justify-center backdrop-blur-[1px]">
               <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        <Button 
          onClick={handleRefine} 
          isLoading={isLoading}
          disabled={!input.trim() || isLoading}
          className="w-full h-11 md:h-12 bg-indigo-600 hover:bg-indigo-500 border-none rounded-xl font-bold text-xs md:text-sm shadow-lg"
        >
          Refinar Contrato
        </Button>
      </div>

      {/* Dicas e Avisos (Ocultos em telas pequenas se necessário ou mais compactos) */}
      <div className="space-y-3 pb-8">
        <div className="bg-white rounded-lg p-3 md:p-4 border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Exemplos</h4>
          <ul className="text-[10px] md:text-xs text-slate-500 space-y-1 font-medium">
            <li>• "Altere o foro para a cidade de São Paulo."</li>
            <li>• "Adicione uma cláusula de confidencialidade."</li>
            <li>• "Inclua o valor total de R$ 5.000,00."</li>
          </ul>
        </div>

        <div className="bg-amber-50 rounded-lg p-3 md:p-4 border border-amber-100">
          <p className="text-[9px] md:text-[10px] text-amber-800 font-semibold leading-relaxed">
            <span className="font-bold text-amber-600 block mb-1">AVISO:</span> 
            A IA pode cometer erros. Revise o documento final com atenção.
          </p>
        </div>
      </div>

    </div>
  );
};
