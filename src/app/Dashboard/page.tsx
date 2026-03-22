"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Monitor, Bell, FileText, AlertTriangle,
  Map as MapIcon, BarChart3, ChevronRight, TrendingUp,
  LogOut, User, Loader2, MapPin, Users,
  LineChart, Package, Video, BookOpen
} from 'lucide-react';

// Firebase
import { auth, db } from '@/firebase/config';
import { doc, onSnapshot, collection, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

// Google Maps
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

// =========================
// 🔥 CARDS ESTATÍSTICAS
// =========================
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

// =========================
// 🗺️ MAPA
// =========================
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

// =========================
// 🚨 PAINEL DE ALERTA
// =========================
const PainelAlerta = () => {
  const [severidade, setSeveridade] = useState("");
  const [area, setArea] = useState("");
  const [notificar, setNotificar] = useState<string[]>([]);

  const toggleNotificar = (grupo: string) => setNotificar(p => p.includes(grupo) ? p.filter(i => i !== grupo) : [...p, grupo]);

  return (
    <div className="bg-[#161f33] border border-white/5 rounded-3xl p-6 flex flex-col h-full shadow-lg">
      <h2 className="text-white flex items-center gap-2 mb-6 font-semibold">
        <Bell className="text-orange-500" size={20} fill="currentColor" /> Emitir Alerta
      </h2>
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-5 flex-1">
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nível de Severidade</label>
          <div className="grid grid-cols-2 gap-2">
            {['Observação', 'Atenção', 'Alerta', 'Emergência'].map((n) => (
              <button key={n} type="button" onClick={() => setSeveridade(n)} className={`py-2 px-3 rounded-lg text-xs font-medium border ${severidade === n ? 'bg-white/10 border-gray-400 text-white' : 'bg-transparent border-white/10 text-gray-400'}`}>{n}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin size={12} /> Área de Risco</label>
          <select value={area} onChange={(e) => setArea(e.target.value)} className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-gray-300">
            <option value="" disabled>Selecionar área...</option>
            <option value="Zona 1">Zona 1</option>
            <option value="Zona 4">Zona 4</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Observações Técnicas</label>
          <textarea placeholder="Descreva as condições..." className="w-full bg-[#0f172a] border border-white/10 rounded-lg px-3 py-3 text-sm text-gray-300 resize-none h-20"></textarea>
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={12} /> Notificar</label>
          <div className="flex flex-wrap gap-2">
            {['Defesa Civil', 'Equipe de Campo', 'Gestores'].map((g) => (
              <button key={g} type="button" onClick={() => toggleNotificar(g)} className={`py-1.5 px-3 rounded-lg text-xs font-medium border ${notificar.includes(g) ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-transparent border-white/10 text-gray-400'}`}>{g}</button>
            ))}
          </div>
        </div>
        <button type="submit" className="mt-auto w-full bg-[#b44321] hover:bg-[#9a3412] text-white py-3.5 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
          <AlertTriangle size={18} /> Emitir Alerta
        </button>
      </form>
    </div>
  );
};

// =========================
// 📈 GRÁFICO 
// =========================
const GraficoOcorrencias = () => {
  return (
    <div className="bg-[#161f33] border border-white/5 rounded-3xl p-6 flex flex-col shadow-lg">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-white flex items-center gap-2 font-semibold">
            <LineChart className="text-blue-500" size={20} /> Ocorrências vs. Precipitação
          </h2>
          <p className="text-gray-500 text-xs mt-1">Últimos 7 meses</p>
        </div>
        <div className="flex bg-[#0f172a] rounded-lg p-1 border border-white/5">
          <button className="bg-blue-600 text-white text-xs px-4 py-1.5 rounded-md font-medium shadow">Área</button>
          <button className="text-gray-400 hover:text-white text-xs px-4 py-1.5 rounded-md font-medium transition-colors">Barras</button>
        </div>
      </div>
      <div className="relative flex-1 min-h-[220px] w-full mt-2">
        <div className="absolute left-0 top-0 bottom-6 w-6 flex flex-col justify-between text-[10px] text-gray-500 font-medium">
          <span>60</span><span>45</span><span>30</span><span>15</span><span>0</span>
        </div>
        <div className="absolute left-8 right-0 top-2 bottom-6 border-b border-l border-white/10 relative">
          <div className="absolute w-full h-full flex flex-col justify-between">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full border-t border-white/5 border-dashed h-0" />
            ))}
          </div>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 600 200">
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d="M 0,160 C 50,150 50,140 100,130 C 150,120 150,110 200,100 C 250,90 250,50 300,40 C 350,30 350,80 400,90 C 450,100 450,120 500,130 C 550,140 550,150 600,155 L 600,200 L 0,200 Z" fill="url(#areaGradient)" />
            <path d="M 0,160 C 50,150 50,140 100,130 C 150,120 150,110 200,100 C 250,90 250,50 300,40 C 350,30 350,80 400,90 C 450,100 450,120 500,130 C 550,140 550,150 600,155" fill="none" stroke="#3b82f6" strokeWidth="3" />
          </svg>
        </div>
        <div className="absolute left-8 right-0 bottom-0 flex justify-between text-[10px] text-gray-500 font-medium translate-y-6">
          <span>Set</span><span>Out</span><span>Nov</span><span>Dez</span><span>Jan</span><span>Fev</span><span>Mar</span>
        </div>
      </div>
    </div>
  );
};

// =========================
// 📚 MATERIAIS DISPONÍVEIS
// =========================
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

// =========================
// 🧠 DASHBOARD COMPLETO
// =========================
export default function Dashboard() {
  const [authLoading, setAuthLoading] = useState(true);
  const [userData, setUserData] = useState<{ nome: string; email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Título da página
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

  if (authLoading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-white/5 bg-[#1e293b]/30 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-500 font-extrabold text-2xl tracking-tighter">
            <Monitor size={24} strokeWidth={3} /> SIADT
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-white leading-none">{userData?.nome}</p>
                  <p className="text-[10px] text-gray-400">{userData?.email}</p>
               </div>
               <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-blue-500/20">{userData?.nome.charAt(0).toUpperCase()}</div>
            </div>
            <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-red-500 transition-all hover:scale-110"><LogOut size={20} /></button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 pt-8 pb-12">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold">Olá, {userData?.nome}! 👋</h1>
            <p className="text-gray-400 text-sm">Monitoramento de encostas SIADT em tempo real.</p>
          </div>
          <div className="bg-red-500/10 px-4 py-2 rounded-xl text-red-500 text-xs font-bold border border-red-500/20 flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-red-500"></span></span>
            2 ALERTAS CRÍTICOS ATIVOS
          </div>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Áreas Monitoradas" value="47" sub="+3 este mês" color="text-green-500" />
          <StatCard title="Alertas Ativos" value="6" sub="2 críticos" color="text-red-500" />
          <StatCard title="Relatórios" value="23" sub="+11%" color="text-blue-400" />
          <RiskIndexCard />
        </div>

        {/* MAPA E ALERTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6 relative h-[650px] lg:h-auto">
            <h2 className="text-blue-400 flex items-center gap-2 font-semibold mb-4"><MapIcon size={18} /> Mapa de Áreas de Risco</h2>
            <MapaMonitoramento />
          </div>
          <PainelAlerta />
        </div>

        {/* GRÁFICO E MATERIAIS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <GraficoOcorrencias />
          <MateriaisDisponiveis />
        </div>

        {/* TABELA */}
        <div className="bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6">
          <div className="flex justify-between mb-6"><h2 className="flex items-center gap-2 font-semibold"><FileText className="text-blue-500" size={18} /> Atividade Recente</h2></div>
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b border-white/5">
              <tr><th className="pb-3 text-left">Área</th><th className="pb-3 text-left">Nível</th><th className="pb-3 text-right">Status</th></tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="py-4">Zona 4</td><td className="py-4 text-red-500 font-bold">CRÍTICO</td><td className="py-4 text-right">Monitoramento Ativo</td></tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}