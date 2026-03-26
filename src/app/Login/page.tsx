"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff as EyeOffIcon, Monitor, Loader2, AlertCircle, X, UserPlus, Send } from 'lucide-react';

// Firebase
import { auth, db } from '@/firebase/config';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  sendPasswordResetEmail // Importado para recuperação de senha
} from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false); // Loading específico para o reset
  const [error, setError] = useState<{ message: string; isNewUser: boolean; isSuccess?: boolean } | null>(null);
  
  const router = useRouter();

  // --- FUNÇÃO RECUPERAR SENHA ---
  const handleForgotPassword = async () => {
    if (!email) {
      setError({ message: "Digite seu e-mail para receber o link de recuperação.", isNewUser: false });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError({ 
        message: "E-mail de recuperação enviado! Verifique sua caixa de entrada.", 
        isNewUser: false,
        isSuccess: true 
      });
    } catch (err: any) {
      setError({ message: "Erro ao enviar e-mail. Verifique se o endereço está correto.", isNewUser: false });
    } finally {
      setResetLoading(false);
    }
  };

  // --- FUNÇÃO LOGIN COM GOOGLE ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "usuarios", user.uid));

      if (!userDoc.exists()) {
        await setDoc(doc(db, "usuarios", user.uid), {
          nome: user.displayName || "Usuário Google",
          email: user.email,
          nivelAcesso: "operador",
          criadoEm: new Date().toISOString()
        });
      }

      router.push('/Dashboard');
    } catch (err: any) {
      console.error(err);
      setError({ message: "Erro ao autenticar com Google.", isNewUser: false });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const usuariosRef = collection(db, "usuarios");
      const q = query(usuariosRef, where("email", "==", email.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError({ message: "E-mail não encontrado. Deseja cadastrar?", isNewUser: true });
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push('/Dashboard');
    } catch (err: any) {
      setError({ message: "Senha incorreta ou erro de acesso.", isNewUser: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-4 font-sans">
      
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          <Monitor size={32} strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter">SIADT</h1>
        <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-medium">Acesso ao Sistema</p>
      </div>

      <div className="w-full max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative">
        
        {error && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 ${
            error.isSuccess ? 'bg-green-500/10 border-green-500/50 text-green-400' :
            error.isNewUser ? 'bg-blue-500/10 border-blue-500/50' : 'bg-red-500/10 border-red-500/50'
          }`}>
            {error.isSuccess ? <Send size={20} /> : error.isNewUser ? <UserPlus className="text-blue-400 shrink-0" size={20} /> : <AlertCircle className="text-red-500 shrink-0" size={20} />}
            <div className="flex-1">
              <p className="text-sm font-medium">{error.message}</p>
              {error.isNewUser && <Link href="/Cadastro" className="text-xs font-bold text-blue-400 underline mt-1 block">Criar conta agora</Link>}
            </div>
            <button onClick={() => setError(null)} className="opacity-50 hover:opacity-100"><X size={18} /></button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400">E-mail</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white" placeholder="exemplo@siadt.com" />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Senha</label>
              {/* BOTÃO ESQUECI MINHA SENHA */}
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-widest"
              >
                {resetLoading ? "Enviando..." : "Esqueci minha senha"}
              </button>
            </div>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-white" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {showPassword ? <EyeOffIcon size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Entrar com E-mail"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1e293b] px-2 text-gray-500 font-bold">Ou continue com</span></div>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
        >
          {/* SVG do Google mantido */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google
        </button>
      </div>

      <p className="mt-8 text-gray-500 text-sm">
        Novo operador? <Link href="/Cadastro" className="text-blue-500 font-bold hover:underline">Solicitar Cadastro</Link>
      </p>
    </div>
  );
}