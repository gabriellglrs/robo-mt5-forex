"use client";

import React from 'react';
import { 
  History, Search, Calendar, 
  AlertCircle,
  Beaker, Download, Trash2
} from 'lucide-react';

interface LabRun {
  id: number;
  symbol: string;
  window_days: number;
  preset_id: string;
  status: string;
  created_at?: string;
  finished_at?: string;
  error_message?: string | null;
}

interface ExplorerTabProps {
  runs: LabRun[];
  onOpenDetail: (runId: number) => void;
  onExport: (runId: number) => void;
  onDelete: (runId: number) => void;
  onDeleteAll: () => void;
}

export default function ExplorerTab({ runs, onOpenDetail, onExport, onDelete, onDeleteAll }: ExplorerTabProps) {
  const [confirmDelete, setConfirmDelete] = React.useState<number | null>(null);
  const [confirmAll, setConfirmAll] = React.useState(false);

  const handleDelete = (e: React.MouseEvent, runId: number) => {
    e.stopPropagation();
    if (confirmDelete === runId) {
      onDelete(runId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(runId);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  const handleDeleteAll = () => {
    if (confirmAll) {
      onDeleteAll();
      setConfirmAll(false);
    } else {
      setConfirmAll(true);
      setTimeout(() => setConfirmAll(false), 5000);
    }
  };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Filters & Search Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">Histórico de Experimentos</h3>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Rastreabilidade completa de todas as simulações</p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:border-primary/50 outline-none transition-all"
              placeholder="Buscar por ativo ou preset..."
            />
          </div>
          
          <button 
            onClick={handleDeleteAll}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-[10px] font-black uppercase ${
              confirmAll 
                ? 'bg-red-500 border-red-500 text-white animate-pulse' 
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-red-400 hover:bg-red-500/10'
            }`}
          >
            <Trash2 className="w-3 h-3" />
            {confirmAll ? 'Clique para Confirmar' : 'Deletar Tudo'}
          </button>
        </div>
      </div>

      {/* Grid of Runs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {runs.map((run) => (
          <div 
            key={run.id}
            className="group glass p-6 rounded-[32px] border border-white/10 hover:border-primary/30 transition-all duration-300 relative overflow-hidden flex flex-col"
          >
            {/* Run Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] -mr-16 -mt-16 opacity-10 transition-colors ${
              run.status === 'done' ? 'bg-primary' : run.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm text-white">
                  {run.symbol.substring(0, 3)}
                </div>
                <div>
                  <h4 className="font-black text-white">{run.symbol}</h4>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-[10px] text-gray-500 font-bold uppercase">{run.window_days} DIAS</span>
                  </div>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                run.status === 'done' ? 'bg-primary/10 border-primary/30 text-primary' :
                run.status === 'failed' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
              }`}>
                {run.status}
              </div>

              {/* Delete Button */}
              <button 
                onClick={(e) => handleDelete(e, run.id)}
                className={`p-2 rounded-xl border transition-all ${
                  confirmDelete === run.id 
                    ? 'bg-red-500 border-red-500 text-white' 
                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-red-400 hover:border-red-500/30'
                }`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-bold uppercase">ID do Experimento</span>
                <span className="text-gray-300 font-mono">#LAB-{String(run.id).padStart(4, '0')}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-bold uppercase">Preset Aplicado</span>
                <span className="text-gray-300">{run.preset_id}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-500 font-bold uppercase">Iniciado em</span>
                <span className="text-gray-300">{run.created_at ? new Date(run.created_at).toLocaleString() : '-'}</span>
              </div>
              {run.error_message && (
                <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                  <p className="text-[9px] text-red-300 leading-tight italic line-clamp-2">{run.error_message}</p>
                </div>
              )}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3">
              <button 
                onClick={() => onOpenDetail(run.id)}
                disabled={run.status !== 'done'}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 bg-white/5 text-[10px] font-black uppercase text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Beaker className="w-3 h-3" />
                Explorar
              </button>
              <button 
                onClick={() => onExport(run.id)}
                disabled={run.status !== 'done'}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 bg-white/5 text-[10px] font-black uppercase text-gray-300 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <Download className="w-3 h-3" />
                Exportar
              </button>
            </div>
          </div>
        ))}

        {runs.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[40px] opacity-40">
            <History className="w-12 h-12 text-gray-500 mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Nenhum experimento encontrado</p>
            <p className="text-gray-600 text-[10px]">Dispare um novo teste no Cockpit para iniciar seu histórico.</p>
          </div>
        )}
      </div>
    </div>
  );
}
