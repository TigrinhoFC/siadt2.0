"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Monitor, CheckCircle2 } from 'lucide-react';

export default function CadastroPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a233a] bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-white p-4 font-sans">
      
      {/* Logo e Título */}
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-500/20">
          <Monitor size={32} />
        </div>
        <h1 className="text-3xl font-bold">Criar conta</h1>
        <p className="text-gray-400 mt-2 max-w-xs">
          Acesse o sistema de monitoramento de deslizamentos
        </p>
      </div>

      {/* Card de Cadastro */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        <form className="space-y-5">
          
          {/* Campo Nome */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Nome completo</label>
            <input 
              type="text" 
              placeholder="Dr. Matheus Henrique Santos De Castro"
              className="w-full bg-[#2d3748]/30 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-white"
            />
          </div>

          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">E-mail profissional</label>
            <input 
              type="email" 
              placeholder="matheus@gmail.com"
              className="w-full bg-[#2d3748]/30 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-white"
            />
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-[#2d3748]/30 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-white"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Caixa de Termos (Aquele box azul claro na imagem) */}
          <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
            <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <p className="text-xs text-gray-300 leading-relaxed">
              Ao criar uma conta, você concorda com os <a href="#" className="text-blue-400 hover:underline">Termos de Uso</a> e a <a href="#" className="text-blue-400 hover:underline">Política de Privacidade</a> do sistema.
            </p>
          </div>

          {/* Botão Criar Conta */}
          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-[0.98]"
          >
            Criar conta
          </button>
        </form>
      </div>

      {/* Rodapé - Link para voltar ao Login */}
      <p className="mt-8 text-gray-400 text-sm">
        Já tem uma conta? <Link href="/Login" className="text-blue-500 font-medium hover:underline">Fazer login</Link>
      </p>
    </div>
  );
}