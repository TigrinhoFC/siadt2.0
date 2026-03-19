"use client";

import React, { useEffect, useState } from 'react';
import {
  Monitor, Bell, FileText, AlertTriangle,
  Map as MapIcon, BarChart3, ChevronRight, TrendingUp
} from 'lucide-react';

// Firebase
import { db } from '@/firebase/config';
import { doc, onSnapshot, collection } from 'firebase/firestore';

// Google Maps
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';


// =========================
// 🔥 CARD DINÂMICO (RISCO)
// =========================
const RiskIndexCard = () => {
  const [riskValue, setRiskValue] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sensores", "leitura_atual"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();

        const umidade = data.umidade || 0;
        const inclinacao = data.inclinacao || 0;

        const calculo = Math.round((umidade * 0.7) + (inclinacao * 0.3));
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
    <div className="bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl relative">
      <div className="flex justify-between mb-4">
        <span className="text-gray-400 text-sm">Índice de Risco</span>
        <BarChart3 className="text-orange-500" />
      </div>

      <div className="text-4xl font-bold">{riskValue}%</div>
      <div className={`text-xs ${status.color}`}>
        {status.label}
      </div>

      <TrendingUp className="absolute bottom-0 right-0 opacity-10" size={80} />
    </div>
  );
};


// =========================
// 📊 CARD PADRÃO
// =========================
const StatCard = ({ title, value, sub, color }: any) => (
  <div className="bg-[#1e293b]/50 border border-white/5 p-5 rounded-2xl">
    <span className="text-gray-400 text-sm">{title}</span>
    <div className="text-2xl font-bold mt-2">{value}</div>
    <div className={`text-xs mt-1 ${color}`}>{sub}</div>
  </div>
);


// =========================
// 🗺️ MAPA COM FIREBASE
// =========================
const MapaMonitoramento = () => {
  const [sensores, setSensores] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "sensores"), (snapshot) => {
      const dados: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.lat && data.lng) {
          dados.push({ id: doc.id, ...data });
        }
      });

      setSensores(dados);
    });

    return () => unsub();
  }, []);

  const getCor = (risco: string) => {
    if (risco === "alto" || risco === "critico") return "#ef4444";
    if (risco === "medio") return "#eab308";
    return "#22c55e";
  };

  const centro = sensores.length > 0
    ? { lat: sensores[0].lat, lng: sensores[0].lng }
    : { lat: -3.10, lng: -60.02 };

  return (
    <div className="absolute inset-0 m-6 mt-14 rounded-2xl overflow-hidden">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
        <Map defaultCenter={centro} defaultZoom={13} colorScheme="DARK">
          {sensores.map((sensor) => (
            <AdvancedMarker
              key={sensor.id}
              position={{ lat: sensor.lat, lng: sensor.lng }}
            >
              <Pin
                background={getCor(sensor.risco)}
                borderColor="#000"
                glyphColor="#fff"
              />
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>
    </div>
  );
};


// =========================
// 🧠 DASHBOARD COMPLETO
// =========================
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white">

      {/* NAVBAR */}
      <nav className="border-b border-white/5 bg-[#1e293b]/30 backdrop-blur sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-500 font-bold text-xl">
            <Monitor /> GeoSlide
          </div>
          <Bell className="text-gray-400" />
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto px-6 pt-8">

        {/* HEADER */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Monitoramento</h1>
            <p className="text-gray-400 text-sm">Sistema em tempo real</p>
          </div>

          <div className="bg-red-500/10 px-4 py-2 rounded-xl text-red-500 text-xs font-bold">
            2 ALERTAS CRÍTICOS
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Áreas Monitoradas" value="47" sub="+3 este mês" color="text-green-500" />
          <StatCard title="Alertas Ativos" value="6" sub="2 críticos" color="text-red-500" />
          <StatCard title="Relatórios" value="23" sub="+11%" color="text-blue-400" />
          <RiskIndexCard />
        </div>

        {/* MAPA + ALERTA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* MAPA */}
          <div className="lg:col-span-2 bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6 relative h-[450px]">
            <h2 className="text-blue-400 flex items-center gap-2">
              <MapIcon /> Mapa de Áreas de Risco
            </h2>

            <MapaMonitoramento />
          </div>

          {/* ALERTA */}
          <div className="bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6">
            <h2 className="text-orange-400 flex items-center gap-2 mb-4">
              <AlertTriangle /> Emitir Alerta
            </h2>

            <button className="w-full bg-orange-600 py-3 rounded-xl font-bold">
              Enviar Notificação
            </button>
          </div>

        </div>

        {/* TABELA */}
        <div className="mt-8 bg-[#1e293b]/50 border border-white/5 rounded-3xl p-6">
          <div className="flex justify-between mb-6">
            <h2 className="flex items-center gap-2">
              <FileText className="text-blue-500" /> Relatórios Recentes
            </h2>
            <button className="text-blue-500 text-xs flex items-center gap-1">
              Ver todos <ChevronRight size={14} />
            </button>
          </div>

          <table className="w-full text-xs">
            <thead className="text-gray-500 border-b border-white/5">
              <tr>
                <th className="pb-3">Área</th>
                <th>Risco</th>
                <th>Responsável</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-b border-white/5">
                <td className="py-4">Zona 4</td>
                <td className="text-red-500">Crítico</td>
                <td>Equipe A</td>
                <td>Ativo</td>
              </tr>
            </tbody>
          </table>
        </div>

      </main>
    </div>
  );
}