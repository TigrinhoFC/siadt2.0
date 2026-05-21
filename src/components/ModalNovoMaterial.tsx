"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2'; // Importando SweetAlert2

// Firebase
import { db } from '@/firebase/config';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Configuração base para as notificações tipo "Toast" (aquelas que aparecem no canto)
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#1e293b',
  color: '#fff',
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
});

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  dadosParaEditar?: any;
}

export default function ModalNovoMaterial({ isOpen, onClose, dadosParaEditar }: ModalProps) {
  const [loading, setLoading] = useState(false);
  
  const initialState = {
    nome: '',
    categoria: 'Equipamento',
    status: 'Disponível',
    quantidade: 1,
    unidade: '',
    localizacao: '',
    responsavel: '',
    observacoes: ''
  };

  const [formData, setFormData] = useState(initialState);

  useEffect(() => {
    if (dadosParaEditar) {
      setFormData({
        nome: dadosParaEditar.nome || '',
        categoria: dadosParaEditar.categoria || 'Equipamento',
        status: dadosParaEditar.status || 'Disponível',
        quantidade: dadosParaEditar.quantidade || 1,
        unidade: dadosParaEditar.unidade || '',
        localizacao: dadosParaEditar.localizacao || '',
        responsavel: dadosParaEditar.responsavel || '',
        observacoes: dadosParaEditar.observacoes || ''
      });
    } else {
      setFormData(initialState);
    }
  }, [dadosParaEditar, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        quantidade: Number(formData.quantidade),
        atualizadoEm: serverTimestamp(),
      };

      if (dadosParaEditar?.id) {
        // MODO EDIÇÃO
        const docRef = doc(db, "materiais", dadosParaEditar.id);
        await updateDoc(docRef, payload);
        Toast.fire({
          icon: 'success',
          title: 'Alterações salvas com sucesso!'
        });
      } else {
        // MODO CRIAÇÃO
        await addDoc(collection(db, "materiais"), {
          ...payload,
          criadoEm: serverTimestamp(),
        });
        Toast.fire({
          icon: 'success',
          title: 'Material cadastrado com sucesso!'
        });
      }

      setFormData(initialState);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar no Firestore:", error);
      Swal.fire({
        icon: 'error',
        title: 'Ops...',
        text: 'Não foi possível salvar as alterações.',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e293b] w-full max-w-lg rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-white/5">
          <h2 className="text-xl font-bold text-white">
            {dadosParaEditar ? 'Editar Material' : 'Novo Material'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Nome */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Nome</label>
            <input 
              type="text" required
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Categoria */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Categoria</label>
              <select 
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none appearance-none"
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
              >
                <option value="Equipamento">Equipamento</option>
                <option value="Veículo">Veículo</option>
                <option value="Ferramenta">Ferramenta</option>
                <option value="EPI">EPI</option>
                <option value="Insumo">Insumo</option>
              </select>
            </div>
            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Status</label>
              <select 
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none appearance-none"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="Disponível">Disponível</option>
                <option value="Em Uso">Em Uso</option>
                <option value="Manutenção">Manutenção</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Quantidade</label>
              <input 
                type="number" required
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                value={formData.quantidade}
                onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Unidade</label>
              <input 
                type="text" placeholder="ex: unid, kg, m"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                value={formData.unidade}
                onChange={(e) => setFormData({...formData, unidade: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Localização</label>
              <input 
                type="text"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                value={formData.localizacao}
                onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Responsável</label>
              <input 
                type="text"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                value={formData.responsavel}
                onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Observações</label>
            <textarea 
              rows={2}
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white outline-none resize-none text-sm"
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all border border-white/5"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}   