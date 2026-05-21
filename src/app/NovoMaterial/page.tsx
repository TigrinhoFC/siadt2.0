"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Importado para navegação
import { 
  Search, Plus, Package, MapPin, User, 
  Settings, Trash2, Loader2, ArrowLeft // Importado ArrowLeft
} from 'lucide-react';
import Swal from 'sweetalert2';

// Firebase
import { db } from '@/firebase/config';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  doc,
  deleteDoc
} from 'firebase/firestore';

// Componente do Modal
import ModalNovoMaterial from '@/components/ModalNovoMaterial';

interface Material {
  id?: string;
  nome: string;
  categoria: 'Veículo' | 'Ferramenta' | 'EPI' | 'Equipamento' | 'Insumo';
  status: 'Disponível' | 'Em Uso' | 'Manutenção';
  quantidade: number;
  unidade: string;
  localizacao: string; 
  responsavel: string;
  observacoes?: string;
}

export default function MateriaisPage() {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [materialParaEditar, setMaterialParaEditar] = useState<Material | null>(null);

  useEffect(() => {
    const q = query(collection(db, "materiais"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Material[];
      setMateriais(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleExcluir = async (id: string, nome: string) => {
    const result = await Swal.fire({
      title: 'Excluir Material?',
      text: `Deseja realmente remover "${nome}" do inventário?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#334155',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar',
      background: '#1e293b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, "materiais", id));
        Swal.fire({
          title: 'Removido!',
          text: 'O item foi excluído com sucesso.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          background: '#1e293b',
          color: '#fff'
        });
      } catch (error) {
        console.error("Erro ao excluir:", error);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: 'Não foi possível excluir o material.',
          background: '#1e293b',
          color: '#fff'
        });
      }
    }
  };

  const handleAbrirEdicao = (material: Material) => {
    setMaterialParaEditar(material);
    setIsModalOpen(true);
  };

  const handleFecharModal = () => {
    setIsModalOpen(false);
    setMaterialParaEditar(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Disponível': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'Em Uso': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Manutenção': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-slate-500/10 text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans">
      
      {/* BOTÃO VOLTAR */}
      <Link 
        href="/Dashboard" 
        className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Voltar ao Dashboard</span>
      </Link>

      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <p className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Sistema de Monitoramento</p>
          <h1 className="text-3xl font-bold tracking-tight">Materiais Disponíveis</h1>
          <p className="text-slate-400 text-sm mt-1">Gerenciamento de inventário em tempo real</p>
        </div>

        <button 
          onClick={() => {
            setMaterialParaEditar(null);
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus size={20} /> Novo Material
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total de Itens', val: materiais.length, color: 'text-blue-500' },
          { label: 'Disponíveis', val: materiais.filter(m => m.status === 'Disponível').length, color: 'text-green-500' },
          { label: 'Em Uso', val: materiais.filter(m => m.status === 'Em Uso').length, color: 'text-blue-400' },
          { label: 'Em Manutenção', val: materiais.filter(m => m.status === 'Manutenção').length, color: 'text-orange-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-[#1e293b]/50 border border-white/5 p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Bar de Busca */}
      <div className="bg-[#1e293b]/30 border border-white/5 p-4 rounded-2xl mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar material..."
            className="w-full bg-[#0f172a] border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Grid de Materiais */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Loader2 className="animate-spin mb-4" size={40} />
          <p className="font-medium tracking-wide">Sincronizando banco de dados...</p>
        </div>
      ) : materiais.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-white/5 rounded-[40px] bg-[#1e293b]/10">
          <Package size={60} className="text-slate-800 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materiais
            .filter(m => m.nome.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((item) => (
            <div key={item.id} className="bg-[#1e293b]/40 border border-white/5 rounded-3xl p-6 hover:bg-[#1e293b]/60 transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg tracking-tight">{item.nome}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                  <button 
                    onClick={() => handleAbrirEdicao(item)}
                    className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"
                  >
                    <Settings size={18} />
                  </button>
                  <button 
                    onClick={() => handleExcluir(item.id!, item.nome)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mb-6">
                <span className="bg-blue-600/10 text-blue-400 text-[9px] font-black px-3 py-1 rounded-lg border border-blue-500/10 uppercase tracking-tighter">
                  {item.categoria}
                </span>
                <span className={`text-[9px] font-black px-3 py-1 rounded-lg border uppercase flex items-center gap-1.5 ${getStatusColor(item.status)}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                  {item.status}
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-[#0f172a]/40 rounded-2xl p-4 flex justify-between items-center border border-white/[0.03]">
                   <div className="flex items-center gap-3 text-slate-500">
                      <Package size={16} />
                      <span className="text-[11px] font-bold uppercase tracking-tighter">Estoque</span>
                   </div>
                   <span className="font-black text-white">{item.quantidade} <span className="text-slate-500 font-medium text-xs uppercase">{item.unidade}</span></span>
                </div>

                <div className="px-1 space-y-2 text-slate-400 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-blue-500/50" /> <span>{item.localizacao}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-blue-500/50" /> <span>{item.responsavel}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalNovoMaterial 
        isOpen={isModalOpen} 
        onClose={handleFecharModal} 
        dadosParaEditar={materialParaEditar}
      />
      
    </div>
  );
}