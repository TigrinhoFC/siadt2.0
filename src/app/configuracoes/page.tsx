"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, Save, X, Info, AlertCircle, Shield, Search, 
  Loader2, RefreshCcw, Trash2 
} from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Firebase
import { db } from '@/firebase/config'; 
import { 
  collection, doc, onSnapshot, setDoc, query, updateDoc, writeBatch 
} from 'firebase/firestore';

interface ConfigItem {
  id: string;
  key: string;
  categoria: string;
  desc: string;
  valor: string;
  unidade: string;
  tipo: 'number' | 'text' | 'boolean';
  ativo: boolean;
}

// Dados para popular o banco caso esteja vazio (Baseado na sua imagem)
const DEFAULTS: ConfigItem[] = [
  { id: '1', key: 'alerta.threshold.chuva', categoria: 'Alertas', desc: 'Limite de chuva (mm/24h) para emissão automática de alerta', valor: '80', unidade: 'mm', tipo: 'number', ativo: true },
  { id: '2', key: 'alerta.threshold.movimento', categoria: 'Alertas', desc: 'Limite de movimentação do solo (mm/h) para alerta de atenção', valor: '2', unidade: 'mm/h', tipo: 'number', ativo: true },
  { id: '3', key: 'notificacao.email.ativo', categoria: 'Notificações', desc: 'Ativa envio de e-mail ao emitir alertas críticos', valor: 'true', unidade: '', tipo: 'text', ativo: true },
  { id: '4', key: 'notificacao.sms.ativo', categoria: 'Notificações', desc: 'Ativa envio de SMS para responsáveis cadastrados', valor: 'false', unidade: '', tipo: 'text', ativo: false },
  { id: '5', key: 'sistema.intervalo.coleta', categoria: 'Monitoramento', desc: 'Intervalo de coleta dos sensores em segundos', valor: '300', unidade: 'seg', tipo: 'number', ativo: true },
  { id: '6', key: 'sistema.retencao.dados', categoria: 'Sistema', desc: 'Tempo de retenção dos dados históricos em dias', valor: '365', unidade: 'dias', tipo: 'number', ativo: true },
  { id: '7', key: 'monitoramento.sensores.ativos', categoria: 'Monitoramento', desc: 'Número de sensores ativos no sistema', valor: '12', unidade: '', tipo: 'number', ativo: true },
];

export default function ConfiguracoesPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('Todas');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "configuracoes"));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // SE O BANCO ESTIVER VAZIO, ELE CRIA OS DADOS AUTOMATICAMENTE
        const batch = writeBatch(db);
        DEFAULTS.forEach((item) => {
          const docRef = doc(db, "configuracoes", item.id);
          batch.set(docRef, item);
        });
        await batch.commit();
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ConfigItem[];
        setConfigs(data);
      }
      setLoading(false);
    }, (err) => {
      console.error("Erro de permissão ou conexão:", err);
      toast.error("Erro ao conectar com o Firebase");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenEdit = (config: ConfigItem) => {
    setEditingConfig({ ...config });
    setIsModalOpen(true);
  };

  const handleToggleAtivo = async (config: ConfigItem) => {
    try {
      await updateDoc(doc(db, "configuracoes", config.id), { ativo: !config.ativo });
      toast.success("Status atualizado");
    } catch (e) {
      toast.error("Erro ao atualizar status");
    }
  };

  const handleSave = async () => {
    if (!editingConfig) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "configuracoes", editingConfig.id), { ...editingConfig }, { merge: true });
      toast.success("Salvo com sucesso!");
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const filtradas = configs.filter(c => 
    (filtro === 'Todas' || c.categoria === filtro) &&
    (c.key.toLowerCase().includes(busca.toLowerCase()) || c.desc.toLowerCase().includes(busca.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-300 p-8 font-sans">
      <Toaster theme="dark" richColors />
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10">
          <p className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Sistema de Monitoramento</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Configurações</h1>
          <p className="text-slate-500 text-sm">Parâmetros e preferências do sistema</p>
        </header>

        <div className="grid grid-cols-12 gap-8">
          {/* Sidebar de Categorias */}
          <aside className="col-span-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest ml-4 mb-4">Categorias</p>
            {['Todas', 'Alertas', 'Notificações', 'Sistema', 'Monitoramento'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFiltro(cat)}
                className={`w-full flex justify-between px-5 py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  filtro === cat ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:bg-white/5'
                }`}
              >
                {cat}
                <span className="opacity-40">{configs.filter(c => cat === 'Todas' || c.categoria === cat).length}</span>
              </button>
            ))}
          </aside>

          {/* Listagem de Configurações */}
          <div className="col-span-9 space-y-4">
            <div className="relative mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                placeholder="Buscar configuração..."
                className="w-full bg-[#161b2c] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:border-blue-500/50 transition-all"
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {filtradas.map((config) => (
              <div key={config.id} className="bg-[#161b2c] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:bg-[#1c2338] transition-all">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-mono text-sm font-bold tracking-tight">{config.key}</h3>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-blue-500/10">{config.categoria}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{config.desc}</p>
                  <div className="inline-block bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-600 font-bold uppercase mr-2">Valor:</span>
                    <span className="text-xs font-mono font-bold text-blue-400">{config.valor} {config.unidade}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => handleToggleAtivo(config)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${config.ativo ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.ativo ? 'right-1' : 'left-1'}`} />
                  </div>
                  <button onClick={() => handleOpenEdit(config)} className="p-3 bg-[#0b0f1a] text-slate-500 hover:text-white rounded-xl transition-all">
                    <Settings size={18} />
                  </button>
                  <button className="p-3 bg-[#0b0f1a] text-slate-500 hover:text-red-500 rounded-xl transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {isModalOpen && editingConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !isSaving && setIsModalOpen(false)} />
          <div className="relative bg-[#1c2237] border border-white/10 w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-white mb-8 tracking-tight">Ajustar Parâmetro</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Novo Valor ({editingConfig.unidade || 'un'})</label>
                <input 
                  autoFocus
                  className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl px-6 py-4 text-white text-xl font-mono outline-none focus:border-blue-500"
                  value={editingConfig.valor}
                  onChange={(e) => setEditingConfig({...editingConfig, valor: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:text-white text-sm">Cancelar</button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Aplicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}