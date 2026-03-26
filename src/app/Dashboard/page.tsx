"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';

import {
  Monitor, Bell, FileText, AlertTriangle,
  Map as MapIcon, BarChart3, ChevronRight, TrendingUp,
  LogOut, User, Loader2, MapPin, Users,
  LineChart as LineIcon, Package, Video, BookOpen, Settings,
  Database
} from 'lucide-react';

// Recharts
import { 
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

// Firebase 
import { auth, db } from '@/firebase/config';
import { 
  doc, onSnapshot, collection, getDoc, 
  addDoc, serverTimestamp, query, where, orderBy, setDoc, limit 
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Google Maps
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1e293b] border border-white/10 p-3 rounded-lg shadow-xl">
        <p className="text-white font-bold mb-1 text-xs">{label}</p>
        <p className="text-blue-400 text-[10px]">Chuva: {payload[0].value}mm</p>
        <p className="text-red-400 text-[10px]">Ocorrências: {payload[1].value}</p>
      </div>
    );
  }
  return null;
};

const RiskIndexCard = () => {
  const [riskValue, setRiskValue] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sensores", "leitura_atual"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const calculo = Math.round(((data.umidade || 0) * 0.7) + ((data.inclinacao || 0) * 0.3));
        setRiskValue(calculo > 100 ? 100 : calculo);
      }
    });
    return () => unsub();
  }, []);

  const getStatus = (val: number) => {
    if (val > 70) return { label: "Crítico", color: "text-red-500" };
    if (val > 40) return { label: "Moderado", color: "text-orange-500" };
    return { label: "Baixo", color: "text-green-500" };
  };

  const status = getStatus(riskValue);

  return (
    <div className="bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl relative overflow-hidden shadow-lg">
      <div className="flex justify-between mb-4">
        <span className="text-gray-400 text-sm">Índice de Risco</span>
        <BarChart3 className="text-orange-500" />
      </div>
      <div className="text-4xl font-bold">{riskValue}%</div>
      <div className={`text-xs ${status.color}`}>{status.label}</div>
      <TrendingUp className="absolute -bottom-4 -right-4 opacity-10 text-white" size={100} />
    </div>
  );
};

const StatCard = ({ title, value, sub, color }: any) => (
  <div className="bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl shadow-lg">
    <span className="text-gray-400 text-sm">{title}</span>
    <div className="text-2xl font-bold mt-2">{value}</div>
    <div className={`text-xs mt-1 ${color}`}>{sub}</div>
  </div>
);

const MapaMonitoramento = () => {
  const [sensores, setSensores] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "sensores"), (snapshot) => {
      const dados: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.lat && data.lng) dados.push({ id: doc.id, ...data });
      });
      setSensores(dados);
    });
    return () => unsub();
  }, []);

  const centro = sensores.length > 0 ? { lat: sensores[0].lat, lng: sensores[0].lng } : { lat: -3.10, lng: -60.02 };

  return (
    <div className="absolute inset-0 m-6 mt-14 rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-black/20">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map defaultCenter={centro} defaultZoom={13} mapId={process.env.NEXT_PUBLIC_MAP_ID} colorScheme="DARK" disableDefaultUI={true}>
          {sensores.map((sensor) => (
            <AdvancedMarker key={sensor.id} position={{ lat: sensor.lat, lng: sensor.lng }}>
              <Pin background={sensor.risco === "critico" ? "#ef4444" : "#22c55e"} borderColor="#000" glyphColor="#fff" />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};

const PainelAlerta = ({ user }: { user: any }) => {
  const [severidade, setSeveridade] = useState("");
  const [area, setArea] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [notificar, setNotificar] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleNotificar = (grupo: string) => 
    setNotificar(p => p.includes(grupo) ? p.filter(i => i !== grupo) : [...p, grupo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!severidade || !area) {
      toast.warning("Campos obrigatórios", {
        description: "Por favor, selecione a severidade e a área antes de enviar."
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "alertas"), {
        severidade,
        area,
        observacoes,
        notificar,
        timestamp: serverTimestamp(),
        emissorNome: user?.nome || "Sistema",
        emissorEmail: user?.email || "",
        status: "Ativo"
      });

      toast.success("Alerta emitido com sucesso!", {
        description: `Protocolo registrado para: ${area}`,
      });

      setSeveridade("");
      setArea("");
      setObservacoes("");
      setNotificar([]);
    } catch (error) {
      console.error("Erro ao emitir alerta:", error);
      toast.error("Erro no servidor");
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
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nível de Severidade</label>
          <div className="grid grid-cols-2 gap-2">
            {['Observação', 'Atenção', 'Alerta', 'Emergência'].map((n) => (
              <button 
                key={n} 
                type="button" 
                onClick={() => setSeveridade(n)} 
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                  severidade === n 
                    ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]' 
                    : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <MapPin size={12} /> Área de Risco
          </label>
          <select 
            value={area} 
            onChange={(e) => setArea(e.target.value)} 
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300 focus:border-blue-500 outline-none"
          >
            <option value="" disabled>Selecionar área...</option>
            <option value="Zona 1 - Encosta Norte">Zona 1 - Encosta Norte</option>
            <option value="Zona 2 - Setor Sul">Zona 2 - Setor Sul</option>
            <option value="Zona 4 - Vila Nova">Zona 4 - Vila Nova</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Observações Técnicas</label>
          <textarea 
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Descreva as condições..." 
            className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-3 text-sm text-gray-300 resize-none h-20 focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Users size={12} /> Notificar
          </label>
          <div className="flex flex-wrap gap-2">
            {['Defesa Civil', 'Equipe de Campo', 'Gestores'].map((g) => (
              <button 
                key={g} 
                type="button" 
                onClick={() => toggleNotificar(g)} 
                className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                  notificar.includes(g) 
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300' 
                    : 'bg-transparent border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className={`mt-auto w-full py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
            loading ? 'bg-gray-700' : 'bg-[#b44321] hover:bg-[#9a3412] text-white active:scale-95'
          }`}
        >
          {loading ? <Loader2 className="animate-spin" /> : <><AlertTriangle size={18} /> Emitir Alerta</>}
        </button>
      </form>
    </div>
  );
};

const GraficoOcorrencias = () => {
  const [viewMode, setViewMode] = useState<'area' | 'bar'>('area');
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);
  const LIMITE_CRITICO = 60;

  useEffect(() => {
    const q = query(collection(db, "estatisticas"), orderBy("ordem", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      setDadosGrafico(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="bg-[#161f33] border border-white/5 rounded-3xl p-6 flex flex-col shadow-lg h-full min-h-[400px]">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-white flex items-center gap-2 font-semibold text-sm">
            <LineIcon className="text-blue-500" size={18} /> Ocorrências vs. Precipitação
          </h2>
          <p className="text-gray-500 text-[10px] mt-1 italic">Análise de correlação climatológica</p>
        </div>
        <div className="flex bg-[#0f172a] rounded-lg p-1 border border-white/5">
          <button 
            onClick={() => setViewMode('area')}
            className={`text-[9px] px-3 py-1.5 rounded-md font-bold uppercase tracking-tighter transition-all ${
              viewMode === 'area' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Área
          </button>
          <button 
            onClick={() => setViewMode('bar')}
            className={`text-[9px] px-3 py-1.5 rounded-md font-bold uppercase tracking-tighter transition-all ${
              viewMode === 'bar' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            Barras
          </button>
        </div>
      </div>

      <div className="flex-1 w-full mt-2 flex items-center justify-center">
        {loading ? (
          <Loader2 className="animate-spin text-blue-500" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {viewMode === 'area' ? (
              <AreaChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChuva" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOcorrencia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Area type="monotone" dataKey="chuva" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorChuva)" />
                <Area type="monotone" dataKey="ocorrencias" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorOcorrencia)" />
              </AreaChart>
            ) : (
              <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#ffffff05'}} />
                <Bar dataKey="chuva" radius={[4, 4, 0, 0]} barSize={12}>
                  {dadosGrafico.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.chuva > LIMITE_CRITICO ? '#f97316' : '#3b82f6'} 
                    />
                  ))}
                </Bar>
                <Bar dataKey="ocorrencias" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
      <div className="flex flex-wrap gap-4 mt-6 px-2 border-t border-white/5 pt-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Precipitação</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Ocorrências</span>
        </div>
      </div>
    </div>
  );
};

const MateriaisDisponiveis = () => {
  const materiais = [
    { icone: FileText, cor: "text-red-500", bg: "bg-red-500/10", titulo: "Manual de Identificação de Taludes Instáveis", desc: "Critérios técnicos para análise geomorfológica em campo", size: "4.2 MB", data: "Jan 2026" },
    { icone: Video, cor: "text-purple-500", bg: "bg-purple-500/10", titulo: "Técnicas de Mapeamento com LIDAR", desc: "Tutorial avançado para profissionais de geologia", size: "320 MB", data: "Fev 2026" },
    { icone: BookOpen, cor: "text-blue-500", bg: "bg-blue-500/10", titulo: "Protocolos de Alerta — COBRADE 2025", desc: "Normas atualizadas para emissão de alertas geológicos", size: "1.8 MB", data: "Dez 2025" },
    { icone: FileText, cor: "text-red-500", bg: "bg-red-500/10", titulo: "Classificação de Solos para Encostas", desc: "Tabela de referência — NBR 7250 e ABGE", size: "2.1 MB", data: "Nov 2025" },
  ];

  return (
    <div className="bg-[#161f33] border border-white/5 rounded-3xl p-6 shadow-lg flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white flex items-center gap-2 font-semibold">
          <Package className="text-blue-500" size={20} /> Materiais Disponíveis
        </h2>
        <button className="text-blue-500 text-xs flex items-center gap-1 hover:underline font-medium">Ver todos <ChevronRight size={14} /></button>
      </div>
      <div className="space-y-3 flex-1">
        {materiais.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-[#0f172a]/40 hover:bg-white/5 transition-all cursor-pointer group">
            <div className={`${item.bg} ${item.cor} p-3 rounded-xl group-hover:scale-105 transition-transform`}><item.icone size={20} /></div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-200 group-hover:text-blue-400 transition-colors">{item.titulo}</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
              <p className="text-[10px] text-gray-500 mt-1.5 font-medium">{item.size} <span className="mx-1">•</span> {item.data}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState<{ nome: string; email: string } | null>(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [criticosCount, setCriticosCount] = useState(0);
  
  // NOVOS ESTADOS ADICIONADOS
  const [relatoriosTotal, setRelatoriosTotal] = useState(0);

  const [alertasRecentes, setAlertasRecentes] = useState<any[]>([]); 
  const router = useRouter();

  useEffect(() => {
    document.title = "SIADT - Dashboard de Monitoramento";
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        setUserData({ nome: docSnap.exists() ? docSnap.data().nome : "Usuário", email: user.email || "" });
        setAuthLoading(false);
      } else router.push('/Login');
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const qRecentes = query(collection(db, "alertas"), orderBy("timestamp", "desc"), limit(5));
    
    const unsubscribe = onSnapshot(qRecentes, (snapshot) => {
      const lista: any[] = [];
      let criticos = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        lista.push({ id: doc.id, ...data });
        if (data.status === "Ativo" && data.severidade === "Emergência") criticos++;
      });

      setAlertasRecentes(lista);
      setCriticosCount(criticos);
    });
    return () => unsubscribe();
  }, []);

  // NOVO EFFECT PARA BUSCAR TOTAL DE RELATÓRIOS DO FIRESTORE
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "relatorios"), (snapshot) => {
      setRelatoriosTotal(snapshot.size);
    });
    return () => unsub();
  }, []);

  const popularDadosTeste = async () => {
    const dadosParaInserir = [
      { id: 'setembro', name: 'Set', ocorrencias: 12, chuva: 45, ordem: 1 },
      { id: 'outubro', name: 'Out', ocorrencias: 18, chuva: 52, ordem: 2 },
      { id: 'novembro', name: 'Nov', ocorrencias: 15, chuva: 48, ordem: 3 },
      { id: 'dezembro', name: 'Dez', ocorrencias: 35, chuva: 75, ordem: 4 },
      { id: 'janeiro', name: 'Jan', ocorrencias: 42, chuva: 85, ordem: 5 },
      { id: 'fevereiro', name: 'Fev', ocorrencias: 30, chuva: 60, ordem: 6 },
      { id: 'marco', name: 'Mar', ocorrencias: 25, chuva: 55, ordem: 7 },
    ];

    try {
      toast.loading("Semeando dados no Firestore...", { id: "seed" });
      const promessas = dadosParaInserir.map((dado) => {
        const { id, ...resto } = dado;
        return setDoc(doc(db, "estatisticas", id), resto);
      });
      await Promise.all(promessas);
      toast.success("Gráfico populado com sucesso!", { id: "seed" });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao popular dados.", { id: "seed" });
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans">
      <Toaster theme="dark" position="top-right" richColors />

      <nav className="border-b border-white/5 bg-[#1e293b]/30 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-2 text-blue-500 font-extrabold text-2xl tracking-tighter">
              <Monitor size={24} strokeWidth={3} /> SIADT
            </div>
            <div className="hidden md:flex items-center gap-8">
              {[
                { name: 'Dashboard', icon: Monitor, path: '/dashboard' },
                { name: 'Relatórios', icon: FileText, path: '/relatorios' },
                { name: 'Alertas', icon: Bell, path: '/alertas' },
                { name: 'Configurações', icon: Settings, path: '/configuracoes' }
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => {
                    setActiveTab(item.name);
                    router.push(item.path);
                  }}
                  className={`flex items-center gap-2 text-sm font-bold transition-all relative py-5 ${
                    activeTab === item.name ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <item.icon size={18} /> {item.name}
                  {activeTab === item.name && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">{userData?.nome}</p>
                  <p className="text-[10px] text-gray-400">{userData?.email}</p>
                </div>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">{userData?.nome.charAt(0).toUpperCase()}</div>
            </div>
            <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-red-500 transition-all hover:scale-110"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 pt-8 pb-12">
        <div className="flex justify-between items-end mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Olá, {userData?.nome}! 👋</h1>
            <p className="text-gray-400 text-sm mb-4">Monitoramento de encostas SIADT em tempo real.</p>
            
            <button 
              onClick={popularDadosTeste}
              className="flex items-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
            >
              <Database size={14} /> Popular Dados do Gráfico
            </button>
          </div>
          
          {criticosCount > 0 ? (
            <div className="bg-red-500/10 px-4 py-2 rounded-xl text-red-500 text-xs font-bold border border-red-500/20 flex items-center gap-2 animate-pulse h-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              {criticosCount} {criticosCount === 1 ? 'ALERTA CRÍTICO ATIVO' : 'ALERTAS CRÍTICOS ATIVOS'}
            </div>
          ) : (
            <div className="bg-green-500/10 px-4 py-2 rounded-xl text-green-500 text-xs font-bold border border-green-500/20 flex items-center gap-2 h-fit">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              SISTEMA EM ESTADO NORMAL
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* VALOR ALTERADO PARA MOSTRAR 1 FIXO COMO SOLICITADO */}
          <StatCard title="Áreas Monitoradas" value="1" sub="Ativo no momento" color="text-green-500" />
          
          <StatCard 
            title="Alertas Críticos" 
            value={criticosCount} 
            sub="Em tempo real" 
            color={criticosCount > 0 ? "text-red-500" : "text-gray-400"} 
          />
          
          {/* VALOR ALTERADO PARA MOSTRAR O TOTAL DINÂMICO DO FIRESTORE */}
          <StatCard title="Relatórios" value={relatoriosTotal} sub="+ Atualizado agora" color="text-blue-400" />
          
          <RiskIndexCard />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6 relative h-[650px] lg:h-auto">
            <h2 className="text-blue-400 flex items-center gap-2 font-semibold mb-4"><MapIcon size={18} /> Mapa de Áreas de Risco</h2>
            <MapaMonitoramento />
          </div>
          <PainelAlerta user={userData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-stretch">
          <GraficoOcorrencias />
          <MateriaisDisponiveis />
        </div>

        <div className="bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between mb-6">
            <h2 className="flex items-center gap-2 font-semibold">
              <FileText className="text-blue-500" size={18} /> Atividade Recente (Últimos Alertas)
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 border-b border-white/5">
                <tr>
                  <th className="pb-3 text-left font-medium">Área</th>
                  <th className="pb-3 text-left font-medium">Nível de Severidade</th>
                  <th className="pb-3 text-left font-medium">Emissor</th>
                  <th className="pb-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                {alertasRecentes.length > 0 ? (
                  alertasRecentes.map((alerta) => (
                    <tr key={alerta.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="py-4 font-semibold text-gray-200">{alerta.area}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          alerta.severidade === 'Emergência' ? 'bg-red-500/20 text-red-500' :
                          alerta.severidade === 'Alerta' ? 'bg-orange-500/20 text-orange-500' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {alerta.severidade?.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-gray-500 text-xs">{alerta.emissorNome}</td>
                      <td className="py-4 text-right">
                        <span className="flex items-center justify-end gap-1.5 text-green-500 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                          {alerta.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-500 italic">
                      Nenhum alerta registrado recentemente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}