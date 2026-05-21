"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Settings, Save, X, AlertCircle, Search, 
  Loader2, Trash2, ArrowLeft, BellRing 
} from 'lucide-react';
import { Toaster, toast } from 'sonner';


// Firebase
import { app, db, auth } from '@/firebase/config';
import { 
  collection, doc, onSnapshot, setDoc, query, updateDoc, writeBatch, deleteDoc 
} from 'firebase/firestore';
import { getMessaging, getToken } from "firebase/messaging";

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
  const [isPushLoading, setIsPushLoading] = useState(false);

  // Sincronização com Firebase
  useEffect(() => {
    const q = query(collection(db, "configuracoes"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        DEFAULTS.forEach((item) => {
          const docRef = doc(db, "configuracoes", item.id);
          batch.set(docRef, item);
        });
        batch.commit().catch(console.error);
      } else {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ConfigItem[];
        setConfigs(data);
      }
      setLoading(false);
    }, (err) => {
      toast.error("Erro de conexão com o banco de dados");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Função para Ativar Push (Estilo Defesa Civil)
  const handleAtivarPush = async () => {
    if (!auth.currentUser) return toast.error("Usuário não autenticado");
    
    setIsPushLoading(true);
    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const token = await getToken(messaging, { 
          vapidKey: "BP6NMdGm8-2Fp8Cnnwmg9YS4GpYiIg76xxR2N5bOzwdxpdBo1-qJ9Rj0Jrse_DhmoTa23L_VRtROAHCCBtwzuhw" 
        });
        
        if (token) {
          await updateDoc(doc(db, "usuarios", auth.currentUser.uid), {
            fcmToken: token,
            notificacoesAtivas: true
          });
          toast.success("Dispositivo cadastrado para alertas de emergência!");
        }
      } else {
        toast.error("Permissão de notificação negada pelo navegador.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao configurar notificações push.");
    } finally {
      setIsPushLoading(false);
    }
  };

  const handleOpenEdit = (config: ConfigItem) => {
    setEditingConfig({ ...config });
    setIsModalOpen(true);
  };

  const handleToggleAtivo = async (config: ConfigItem) => {
    try {
      await updateDoc(doc(db, "configuracoes", config.id), { ativo: !config.ativo });
      toast.success(`${config.key} atualizado`);
    } catch (e) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Deseja realmente excluir este parâmetro?")) return;
    try {
      await deleteDoc(doc(db, "configuracoes", id));
      toast.success("Configuração removida");
    } catch (e) {
      toast.error("Erro ao excluir");
    }
  };

  const handleSave = async () => {
    if (!editingConfig) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, "configuracoes", editingConfig.id), { ...editingConfig }, { merge: true });
      toast.success("Alterações aplicadas!");
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Erro ao salvar no servidor");
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
      <Toaster theme="dark" richColors position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        <Link href="/Dashboard" className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar ao Dashboard</span>
        </Link>

        <header className="mb-10">
          <p className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Painel de Controle</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Configurações Avançadas</h1>
          <p className="text-slate-500 text-sm">Gerencie os limiares de sensores e comportamentos do SIADT.</p>
        </header>

        {/* CARD DE PUSH NOTIFICATIONS (DESTAQUE) */}
        <section className="bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20 p-8 rounded-[2.5rem] mb-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <BellRing size={120} />
          </div>
          
          <div className="bg-blue-600 p-5 rounded-3xl shadow-xl shadow-blue-600/20 z-10">
            <AlertCircle size={32} className="text-white" />
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
            <h3 className="text-xl font-bold text-white tracking-tight">Alertas Críticos no Dispositivo</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-md leading-relaxed">
              Ative as notificações para receber avisos de evacuação e riscos de deslizamento em tempo real, mesmo com o navegador fechado.
            </p>
          </div>

          <button 
            onClick={handleAtivarPush}
            disabled={isPushLoading}
            className="z-10 bg-white text-blue-700 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all active:scale-95 shadow-xl flex items-center gap-2 disabled:opacity-50"
          >
            {isPushLoading ? <Loader2 className="animate-spin" size={16} /> : <BellRing size={16} />}
            Ativar Alertas Push
          </button>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <aside className="col-span-1 md:col-span-3 space-y-2">
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

          <div className="col-span-1 md:col-span-9 space-y-4">
            <div className="relative mb-8">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                placeholder="Buscar chave ou descrição..."
                className="w-full bg-[#161b2c] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:border-blue-500/50 transition-all text-white"
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {filtradas.map((config) => (
              <div key={config.id} className="bg-[#161b2c] border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row items-start md:items-center justify-between group hover:bg-[#1c2338] transition-all gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-white font-mono text-sm font-bold tracking-tight">{config.key}</h3>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-blue-500/10">{config.categoria}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">{config.desc}</p>
                  <div className="inline-block bg-black/30 border border-white/5 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-slate-600 font-bold uppercase mr-2">Valor Atual:</span>
                    <span className="text-xs font-mono font-bold text-blue-400">{config.valor} {config.unidade}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div 
                    onClick={() => handleToggleAtivo(config)}
                    className={`w-10 h-5 rounded-full relative cursor-pointer transition-all shrink-0 ${config.ativo ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.ativo ? 'right-1' : 'left-1'}`} />
                  </div>
                  <button onClick={() => handleOpenEdit(config)} className="p-3 bg-[#0b0f1a] text-slate-500 hover:text-white rounded-xl transition-all">
                    <Settings size={18} />
                  </button>
                  <button onClick={() => handleDelete(config.id)} className="p-3 bg-[#0b0f1a] text-slate-500 hover:text-red-500 rounded-xl transition-all">
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
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-white tracking-tight">Editar Parâmetro</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Novo Valor {editingConfig.unidade && `(${editingConfig.unidade})`}</label>
                <input 
                  autoFocus
                  type={editingConfig.tipo === 'number' ? 'number' : 'text'}
                  className="w-full bg-[#0b0f1a] border border-white/10 rounded-2xl px-6 py-4 text-white text-xl font-mono outline-none focus:border-blue-500"
                  value={editingConfig.valor}
                  onChange={(e) => setEditingConfig({...editingConfig, valor: e.target.value})}
                />
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:text-white text-sm">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}