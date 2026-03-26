"use client";

import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';

import { 
  Bell, AlertTriangle, Zap, Search, 
  User, MapPin, CheckCircle2, Clock, Plus, Loader2, X
} from 'lucide-react';

// Firebase
import { db } from '@/firebase/config';
import { 
  collection, query, orderBy, onSnapshot, 
  doc, updateDoc, serverTimestamp, addDoc 
} from 'firebase/firestore';

// =========================
// 🧩 SUBCOMPONENTES
// =========================

const AlertaCard = ({ alerta }: { alerta: any }) => {
  const isCritico = alerta.severidade === 'Emergência' || alerta.severidade === 'Crítico';
  const isAtivo = alerta.status === 'Ativo';

  const encerrarAlerta = async () => {
    toast("Encerrar alerta?", {
      description: `Tem certeza que deseja finalizar o alerta da área ${alerta.area}?`,
      action: {
        label: "Confirmar",
        onClick: async () => {
          const toastId = toast.loading("Encerrando alerta...");
          try {
            await updateDoc(doc(db, "alertas", alerta.id), {
              status: "Encerrado",
              encerradoEm: serverTimestamp()
            });
            toast.success("Alerta encerrado com sucesso", { id: toastId });
          } catch (error) {
            toast.error("Erro ao encerrar o alerta", { id: toastId });
          }
        },
      },
      cancel: { label: "Cancelar", onClick: () => toast.dismiss() },
    });
  };

  return (
    <div className={`relative group border rounded-2xl p-4 mb-3 transition-all ${
      isCritico 
        ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' 
        : 'bg-[#161f33] border-white/5 hover:border-white/10'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${
            isCritico ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'
          }`}>
            {isCritico ? <Zap size={20} /> : <AlertTriangle size={20} />}
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-white font-bold text-sm md:text-base">{alerta.titulo || alerta.area}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isCritico ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
              }`}>
                {alerta.severidade}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${
                isAtivo ? 'border-green-500/50 text-green-500' : 'border-gray-500/50 text-gray-500'
              }`}>
                {isAtivo ? 'Ativo' : 'Encerrado'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-[11px] text-gray-400">
              <span className="flex items-center gap-1"><MapPin size={12} /> {alerta.area}</span>
              <span className="flex items-center gap-1"><User size={12} /> {alerta.emissor || "Sistema"}</span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> 
                {alerta.timestamp?.toDate ? alerta.timestamp.toDate().toLocaleString('pt-BR') : 'Agora mesmo'}
              </span>
            </div>
            {alerta.descricao && (
              <p className="text-xs text-gray-500 mt-2 italic">"{alerta.descricao}"</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center">
          {isAtivo ? (
            <button 
              onClick={encerrarAlerta}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-red-500 hover:text-white text-gray-400 text-xs font-bold transition-all border border-white/5"
            >
              Encerrar
            </button>
          ) : (
            <div className="flex items-center gap-1 text-gray-500 text-xs font-medium px-3">
              <CheckCircle2 size={14} className="text-green-500/50" /> Finalizado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeaderStat = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-[#161f33] border border-white/5 rounded-2xl p-5 flex-1 min-w-[200px]">
    <div className="flex justify-between items-center mb-2">
      <span className="text-gray-400 text-xs font-bold uppercase tracking-widest">{label}</span>
      <Icon size={18} className={color} />
    </div>
    <div className="text-3xl font-black text-white">{value}</div>
  </div>
);

// =========================
// 🚀 TELA PRINCIPAL
// =========================

export default function AlertasEmitidos() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    severidade: 'Informativo',
    status: 'Ativo',
    area: '',
    emissor: '',
    descricao: ''
  });

  useEffect(() => {
    const q = query(collection(db, "alertas"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setAlertas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      toast.error("Erro ao carregar alertas");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // INTEGRAÇÃO COM FIREBASE
  const handleEmitirAlerta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo || !formData.area) {
      return toast.warning("Título e Área são obrigatórios.");
    }

    const toastId = toast.loading("Registrando alerta no banco de dados...");
    
    try {
      await addDoc(collection(db, "alertas"), {
        titulo: formData.titulo,
        severidade: formData.severidade,
        status: formData.status,
        area: formData.area,
        emissor: formData.emissor || "Sistema",
        descricao: formData.descricao,
        timestamp: serverTimestamp()
      });

      toast.success("🚨 ALERTA EMITIDO COM SUCESSO!", { id: toastId });
      setIsModalOpen(false);
      
      // Reseta o formulário
      setFormData({ 
        titulo: '', severidade: 'Informativo', status: 'Ativo', 
        area: '', emissor: '', descricao: '' 
      });

    } catch (error) {
      console.error(error);
      toast.error("Falha ao conectar com o Firebase.", { id: toastId });
    }
  };

  const alertasFiltrados = alertas.filter(a => {
    const area = a.area || "";
    const matchesSearch = area.toLowerCase().includes(filtro.toLowerCase());
    const matchesStatus = statusFiltro === "Todos" || a.status === statusFiltro;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: alertas.length,
    ativos: alertas.filter(a => a.status === 'Ativo').length,
    criticos: alertas.filter(a => (a.severidade === 'Emergência' || a.severidade === 'Crítico') && a.status === 'Ativo').length
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6">
      <Toaster theme="dark" position="top-right" richColors closeButton />

      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">Sistema de Monitoramento</p>
            <h1 className="text-3xl font-bold">Alertas Emitidos</h1>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Emitir Alerta
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-10">
          <HeaderStat label="Total de Alertas" value={stats.total} icon={Bell} color="text-blue-500" />
          <HeaderStat label="Alertas Ativos" value={stats.ativos} icon={AlertTriangle} color="text-green-500" />
          <HeaderStat label="Críticos Ativos" value={stats.criticos} icon={Zap} color="text-red-500" />
        </div>

        <div className="bg-[#161f33] border border-white/5 rounded-2xl p-3 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar alertas por área..." 
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <select 
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-sm font-medium outline-none cursor-pointer"
          >
            <option value="Todos">Todos Status</option>
            <option value="Ativo">Ativos</option>
            <option value="Encerrado">Encerrados</option>
          </select>
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <p className="text-gray-500 text-sm">Carregando dados...</p>
            </div>
          ) : alertasFiltrados.length > 0 ? (
            alertasFiltrados.map((alerta) => (
              <AlertaCard key={alerta.id} alerta={alerta} />
            ))
          ) : (
            <div className="text-center py-20 bg-[#161f33]/30 border border-dashed border-white/10 rounded-3xl">
              <Bell className="mx-auto text-gray-700 mb-4" size={48} />
              <p className="text-gray-500 font-medium">Nenhum alerta encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE EMISSÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161f33] border border-white/10 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-white/5 text-white">
              <h2 className="text-xl font-bold">Emitir Novo Alerta</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEmitirAlerta} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Título do Alerta</label>
                <input 
                  type="text" 
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                  placeholder="Ex: Risco de Escorregamento"
                  value={formData.titulo}
                  onChange={e => setFormData({...formData, titulo: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Severidade</label>
                  <select 
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                    value={formData.severidade}
                    onChange={e => setFormData({...formData, severidade: e.target.value})}
                  >
                    <option>Informativo</option>
                    <option>Atenção</option>
                    <option>Crítico</option>
                    <option>Emergência</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Área / Local</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
                    value={formData.area}
                    onChange={e => setFormData({...formData, area: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Emitido Por</label>
                <input 
                  type="text" 
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                  placeholder="Nome do Técnico"
                  value={formData.emissor}
                  onChange={e => setFormData({...formData, emissor: e.target.value})}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Descrição</label>
                <textarea 
                  rows={3}
                  className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                  value={formData.descricao}
                  onChange={e => setFormData({...formData, descricao: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 py-3 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl">Emitir Alerta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}