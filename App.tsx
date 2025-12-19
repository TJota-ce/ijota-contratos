
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
      
      let errorMsg = "Ocorreu um erro inesperado.";
      
      if (error.message?.includes("CONFIG_MISSING")) {
        errorMsg = "ERRO DE CONFIGURAÇÃO:\n\nA chave API_KEY não foi encontrada.\n\n1. Verifique se o nome no Vercel é API_KEY (com underline).\n2. Realize um REDEPLOY completo no painel do Vercel.\n3. Certifique-se de usar uma janela anônima para testar.";
      } else if (error.message?.includes("403") || error.message?.includes("not valid")) {
        errorMsg = "CHAVE INVÁLIDA:\n\nA chave no Vercel está incorreta ou expirou. Copie novamente do Google AI Studio.";
      } else {
        errorMsg = "Erro ao conectar com a IA: " + (error.message || "Verifique sua conexão.");
      }
      
      alert(errorMsg);
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
      alert('Contrato salvo no histórico do navegador.');
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased overflow-x-hidden">
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40 backdrop-blur-md bg-white/80 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => setCurrentContract(null)}>
            <div className="w-9 h-9 md:w-11 md:h-11 bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-xl md:text-2xl shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base md:text-xl font-bold tracking-tight text-slate-900 serif leading-none">iJota <span className="text-indigo-600">Contratos</span></h1>
              <p className="hidden md:block text-[10px] text-slate-500 font-semibold tracking-widest uppercase mt-1">Solução Inteligente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 md:gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)} 
              className="p-2 text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1 md:gap-2 text-xs md:text-sm transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="hidden sm:inline">Histórico</span> ({history.length})
            </button>
            <Button variant="primary" onClick={() => { setCurrentContract(null); setStatus(GenerationState.IDLE); }} className="rounded-full px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm bg-slate-900 border-none">
              Novo
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {!currentContract ? (
          <div className="flex-1 overflow-y-auto px-4 py-8 md:px-6 md:py-12 bg-white no-print">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b border-slate-100 pb-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 serif">Informações Básicas</h2>
                </div>
              </div>

              <div className="space-y-6 md:space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">O que você deseja contratar?</label>
                  <textarea
                    value={formData.objective}
                    onChange={(e) => updateField('objective', e.target.value.toUpperCase())}
                    placeholder="EX: ALUGUEL DE SALA COMERCIAL POR 12 MESES"
                    className="w-full h-24 md:h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Parte A (Contratante)</label>
                    <input
                      type="text"
                      value={formData.partyA}
                      onChange={(e) => updateField('partyA', e.target.value.toUpperCase())}
                      placeholder="NOME COMPLETO"
                      className="w-full px-4 h-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Parte B (Contratado)</label>
                    <input
                      type="text"
                      value={formData.partyB}
                      onChange={(e) => updateField('partyB', e.target.value.toUpperCase())}
                      placeholder="NOME COMPLETO"
                      className="w-full px-4 h-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none uppercase text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Estilo da Redação</label>
                    <select
                      value={formData.tone}
                      onChange={(e) => updateField('tone', e.target.value as LanguageTone)}
                      className="w-full px-4 h-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                    >
                      <option>Formal e Rigoroso</option>
                      <option>Equilibrado</option>
                      <option>Linguagem Simples (Plain Language)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Observações Extras</label>
                    <input
                      type="text"
                      value={formData.specificClauses}
                      onChange={(e) => updateField('specificClauses', e.target.value)}
                      placeholder="Ex: Pagamento mensal de R$ 1000"
                      className="w-full px-4 h-12 md:h-14 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate} 
                  isLoading={status === GenerationState.LOADING}
                  disabled={!formData.objective.trim() || status === GenerationState.LOADING}
                  className="w-full h-14 md:h-16 text-base md:text-lg font-bold rounded-xl md:rounded-2xl shadow-lg bg-slate-900 border-none transition-transform active:scale-95"
                >
                  Gerar Minuta do Contrato
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-full">
            <div className="flex-1 flex flex-col overflow-hidden h-full p-3 md:p-6">
               <ContractEditor 
                contract={currentContract} 
                onSave={handleSave} 
               />
            </div>
            
            <div className={`
              lg:block lg:relative lg:w-[380px] lg:h-full lg:translate-y-0
              fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ease-in-out bg-white lg:bg-transparent
              ${isMobileChatOpen ? 'translate-y-0 h-[80vh] shadow-2xl rounded-t-3xl border-t' : 'translate-y-full lg:translate-y-0'}
              no-print
            `}>
              <div className="lg:hidden w-full flex justify-center py-3 border-b">
                <div className="w-12 h-1.5 bg-slate-200 rounded-full" onClick={() => setIsMobileChatOpen(false)}></div>
              </div>
              <ChatBot 
                contractContent={currentContract.content} 
                tone={currentContract.formData.tone}
                onRefine={handleRefineContract}
              />
            </div>

            <button 
              onClick={() => setIsMobileChatOpen(true)}
              className={`lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 ${isMobileChatOpen ? 'scale-0' : 'scale-100'} no-print transition-transform`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </button>
          </div>
        )}

        {showHistory && (
          <div className="fixed inset-0 z-[60] flex justify-end no-print">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
            <div className="relative w-full max-w-[320px] md:max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold serif text-slate-900">Histórico</h3>
                </div>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">Nenhum contrato criado.</div>
                ) : (
                  history.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setCurrentContract(c); setShowHistory(false); setStatus(GenerationState.SUCCESS); }}
                      className="p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-500 transition-all group"
                    >
                      <h4 className="font-bold text-slate-800 uppercase text-[10px] truncate mb-1 group-hover:text-indigo-600 transition-colors">{c.title}</h4>
                      <div className="text-[8px] font-bold text-slate-400 uppercase flex justify-between">
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        <span>{c.formData.tone}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-4 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest no-print">
        <div className="flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
           <span className="text-emerald-600 font-bold uppercase tracking-widest">iJota Inteligência Jurídica</span>
        </div>
        <div className="text-center">© 2025 iJota. Versão 1.3 (Final)</div>
      </footer>
    </div>
  );
};

export default App;
