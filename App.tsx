
import React, { useState, useEffect } from 'react';
import { generateContractDraft } from './services/geminiService.ts';
import { Contract, GenerationState, ContractFormData, LanguageTone } from './types.ts';
import { Button } from './components/Button.tsx';
import { ContractEditor } from './components/ContractEditor.tsx';
import { ChatBot } from './components/ChatBot.tsx';

const App: React.FC = () => {
  const [formData, setFormData] = useState<ContractFormData>({
    objective: '',
    partyA: '',
    partyB: '',
    tone: 'Equilibrado',
    specificClauses: ''
  });
  
  const [currentContract, setCurrentContract] = useState<Contract | null>(null);
  const [status, setStatus] = useState<GenerationState>(GenerationState.IDLE);
  const [showHistory, setShowHistory] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  
  // Se houver chave no process.env, não precisamos do seletor
  const [hasApiKey, setHasApiKey] = useState<boolean>(!!process.env.API_KEY);

  useEffect(() => {
    const checkKey = async () => {
      // Se já temos a chave do Vercel, não faz nada
      if (process.env.API_KEY) {
        setHasApiKey(true);
        return;
      }

      // Se não temos a chave e estamos no ambiente que suporta o seletor
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      } else {
        // Se estamos no Vercel e não há chave, deixamos como true para tentar a chamada
        // e capturar o erro real da API caso a variável não tenha sido injetada.
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    } else {
      alert("Ambiente de produção Vercel detectado.\n\nA chave API_KEY não foi encontrada nas variáveis de ambiente do seu projeto Vercel.\n\n1. Vá em Settings > Environment Variables no Vercel.\n2. Adicione API_KEY com sua chave do Google AI Studio.\n3. Faça um novo Deploy.");
    }
  };

  const [history, setHistory] = useState<Contract[]>(() => {
    try {
      const saved = localStorage.getItem('ijota_history');
      if (saved) return JSON.parse(saved);
    } catch (e) { return []; }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('ijota_history', JSON.stringify(history));
  }, [history]);

  const handleGenerate = async () => {
    if (!formData.objective.trim()) return;
    setStatus(GenerationState.LOADING);
    
    try {
      const content = await generateContractDraft(formData);
      const newContract: Contract = {
        id: Date.now().toString(),
        title: formData.objective.slice(0, 40),
        content,
        formData: { ...formData },
        createdAt: new Date(),
      };
      setCurrentContract(newContract);
      setHistory(prev => [newContract, ...prev]);
      setStatus(GenerationState.SUCCESS);
    } catch (error: any) {
      console.error("Erro na geração:", error);
      setStatus(GenerationState.ERROR);
      
      if (error.message?.includes("API_KEY_NOT_SET") || error.message?.includes("403") || error.message?.includes("not found")) {
        // Se a chamada falhou por falta de chave, aí sim mostramos a tela de bloqueio
        setHasApiKey(false);
      } else {
        alert("Erro no Gemini: " + (error.message || "Verifique sua conexão."));
      }
    }
  };

  const updateField = (field: keyof ContractFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (newContent: string) => {
    if (currentContract) {
      const updated = { ...currentContract, content: newContent };
      setCurrentContract(updated);
      setHistory(prev => prev.map(c => c.id === updated.id ? updated : c));
      alert('Contrato salvo!');
    }
  };

  const handleRefineContract = (newContent: string) => {
    if (currentContract) {
      const updated = { ...currentContract, content: newContent };
      setCurrentContract(updated);
      setHistory(prev => prev.map(c => c.id === updated.id ? updated : c));
      if (window.innerWidth < 1024) setIsMobileChatOpen(false);
    }
  };

  // Só bloqueia se tivermos CERTEZA que não há chave
  if (!hasApiKey && !currentContract) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 text-center space-y-8">
          <div className="w-20 h-20 bg-amber-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4a1 1 0 0 0-1.4 0l-2.1 2.1a1 1 0 0 0 0 1.4Z"/><path d="m15.5 7.5-3 3"/><path d="m15.5 7.5-6-6"/><path d="m13 10.5 2 2"/><path d="m5 18.5-3 3"/><path d="M9.5 14 2 21.5"/><path d="m7 16 2 2"/><path d="m11 12 2 2"/></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 serif">Chave de Acesso Ausente</h2>
            <p className="text-slate-500 text-sm">
              Não detectamos sua chave API_KEY. Se você está no Vercel, adicione-a nas variáveis de ambiente. Se estiver em teste, conecte abaixo.
            </p>
          </div>
          <div className="space-y-4">
            <Button onClick={handleOpenKeySelector} className="w-full h-14 bg-indigo-600 border-none rounded-2xl font-bold">
              Tentar Conectar
            </Button>
            <p className="text-[10px] text-slate-400">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">Documentação de Faturamento</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40 backdrop-blur-md bg-white/80 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => setCurrentContract(null)}>
            <div className="w-9 h-9 md:w-11 md:h-11 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-bold tracking-tight text-slate-900 serif leading-none">iJota <span className="text-indigo-600">Contratos</span></h1>
              <p className="hidden md:block text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-1">Inteligência Gemini 3 Pro</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 text-slate-600 font-semibold text-xs md:text-sm">
              Histórico ({history.length})
            </button>
            <Button variant="primary" onClick={() => { setCurrentContract(null); setStatus(GenerationState.IDLE); }} className="rounded-full px-4 text-xs md:text-sm bg-slate-900 border-none">
              Novo
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {!currentContract ? (
          <div className="flex-1 overflow-y-auto px-4 py-8 md:px-6 md:py-12 bg-white no-print">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">O que você deseja contratar?</label>
                <textarea
                  value={formData.objective}
                  onChange={(e) => updateField('objective', e.target.value.toUpperCase())}
                  placeholder="EX: CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL POR 6 MESES"
                  className="w-full h-24 md:h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Contratante</label>
                  <input type="text" value={formData.partyA} onChange={(e) => updateField('partyA', e.target.value.toUpperCase())} className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase text-sm" placeholder="NOME OU EMPRESA" />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Contratado</label>
                  <input type="text" value={formData.partyB} onChange={(e) => updateField('partyB', e.target.value.toUpperCase())} className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase text-sm" placeholder="NOME OU EMPRESA" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Estilo Jurídico</label>
                  <select value={formData.tone} onChange={(e) => updateField('tone', e.target.value as LanguageTone)} className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-semibold">
                    <option>Formal e Rigoroso</option>
                    <option>Equilibrado</option>
                    <option>Linguagem Simples (Plain Language)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Cláusulas Específicas</label>
                  <input type="text" value={formData.specificClauses} onChange={(e) => updateField('specificClauses', e.target.value)} className="w-full px-4 h-12 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm" placeholder="Ex: Multa de 20%, Foro em Curitiba..." />
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                isLoading={status === GenerationState.LOADING}
                disabled={!formData.objective.trim() || status === GenerationState.LOADING}
                className="w-full h-16 text-lg font-bold rounded-2xl shadow-lg bg-slate-900 border-none"
              >
                Gerar Contrato com Gemini 3 Pro
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-full">
            <div className="flex-1 flex flex-col overflow-hidden h-full p-3 md:p-6">
               <ContractEditor contract={currentContract} onSave={handleSave} />
            </div>
            
            <div className={`
              lg:block lg:relative lg:w-[400px] lg:h-full
              fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 bg-white
              ${isMobileChatOpen ? 'translate-y-0 h-[80vh] border-t' : 'translate-y-full lg:translate-y-0'}
              no-print
            `}>
              <ChatBot contractContent={currentContract.content} tone={currentContract.formData.tone} onRefine={handleRefineContract} />
            </div>

            <button onClick={() => setIsMobileChatOpen(!isMobileChatOpen)} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 no-print">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </button>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-4 px-8 flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest no-print">
        <div>iJota Inteligência Jurídica</div>
        <div>© 2025 • Versão 1.6 (Gemini 3 Pro)</div>
      </footer>
    </div>
  );
};

export default App;
