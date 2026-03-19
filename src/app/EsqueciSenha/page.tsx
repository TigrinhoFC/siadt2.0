"use client";

import React from 'react';
import Link from 'next/link';
import { Mail, Monitor, ArrowLeft } from 'lucide-react';

export default function RecuperarSenhaPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a233a] bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-white p-4 font-sans">
      
      {/* Logo e Título */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-500/20">
          <Monitor size={32} />
        </div>
        <h1 className="text-3xl font-bold">Recuperar senha</h1>
        <p className="text-gray-400 mt-2">
          Enviaremos instruções para o seu e-mail
        </p>
      </div>

      {/* Card Minimalista */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        <form className="space-y-6">
          
          {/* Campo E-mail com Ícone Interno */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">E-mail cadastrado</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                placeholder="seu@email.com.br"
                className="w-full bg-[#2d3748]/30 border border-white/10 rounded-lg pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-white"
              />
            </div>
          </div>

          {/* Botão Enviar */}
          <button 
            type="submit"
            className="w-full bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-700/20 transition-all transform active:scale-[0.98]"
          >
            Enviar instruções
          </button>
        </form>
      </div>

      {/* Botão de Voltar com ícone */}
      <Link 
        href="/Login" 
        className="mt-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Voltar para o login
      </Link>
    </div>
  );
}