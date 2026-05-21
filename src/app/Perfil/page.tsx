"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, User, Mail, Shield, Save, 
  LogOut, Loader2, Phone, Building2,
  Monitor // Importado para a Logo
} from 'lucide-react';
import { auth, db } from '@/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Toaster, toast } from 'sonner';

export default function Perfil() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  // Estados dos campos editáveis
  const [departamento, setDepartamento] = useState('');
  const [telefone, setTelefone] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({ ...data, email: user.email });
          setDepartamento(data.departamento || '');
          setTelefone(data.telefone || '');
        }
        setLoading(false);
      } else {
        router.push('/Login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setUpdating(true);
    try {
      const userRef = doc(db, "usuarios", auth.currentUser.uid);
      await updateDoc(userRef, {
        departamento,
        telefone
      });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/Login');
  };

  // Função para pegar as iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return "??";
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070d19] text-white font-sans pb-12">
      <Toaster theme="dark" richColors />

      {/* HEADER / NAVBAR COM A LOGO IGUAL AO DASHBOARD */}
      <nav className="border-b border-white/5 bg-[#1e293b]/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex justify-between items-center">
          
          {/* Logo (Identica ao Dashboard) */}
          <div 
            className="flex items-center gap-2 text-blue-500 font-black text-2xl tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/Dashboard')}
          >
            <div className="bg-blue-500 text-white p-1 rounded-lg">
              <Monitor size={20} strokeWidth={3} />
            </div>
            <span className="hidden sm:block">SIADT</span>
          </div>

          <button 
            onClick={() => router.push('/Dashboard')}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-all"
          >
            <ArrowLeft size={16} /> Voltar
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 mt-12">
        <h1 className="text-3xl font-black mb-10 tracking-tight">Meu Perfil</h1>

        <div className="space-y-6">
          
          {/* CARD DE IDENTIFICAÇÃO RÁPIDA */}
          <section className="bg-[#1e293b]/30 border border-white/5 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
            <div className="h-28 w-28 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl font-black shadow-blue-500/20 shadow-2xl">
              {getInitials(userData?.nome)}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold">{userData?.nome}</h2>
              <div className="flex items-center justify-center md:justify-start gap-2 text-gray-500 text-sm mt-1">
                <Mail size={14} /> {userData?.email}
              </div>
              <div className="mt-4 inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest">
                <Shield size={12} fill="currentColor" /> Administrador
              </div>
            </div>
          </section>

          {/* SEÇÃO DE INFORMAÇÕES PESSOAIS */}
          <section className="bg-[#1e293b]/30 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-8 border-b border-white/5">
              <h3 className="font-bold text-lg flex items-center gap-2">
                Informações Pessoais
              </h3>
            </div>
            
            <form onSubmit={handleUpdate} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Campos desabilitados */}
                <div className="space-y-2 opacity-60">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome Completo</label>
                  <input 
                    type="text" 
                    value={userData?.nome} 
                    readOnly 
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed outline-none"
                  />
                  <p className="text-[9px] text-gray-600 italic">Gerenciado pela plataforma</p>
                </div>

                <div className="space-y-2 opacity-60">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">E-mail</label>
                  <input 
                    type="email" 
                    value={userData?.email} 
                    readOnly 
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-400 cursor-not-allowed outline-none"
                  />
                  <p className="text-[9px] text-gray-600 italic">Gerenciado pela plataforma</p>
                </div>

                {/* Campos editáveis */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Building2 size={12} /> Departamento / Instituição
                  </label>
                  <input 
                    type="text" 
                    placeholder="Ex: Defesa Civil de SP"
                    value={departamento}
                    onChange={(e) => setDepartamento(e.target.value)}
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Phone size={12} /> Telefone de Contato
                  </label>
                  <input 
                    type="text" 
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {updating ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  Salvar alterações
                </button>
              </div>
            </form>
          </section>

          {/* SEÇÃO DE CONTA */}
          <section className="bg-[#1e293b]/30 border border-white/5 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-8 border-b border-white/5">
              <h3 className="font-bold text-lg">Conta</h3>
            </div>
            <div className="p-8">
              <button 
                onClick={handleSignOut}
                className="border border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 px-6 py-2.5 rounded-xl text-sm font-bold text-gray-400 transition-all flex items-center gap-2"
              >
                <LogOut size={16} /> Sair da conta
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}