"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Monitor, Loader2, AlertCircle, X, User, Mail, Lock } from 'lucide-react';

// Firebase
import { auth, db } from '@/firebase/config';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function CadastroPage() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  // --- CADASTRO COM GOOGLE ---
  const handleGoogleCadastro = async () => {
    setLoading(true);
    setErrorMsg(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Verifica se o documento do usuário já existe para não sobrescrever dados antigos
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
      setErrorMsg("Falha ao cadastrar com Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // --- CADASTRO MANUAL ---
  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome,
        email: email.trim(),
        nivelAcesso: "operador",
        criadoEm: new Date().toISOString()
      });

      router.push('/Dashboard');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg("Este e-mail já está em uso.");
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg("A senha deve ter no mínimo 6 caracteres.");
      } else {
        setErrorMsg("Erro ao criar conta. Verifique os dados.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white p-4 font-sans">
      
      {/* Logo SIADT */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
          <Monitor size={32} strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tighter">SIADT</h1>
        <p className="text-gray-400 mt-2 text-sm uppercase tracking-widest font-medium">Novo Cadastro</p>
      </div>

      <div className="w-full max-w-md bg-[#1e293b]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        
        {errorMsg && (
          <div className="mb-6 bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-200 font-medium flex-1">{errorMsg}</p>
            <button onClick={() => setErrorMsg(null)}><X size={18} className="text-red-500/50" /></button>
          </div>
        )}

        <form onSubmit={handleCadastro} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400 flex items-center gap-2">
              <User size={14} /> Nome Completo
            </label>
            <input 
              type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none text-white"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400 flex items-center gap-2">
              <Mail size={14} /> E-mail
            </label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none text-white"
              placeholder="nome@siadt.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-gray-400 flex items-center gap-2">
              <Lock size={14} /> Senha
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/50 outline-none text-white"
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Criar Conta"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1e293b] px-2 text-gray-500 font-bold">Ou cadastre-se com</span></div>
        </div>

        <button 
          onClick={handleGoogleCadastro} disabled={loading} type="button"
          className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3"
        >
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
        Já tem acesso? <Link href="/Login" className="text-blue-500 font-bold hover:underline">Fazer Login</Link>
      </p>
    </div>
  );
}