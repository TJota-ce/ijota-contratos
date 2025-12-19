
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
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

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

  const handleOpenKeySelector = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setErrorDetails(null);
    } else {
      window.open('https://aistudio.google.com/app/apikey', '_blank');
      alert("Acesse o Google AI Studio, crie sua chave e adicione-a como variável 'API_KEY' no seu painel do Vercel.");
    }
  };

  const handleGenerate = async () => {
    if (!formData.objective.trim()) return;
    setStatus(GenerationState.LOADING);
    setErrorDetails(null);
    
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
      
      const msg = error.message || "";
      if (msg.includes("API_KEY_NOT_SET") || msg.includes("403") || msg.includes("not found")) {
        setErrorDetails("A Chave API não foi encontrada ou é inválida. Se você já configurou no Vercel, aguarde alguns minutos e tente novamente.");
      } else {
        setErrorDetails("Ocorreu um erro inesperado: " + msg);
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
      alert('Contrato salvo com sucesso.');
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40 backdrop-blur-md bg-white/80 no-print">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentContract(null); setStatus(GenerationState.IDLE); setErrorDetails(null); }}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 serif leading-none">iJota <span className="text-indigo-600">Contratos</span></h1>
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase mt-1">Versão 1.7 PRO</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button onClick={() => setShowHistory(!showHistory)} className="text-slate-600 font-bold text-xs uppercase hover:text-indigo-600 transition-colors">
              Histórico ({history.length})
            </button>
            <Button onClick={() => { setCurrentContract(null); setStatus(GenerationState.IDLE); setErrorDetails(null); }} className="rounded-full px-6 py-2 text-xs font-bold uppercase">
              Novo
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {!currentContract ? (
          <div className="flex-1 overflow-y-auto px-4 py-8 md:px-6 md:py-12 bg-white no-print">
            <div className="max-w-4xl mx-auto space-y-10">
              
              {errorDetails && (
                <div className="bg-red-50 border border-red-200 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4">
                  <div className="p-3 bg-red-500 text-white rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-red-800 font-bold mb-1">Erro de Conexão com a Inteligência</h3>
                    <p className="text-red-600 text-sm">{errorDetails}</p>
                  </div>
                  <Button onClick={handleOpenKeySelector} className="bg-red-600 hover:bg-red-700 border-none shrink-0">
                    Configurar Chave
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Descrição do Contrato</label>
                <textarea
                  value={formData.objective}
                  onChange={(e) => updateField('objective', e.target.value)}
                  placeholder="Ex: Contrato de prestação de serviços de arquitetura para reforma residencial com prazo de 120 dias e multa de 10% por atraso."
                  className="w-full h-32 md:h-40 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none text-base transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Contratante (Parte A)</label>
                  <input type="text" value={formData.partyA} onChange={(e) => updateField('partyA', e.target.value)} className="w-full px-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="NOME OU RAZÃO SOCIAL" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Contratado (Parte B)</label>
                  <input type="text" value={formData.partyB} onChange={(e) => updateField('partyB', e.target.value)} className="w-full px-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="NOME OU RAZÃO SOCIAL" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Estilo da Redação</label>
                  <select value={formData.tone} onChange={(e) => updateField('tone', e.target.value as LanguageTone)} className="w-full px-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-700">
                    <option>Formal e Rigoroso</option>
                    <option>Equilibrado</option>
                    <option>Linguagem Simples (Plain Language)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Cláusulas Especiais</label>
                  <input type="text" value={formData.specificClauses} onChange={(e) => updateField('specificClauses', e.target.value)} className="w-full px-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl outline-none" placeholder="Ex: Pagamento via PIX, Foro em BH..." />
                </div>
              </div>

              <Button 
                onClick={handleGenerate} 
                isLoading={status === GenerationState.LOADING}
                disabled={!formData.objective.trim() || status === GenerationState.LOADING}
                className="w-full h-16 text-lg font-black rounded-2xl shadow-xl bg-slate-900 border-none hover:scale-[1.01] transition-transform"
              >
                Gerar Contrato Completo
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden h-full">
            <div className="flex-1 flex flex-col overflow-hidden h-full p-4 md:p-8">
               <ContractEditor contract={currentContract} onSave={handleSave} />
            </div>
            
            <div className={`
              lg:block lg:relative lg:w-[420px] lg:h-full
              fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 bg-white
              ${isMobileChatOpen ? 'translate-y-0 h-[85vh] border-t rounded-t-3xl shadow-2xl' : 'translate-y-full lg:translate-y-0'}
              no-print
            `}>
              <ChatBot contractContent={currentContract.content} tone={currentContract.formData.tone} onRefine={handleRefineContract} />
            </div>

            <button onClick={() => setIsMobileChatOpen(!isMobileChatOpen)} className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 no-print transition-all active:scale-90">
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </button>
          </div>
        )}

        {showHistory && (
          <div className="fixed inset-0 z-[60] flex justify-end no-print">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowHistory(false)}></div>
            <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full animate-in slide-in-from-right">
              <div className="p-8 border-b flex items-center justify-between">
                <h3 className="text-2xl font-bold serif">Histórico de Contratos</h3>
                <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-full">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-slate-400 font-medium">Você ainda não gerou contratos.</div>
                ) : (
                  history.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => { setCurrentContract(c); setShowHistory(false); setStatus(GenerationState.SUCCESS); setErrorDetails(null); }}
                      className="p-5 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
                    >
                      <h4 className="font-bold text-slate-800 truncate mb-1 group-hover:text-indigo-600">{c.title}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(c.createdAt).toLocaleDateString()} • {c.formData.tone}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-100 py-4 px-8 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest no-print">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
          Sistema Ativo
        </div>
        <div>iJota • Gemini 3 Pro Enabled</div>
      </footer>
    </div>
  );
};

export default App;
