"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import dynamic from 'next/dynamic';

import {
  Monitor, Bell, FileText, AlertTriangle,
  Map as MapIcon, BarChart3, TrendingUp,
  LogOut, User, Loader2, MapPin, 
  LineChart as LineIcon, Package, HardHat, Video, BookOpen, Settings,
  Database, Clipboard, Menu, X, LayoutDashboard, AlertOctagon,
  Thermometer, Droplets, CloudRain
} from 'lucide-react';

// Recharts
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

// Firebase 
import { auth, db } from '@/firebase/config';
import { getDatabase, ref, onValue, limitToLast, query as rtdbQuery } from "firebase/database";
import { 
  doc, onSnapshot, collection, getDoc, 
  addDoc, serverTimestamp, query as firestoreQuery, orderBy, limit 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const MapaMonitoramento = dynamic(
  () => import('@/components/MapaMonitoramento'),
  { 
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 m-4 mt-12 rounded-2xl flex items-center justify-center bg-slate-800/50 animate-pulse">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    )
  }
);

const getInitials = (name: string) => {
  if (!name) return "??";
  const parts = name.split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// --- INTERFACES ---
interface UserData {
  nome: string;
  email: string;
}

interface SensorData {
  name: string;
  chuva: number;
  ocorrencias: number;
}

interface AlertaData {
  id: string;
  severidade: string;
  area: string;
  observacoes?: string;
  emissorNome: string;
  emissorEmail?: string;
  status: string;
  timestamp?: any;
}

interface StatCardProps {
  title: string;
  value: number | string;
  sub: string;
  color: string;
  icon?: React.ElementType;
  onClick?: () => void;
}

// --- NAVBAR ---
const Navbar = ({ userData, activeTab, onSignOut }: { userData: UserData | null, activeTab: string, onSignOut: () => void }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/Dashboard', icon: LayoutDashboard },
    { name: 'Relatórios', href: '/Relatorios', icon: FileText },
    { name: 'Materias', href: '/NovoMaterial', icon: HardHat }, 
    { name: 'Alertas', href: '/Alertas', icon: AlertOctagon },
    { name: 'Configurações', href: '/Configuracoes', icon: Settings },
  ];

  return (
    <nav className="border-b border-white/5 bg-[#1e293b]/40 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div 
            className="flex items-center gap-2 text-blue-500 font-black text-2xl tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => router.push('/Dashboard')}
          >
            <div className="bg-blue-500 text-white p-1 rounded-lg">
              <Monitor size={20} strokeWidth={3} />
            </div>
            <span className="hidden sm:block">SIADT</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                    isActive 
                      ? 'bg-blue-500/10 text-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={16} />
                  {item.name}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div 
              onClick={() => router.push('/Perfil')}
              className="hidden sm:flex items-center gap-3 bg-black/20 border border-white/5 pl-2 pr-4 py-1.5 rounded-full cursor-pointer hover:bg-white/10 transition-all group"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg text-[10px] font-black group-hover:scale-105 transition-transform">
                {getInitials(userData?.nome || "")}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-gray-200 leading-none group-hover:text-blue-400 transition-colors">
                  {userData?.nome || "Usuário"}
                </span>
                <span className="text-[9px] text-gray-500 leading-tight">Painel Gestor</span>
              </div>
            </div>

            <button 
              onClick={onSignOut}
              className="p-2.5 rounded-xl bg-red-500/5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
            >
              <LogOut size={18} />
            </button>

            <button 
              className="md:hidden p-2 text-gray-400"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- RISK INDEX CARD (DADOS EM TEMPO REAL) ---
const RiskIndexCard = ({ estado }: { estado: string }) => {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "ALERTA": return { label: "Alerta", color: "text-orange-500" };
      case "PERIGO": case "CRÍTICO": return { label: "Crítico", color: "text-red-500" };
      default: return { label: "Estável", color: "text-green-500" };
    }
  };

  const info = getStatusInfo(estado);

  return (
    <div className="bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl relative overflow-hidden shadow-lg h-full group hover:bg-white/5 transition-all">
      <div className="flex justify-between mb-4">
        <span className="text-gray-400 text-sm font-medium">Status do Terreno</span>
        <BarChart3 className="text-orange-500" size={20} />
      </div>
      <div className="text-3xl font-bold tracking-tight uppercase">{estado}</div>
      <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${info.color}`}>{info.label}</div>
      <TrendingUp className="absolute -bottom-4 -right-4 opacity-10 text-white group-hover:scale-110 transition-transform" size={100} />
    </div>
  );
};

const StatCard = ({ title, value, sub, color, icon: Icon, onClick }: StatCardProps) => (
  <div 
    onClick={onClick}
    className={`bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl shadow-lg h-full transition-all group ${onClick ? 'cursor-pointer hover:bg-white/10' : ''}`}
  >
    <div className="flex justify-between items-start">
      <span className="text-gray-400 text-sm leading-tight font-medium">{title}</span>
      {Icon && <Icon size={18} className="text-gray-600 group-hover:text-blue-400 transition-colors" />}
    </div>
    <div className="text-2xl font-bold mt-2">{value}</div>
    <div className={`text-[10px] mt-1 font-bold uppercase tracking-tighter ${color}`}>{sub}</div>
  </div>
);

// --- PAINEL DE ALERTA ---
const PainelAlerta = ({ user }: { user: UserData | null }) => {
  const [severidade, setSeveridade] = useState("");
  const [area, setArea] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!severidade || !area) {
      toast.warning("Campos obrigatórios", { description: "Selecione severidade e área." });
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "alertas"), {
        severidade, area, observacoes,
        timestamp: serverTimestamp(),
        emissorNome: user?.nome || "Sistema",
        emissorEmail: user?.email || "",
        status: "Ativo"
      });
      toast.success("Alerta emitido com sucesso!");
      setSeveridade(""); setArea(""); setObservacoes("");
    } catch (error) {
      toast.error("Erro ao emitir alerta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#161f33] border border-white/5 rounded-3xl p-6 flex flex-col h-full shadow-lg">
      <h2 className="text-white flex items-center gap-2 mb-6 font-semibold">
        <Bell className="text-orange-500" size={20} fill="currentColor" /> Emitir Alerta
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Grau de Severidade</label>
          <div className="grid grid-cols-2 gap-2">
            {['Observação', 'Atenção', 'Alerta', 'Emergência'].map((n) => (
              <button key={n} type="button" onClick={() => setSeveridade(n)} 
                className={`py-2 px-3 rounded-lg text-[11px] font-bold border transition-all ${
                  severidade === n ? 'bg-orange-600 border-orange-400 text-white shadow-lg' : 'bg-[#0f172a] border-white/5 text-gray-500 hover:border-white/20'
                }`}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={12} /> Localização</label>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-blue-500/50 transition-colors">
            <option value="" disabled>Selecionar Área...</option>
            <option value="Zona 1 - Encosta Norte">Zona 1 - Encosta Norte</option>
            <option value="Zona 2 - Setor Sul">Zona 2 - Setor Sul</option>
            <option value="Zona 4 - Vila Nova">Zona 4 - Vila Nova</option>
          </select>
        </div>
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Descrição da ocorrência..." className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-3 text-sm text-gray-300 h-20 outline-none focus:border-blue-500/50 transition-colors" />
        <button type="submit" disabled={loading} className={`mt-auto w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl ${loading ? 'bg-gray-700' : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white transition-all active:scale-95'}`}>
          {loading ? <Loader2 className="animate-spin" /> : <><AlertTriangle size={18} /> Confirmar Alerta</>}
        </button>
      </form>
    </div>
  );
};

// --- GRÁFICO (HISTÓRICO) ---

const GraficoOcorrencias = () => {
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const ultimaAtualizacaoRef = useRef<number>(0); // Corrigido de 'user' para 'useRef'

  useEffect(() => {
    const database = getDatabase();
    const dhtRef = ref(database, 'DHT');

    const unsubscribe = onValue(dhtRef, (snapshot) => {
      if (snapshot.exists()) {
        const agora = Date.now();
        const umMinuto = 60000;

        // Se for a primeira leitura OU se já passou 1 minuto da última
        if (ultimaAtualizacaoRef.current === 0 || agora - ultimaAtualizacaoRef.current >= umMinuto) {
          const data = snapshot.val();
          const horaAtual = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', minute: '2-digit' 
          });

          setDadosGrafico((prev) => {
            const novoPonto = {
              name: horaAtual,
              temp: Number(data.Temperatura) || 0,
              umid: Number(data.Umidade) || 0
            };
            return [...prev, novoPonto].slice(-20);
          });

          ultimaAtualizacaoRef.current = agora;
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Componente de Tooltip Customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1e293b] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-gray-400 text-[10px] mb-2 font-medium">{label}</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-white text-xs font-bold">{payload[0].value}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-white text-xs font-bold">{payload[1].value}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#161f33] border border-white/5 rounded-[32px] p-8 flex flex-col shadow-2xl h-full min-h-[450px] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
      
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-white text-lg font-bold tracking-tight">Histórico de Sensores</h2>
          <p className="text-gray-500 text-xs mt-1">Intervalo de amostragem: 1 minuto</p>
        </div>
        
        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
            <Thermometer size={14} className="text-orange-500" />
            <span className="text-orange-500 text-[11px] font-semibold">Temperatura</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
            <Droplets size={14} className="text-blue-500" />
            <span className="text-blue-500 text-[11px] font-semibold">Umidade</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorUmid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff03" vertical={false} />
              
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#475569', fontSize: 10, fontWeight: 500}} 
                dy={15}
              />
              
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#475569', fontSize: 10}}
              />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff10', strokeWidth: 2 }} />
              
              <Area 
                type="monotone" 
                dataKey="temp" 
                stroke="#f97316" 
                strokeWidth={4} 
                fill="url(#colorTemp)" 
                strokeLinecap="round"
                isAnimationActive={true}
                animationDuration={1000}
              />
              
              <Area 
                type="monotone" 
                dataKey="umid" 
                stroke="#3b82f6" 
                strokeWidth={4} 
                fill="url(#colorUmid)" 
                strokeLinecap="round"
                isAnimationActive={true}
                animationDuration={1200}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
// --- COMPONENTE PRINCIPAL DASHBOARD ---
export default function Dashboard() {
  const router = useRouter(); 
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeTab] = useState('Dashboard');
  
  // Estados para os Sensores Reais (Imagem fornecida)
  const [sensores, setSensores] = useState({
    temperatura: 0,
    umidade: 0,
    chuva: "Carregando...",
    estado: "Normal"
  });

  const [criticosCount, setCriticosCount] = useState(0);
  const [relatoriosTotal, setRelatoriosTotal] = useState(0);
  const [ocorrenciasTotal, setOcorrenciasTotal] = useState(0);
  const [alertasRecentes, setAlertasRecentes] = useState<AlertaData[]>([]); 

  useEffect(() => {
    document.title = "SIADT - Dashboard";
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        setUserData({ nome: docSnap.exists() ? docSnap.data().nome : "Usuário", email: user.email || "" });
        setAuthLoading(false);
      } else {
        router.push('/Login');
      }
    });
    return () => unsubscribeAuth();
  }, [router]);

  // Integração em tempo real com o Realtime Database (Caminhos da imagem)
  useEffect(() => {
    const database = getDatabase();
    const rootRef = ref(database, '/'); // Busca na raiz conforme a imagem

    const unsubRealtime = onValue(rootRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSensores({
          temperatura: data.DHT?.Temperatura || 0,
          umidade: data.DHT?.Umidade || 0,
          chuva: data.Chuva || "Sem dados",
          estado: data.Estado_do_morro || "Normal"
        });
      }
    });

    return () => unsubRealtime();
  }, []);

  useEffect(() => {
    const qAlerta = firestoreQuery(collection(db, "alertas"), orderBy("timestamp", "desc"), limit(5));
    const unsubAlertas = onSnapshot(qAlerta, (snapshot) => {
      const lista: AlertaData[] = [];
      let criticos = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({ id: doc.id, ...data } as AlertaData);
        if (data.status === "Ativo" && data.severidade === "Emergência") criticos++;
      });
      setAlertasRecentes(lista);
      setCriticosCount(criticos);
    });

    onSnapshot(collection(db, "relatorios"), (snap) => setRelatoriosTotal(snap.size));
    onSnapshot(collection(db, "ocorrencias"), (snap) => setOcorrenciasTotal(snap.size));
    return () => unsubAlertas();
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/Login');
  };

  if (authLoading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-blue-500/30">
      <Toaster theme="dark" position="top-right" richColors />

      <Navbar userData={userData} activeTab={activeTab} onSignOut={handleSignOut} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-8 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Olá, {userData?.nome}! 👋</h1>
            <p className="text-gray-400 text-sm mt-1">Monitoramento ativo da Encosta Norte.</p>
          </div>
          <div className={`px-4 py-2 rounded-2xl text-[11px] font-black border flex items-center gap-2 shadow-lg transition-all ${sensores.estado === 'ALERTA' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 animate-pulse' : 'bg-green-500/10 text-green-500 border-green-500/20'}`}>
            <div className={`h-2.5 w-2.5 rounded-full ${sensores.estado === 'ALERTA' ? 'bg-orange-500' : 'bg-green-500'}`} />
            SITUAÇÃO DO SOLO: {sensores.estado}
          </div>
        </div>

        {/* --- GRID DE SENSORES (ATUALIZADO) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard 
            title="Temperatura" 
            value={`${sensores.temperatura}°C`} 
            sub="Ambiente Externo" 
            color="text-orange-400" 
            icon={Thermometer} 
          />
          <StatCard 
            title="Umidade do Ar" 
            value={`${sensores.umidade}%`} 
            sub="Risco de saturação" 
            color="text-blue-400" 
            icon={Droplets} 
          />
          <StatCard 
            title="Precipitação" 
            value={sensores.chuva} 
            sub="Status em tempo real" 
            color={sensores.chuva === "Tempo Seco" ? "text-green-400" : "text-blue-500"} 
            icon={CloudRain} 
          />
          <StatCard 
            title="Alertas Ativos" 
            onClick={() => router.push('/Alertas')} 
            value={criticosCount} 
            sub="Exige atenção imediata" 
            color={criticosCount > 0 ? "text-red-500" : "text-gray-500"} 
            icon={AlertTriangle} 
          />
          <RiskIndexCard estado={sensores.estado} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6 relative h-[550px] shadow-2xl overflow-hidden">
            <h2 className="text-blue-400 flex items-center gap-2 font-bold mb-4 uppercase text-xs tracking-widest relative z-10"><MapIcon size={18} /> Georreferenciamento de Risco</h2>
            <MapaMonitoramento />
          </div>
          <PainelAlerta user={userData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GraficoOcorrencias />
          <div className="bg-[#161f33] border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col h-full">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-white flex items-center gap-2 font-semibold"><Package className="text-blue-500" size={20} /> Materiais</h2>
             </div>
             <div className="space-y-3 flex-1 text-gray-500 text-sm italic">
                Selecione um manual técnico na aba "Materiais".
             </div>
          </div>
        </div>

        {/* Histórico de Alertas (Firestore) */}
        <div className="bg-[#1e293b]/50 border border-white/5 rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="flex items-center gap-2 font-bold text-lg"><Clipboard className="text-blue-500" size={22} /> Histórico de Alertas</h2>
            <button onClick={() => router.push('/Alertas')} className="text-xs font-bold text-gray-500 hover:text-white transition-colors">Ver histórico completo</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 border-b border-white/5 text-left uppercase text-[10px] tracking-widest">
                <tr><th className="pb-4 px-2">Localidade</th><th className="pb-4">Nível</th><th className="pb-4">Operador</th><th className="pb-4 text-right">Situação</th></tr>
              </thead>
              <tbody className="text-gray-300 divide-y divide-white/5">
                {alertasRecentes.map((alerta) => (
                  <tr key={alerta.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer group" onClick={() => router.push('/Alertas')}>
                    <td className="py-5 px-2 font-bold group-hover:text-blue-400 transition-colors">{alerta.area}</td>
                    <td className="py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-tighter ${alerta.severidade === 'Emergência' ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                        {alerta.severidade?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-5 text-xs text-gray-500">{alerta.emissorNome}</td>
                    <td className="py-5 text-right font-bold text-green-500 text-[11px] uppercase tracking-wider">{alerta.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}