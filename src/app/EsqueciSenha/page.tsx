"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Monitor, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

// Firebase
import { auth } from '@/firebase/config';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // Dispara o e-mail oficial do Firebase para o usuário
      await sendPasswordResetEmail(auth, email.trim());
      
      setStatus({
        type: 'success',
        message: 'Link enviado! Verifique sua caixa de entrada (e o spam).'
      });
      setEmail(''); // Limpa o campo após o sucesso
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Ocorreu um erro ao enviar o e-mail.";
      
      if (error.code === 'auth/user-not-found') {
        errorMsg = "Este e-mail não está cadastrado no sistema.";
      } else if (error.code === 'auth/invalid-email') {
        errorMsg = "Formato de e-mail inválido.";
      }

      setStatus({
        type: 'error',
        message: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a233a] bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-white p-4 font-sans">
      
      {/* Logo e Título */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-500/20">
          <Monitor size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Recuperar senha</h1>
        <p className="text-gray-400 mt-2 text-sm max-w-[250px]">
          Enviaremos um link para você definir uma nova senha.
        </p>
      </div>

      {/* Card Minimalista */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl transition-all">
        
        {/* Mensagens de Feedback */}
        {status && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
            status.type === 'success' ? 'bg-green-500/10 border border-green-500/50 text-green-400' : 'bg-red-500/10 border border-red-500/50 text-red-400'
          }`}>
            {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <p className="text-xs font-bold uppercase tracking-wide leading-tight">{status.message}</p>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-6">
          
          {/* Campo E-mail */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest mb-2 text-gray-400 ml-1">E-mail cadastrado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com.br"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-700 text-white"
              />
            </div>
          </div>

          {/* Botão Enviar */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              "Enviar instruções"
            )}
          </button>
        </form>
      </div>

      {/* Botão de Voltar */}
      <Link 
        href="/Login" 
        className="mt-8 flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
      >
        <ArrowLeft size={16} />
        Voltar para o login
      </Link>
    </div>
  );
}