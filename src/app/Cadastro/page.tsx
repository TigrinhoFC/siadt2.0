"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, Monitor, Loader2 } from 'lucide-react';

// Importações do Firebase
import { auth, db } from '@/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (senha.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      // 1. Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;

      // 2. Tenta salvar os dados no Firestore
      try {
        await setDoc(doc(db, "usuarios", user.uid), {
          nome: nome,
          email: email,
          uid: user.uid,
          dataCriacao: new Date().toISOString(),
          nivel: 'usuario'
        });
      } catch (firestoreError: any) {
        console.error("Erro ao salvar no Firestore:", firestoreError);
      
      }

      alert("Conta criada com sucesso!");
      router.push('/Dashboard');
      
    } catch (error: any) {
      console.error("Erro no cadastro:", error.code);
      
      let mensagem = "Ocorreu um erro ao criar a conta.";
      
      if (error.code === 'auth/email-already-in-use') {
        mensagem = "Este e-mail já está cadastrado.";
      } else if (error.code === 'auth/invalid-email') {
        mensagem = "Formato de e-mail inválido.";
      } else if (error.code === 'auth/network-request-failed') {
        mensagem = "Erro de conexão. Verifique sua internet.";
      }

      alert(mensagem);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a233a] bg-gradient-to-b from-[#1e293b] to-[#0f172a] text-white p-4 font-sans">
      
      {/* Cabeçalho */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg shadow-blue-500/20">
          <Monitor size={32} />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Criar Conta</h1>
        <p className="text-gray-400 mt-2">Sistema de Monitoramento SIADT</p>
      </div>

      {/* Card de Cadastro */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        <form onSubmit={handleCadastro} className="space-y-5">
          
          {/* Campo Nome */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">Nome Completo</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" 
                required
                disabled={loading}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Matheus Silva"
                className="w-full bg-[#2d3748]/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Campo E-mail */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="email" 
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-[#2d3748]/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                disabled={loading}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-[#2d3748]/40 border border-white/10 rounded-lg pl-10 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Botão de Envio */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Criando conta...
              </>
            ) : (
              "Finalizar Cadastro"
            )}
          </button>
        </form>
      </div>

      {/* Link para Login */}
      <p className="mt-8 text-gray-400 text-sm">
        Já possui uma conta?{' '}
        <Link href="/Login" className="text-blue-500 font-medium hover:underline">
          Fazer Login
        </Link>
      </p>
    </div>
  );
}