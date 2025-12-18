
import React, { useState, useEffect } from 'react';
import { Contract } from '../types';
import { Button } from './Button';

interface ContractEditorProps {
  contract: Contract;
  onSave: (content: string) => void;
}

export const ContractEditor: React.FC<ContractEditorProps> = ({ contract, onSave }) => {
  const [content, setContent] = useState(contract.content);

  useEffect(() => {
    setContent(contract.content);
  }, [contract.content]);

  const handleDownloadWord = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
            "xmlns:w='urn:schemas-microsoft-com:office:word' " +
            "xmlns='http://www.w3.org/TR/REC-html40'>" +
            "<head><meta charset='utf-8'><style>body { font-family: 'Times New Roman'; line-height: 1.5; padding: 2cm; }</style></head><body>";
    const footer = "</body></html>";
    const formattedContent = content.split('\n').map(line => line.trim() === '' ? '<br>' : `<p>${line}</p>`).join('');
    const sourceHTML = header + formattedContent + footer;
    
    const blob = new Blob(['\ufeff', sourceHTML], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${contract.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl lg:rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra de Ferramentas Responsiva */}
      <div className="flex items-center justify-between px-3 py-3 md:px-4 md:py-4 border-b border-slate-100 bg-slate-50 no-print">
        <h2 className="text-xs md:text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight truncate max-w-[45%] md:max-w-[50%]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600 shrink-0"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
          {contract.title || "Novo Contrato"}
        </h2>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={handleDownloadWord} 
            title="Baixar Word"
            className="flex items-center justify-center h-9 px-3 rounded-lg border border-slate-200 text-slate-600 hover:bg-white hover:border-indigo-500 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span className="ml-2 text-[10px] md:text-xs font-bold uppercase">Exportar Word</span>
          </button>
          <button 
            onClick={() => onSave(content)} 
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase hover:bg-indigo-600 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>

      {/* Editor com Padding Dinâmico */}
      <div className="flex-1 overflow-auto p-2 md:p-4 lg:p-8 bg-slate-100/50 no-print h-full">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full min-h-[500px] md:min-h-[800px] p-5 md:p-10 lg:p-16 bg-white border border-slate-200 shadow-sm rounded-lg md:rounded-sm focus:ring-0 font-serif text-slate-900 text-sm md:text-base lg:text-lg leading-relaxed resize-none transition-shadow outline-none"
          placeholder="Comece a editar seu contrato aqui..."
          spellCheck={false}
        />
      </div>
    </div>
  );
};
