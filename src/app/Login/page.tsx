"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff as EyeOffIcon, Monitor, Loader2 } from 'lucide-react';

// Importações do Firebase
import { auth } from '@/firebase/config'; // Certifique-se que o caminho está correto
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // Estado para o carregamento
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Realiza a autenticação com Firebase
      await signInWithEmailAndPassword(auth, email, password);
      
      // Se tiver sucesso, redireciona para o Dashboard
      router.push('/Dashboard');
    } catch (error: any) {
      // Tratamento de erros comuns do Firebase
      console.error("Erro ao fazer login:", error.code);
      
      let mensagemErro = "Ocorreu um erro ao entrar. Tente novamente.";
      
      if (error.code === 'auth/invalid-credential') {
        mensagemErro = "E-mail ou senha incorretos.";
      } else if (error.code === 'auth/user-not-found') {
        mensagemErro = "Usuário não encontrado.";
      } else if (error.code === 'auth/too-many-requests') {
        mensagemErro = "Muitas tentativas falhas. Tente mais tarde.";
      }

      alert(mensagemErro);
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
        <h1 className="text-3xl font-bold tracking-tight">Login</h1>
        <p className="text-gray-400 mt-2">Acesse o sistema de monitoramento</p>
      </div>

      {/* Card de Login com Glassmorphism */}
      <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Campo E-mail */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">E-mail</label>
            <input 
              type="email" 
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="matheus@gmail.com"
              className="w-full bg-[#2d3748]/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-white disabled:opacity-50"
            />
          </div>

          {/* Campo Senha */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Senha</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#2d3748]/40 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-gray-600 text-white disabled:opacity-50"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOffIcon size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Opções Extras */}
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0" 
              />
              <span className="text-gray-300 group-hover:text-white transition-colors">Lembrar do Usuario</span>
            </label>
            <Link 
              href="/EsqueciSenha" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>

          {/* Botão Entrar */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:bg-blue-800 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>
      </div>

      {/* Rodapé */}
      <p className="mt-8 text-gray-400 text-sm">
        Não tem uma conta?{' '}
        <Link href="/Cadastro" className="text-blue-500 font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}