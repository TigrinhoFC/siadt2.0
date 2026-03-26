"use client";
import React, { useEffect, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { 
  FileText, Plus, Search, Eye, AlertCircle, ShieldCheck, 
  Activity, BarChart3, ArrowUpDown, Download, X, Loader2 
} from 'lucide-react';

// Componentes para PDF
import { PDFDownloadLink } from '@react-pdf/renderer';
import { RelatorioPDF } from '@/components/RelatorioPDF';

// Firebase
import { db } from '@/firebase/config';
import { 
  collection, onSnapshot, query, orderBy, 
  addDoc, serverTimestamp 
} from 'firebase/firestore';

const StatCardRelatorio = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-[#1e293b]/50 border border-white/5 p-6 rounded-2xl shadow-lg flex justify-between items-start">
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
      <div className="text-3xl font-bold text-white">{value}</div>
    </div>
    <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
      <Icon size={20} />
    </div>
  </div>
);

export default function RelatoriosPage() {
  const [registros, setRegistros] = useState<any[]>([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const [novoRegistro, setNovoRegistro] = useState({
    titulo: "",
    area: "",
    risco: "Baixo",
    responsavel: "",
    status: "Pendente",
    descricao: ""
  });

  // Evita erro de Hydration com react-pdf e carrega dados
  useEffect(() => {
    setIsClient(true);
    const q = query(collection(db, "relatorios"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistros(docs);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // --- FUNÇÃO DE EXPORTAÇÃO CSV ---
  const exportarParaCSV = () => {
    if (registros.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    const cabecalho = ["ID", "Area", "Risco", "Data", "Responsavel", "Status", "Descricao"];
    const linhas = registros.map(reg => [
      reg.idGerado,
      `"${reg.area}"`,
      reg.risco,
      reg.dataFormatted,
      `"${reg.responsavel}"`,
      reg.status,
      `"${reg.descricao || ''}"`
    ]);

    const conteudoCSV = [cabecalho.join(","), ...linhas.map(l => l.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Relatorio_Geral_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Planilha CSV gerada com sucesso!");
  };

  const handleAddRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "relatorios"), {
        ...novoRegistro,
        timestamp: serverTimestamp(),
        dataFormatted: new Date().toLocaleDateString('pt-BR'),
        idGerado: `#${Math.random().toString(16).slice(2, 7).toUpperCase()}`
      });
      toast.success("Novo registro geotécnico adicionado!");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Erro ao salvar registro.");
    }
  };

  const registrosFiltrados = registros.filter(reg => 
    reg.area?.toLowerCase().includes(filtroTexto.toLowerCase()) ||
    reg.responsavel?.toLowerCase().includes(filtroTexto.toLowerCase())
  );

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'Crítico': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'Alto': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Médio': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Evacuado': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Em Monitoramento': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Controlado': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-white/10';
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <Toaster theme="dark" richColors />

      <div className="max-w-[1400px] mx-auto mb-10 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Deslizamentos</h1>
          <p className="text-gray-400 mt-2">Monitoramento e gestão de ocorrências geotécnicas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={18} /> Novo Registro
        </button>
      </div>

      <div className="max-w-[1400px] mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCardRelatorio title="Total de Registros" value={registros.length} icon={BarChart3} color="text-blue-500" />
          <StatCardRelatorio title="Nível Crítico" value={registros.filter(r => r.risco === 'Crítico').length} icon={AlertCircle} color="text-red-500" />
          <StatCardRelatorio title="Em Monitoramento" value={registros.filter(r => r.status === 'Em Monitoramento').length} icon={Activity} color="text-blue-400" />
          <StatCardRelatorio title="Controlados" value={registros.filter(r => r.status === 'Controlado').length} icon={ShieldCheck} color="text-green-500" />
        </div>

        <div className="bg-[#1e293b]/30 border border-white/5 p-4 rounded-2xl flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por área ou responsável..."
              className="w-full bg-[#0f172a] border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:border-blue-500 outline-none transition-all"
              onChange={(e) => setFiltroTexto(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-[#161f33]/50 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
             <span className="text-sm font-bold text-gray-400">{registrosFiltrados.length} registros encontrados</span>
             
             {/* BOTÃO DE EXPORTAR CSV CONECTADO */}
             <button 
                onClick={exportarParaCSV}
                className="text-xs flex items-center gap-2 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
              >
                <Download size={14} /> Exportar Planilha (CSV)
              </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-500 text-[11px] uppercase tracking-widest border-b border-white/5">
                  <th className="px-6 py-4 font-bold">ID</th>
                  <th className="px-6 py-4 font-bold">Área</th>
                  <th className="px-6 py-4 font-bold">Risco</th>
                  <th className="px-6 py-4 font-bold">Data</th>
                  <th className="px-6 py-4 font-bold">Responsável</th>
                  <th className="px-6 py-4 font-bold text-center">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={7} className="py-20 text-center"><Loader2 className="animate-spin inline text-blue-500" /></td></tr>
                ) : registrosFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-gray-500">{item.idGerado}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-200">{item.area}</td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getRiscoColor(item.risco)}`}>
                        {item.risco}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{item.dataFormatted}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{item.responsavel}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isClient && (
                        <PDFDownloadLink 
                          document={<RelatorioPDF data={item} />} 
                          fileName={`Relatorio_${item.idGerado}.pdf`}
                          className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg inline-block transition-transform hover:scale-110"
                        >
                          {({ loading }) => loading ? <Loader2 size={16} className="animate-spin text-gray-500" /> : <Download size={16} />}
                        </PDFDownloadLink>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="text-blue-500" /> Novo Registro</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddRegistro} className="p-8 space-y-5">
              <input 
                type="text" required placeholder="Título do Registro"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                onChange={(e) => setNovoRegistro({...novoRegistro, titulo: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-4">
                <select 
                  className="bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm outline-none"
                  onChange={(e) => setNovoRegistro({...novoRegistro, risco: e.target.value})}
                >
                  <option value="Baixo">Risco Baixo</option>
                  <option value="Médio">Risco Médio</option>
                  <option value="Alto">Risco Alto</option>
                  <option value="Crítico">Risco Crítico</option>
                </select>
                <select 
                  className="bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm outline-none"
                  onChange={(e) => setNovoRegistro({...novoRegistro, status: e.target.value})}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Em Monitoramento">Em Monitoramento</option>
                  <option value="Controlado">Controlado</option>
                </select>
              </div>

              <input 
                type="text" placeholder="Área / Bairro"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                onChange={(e) => setNovoRegistro({...novoRegistro, area: e.target.value})}
              />

              <input 
                type="text" placeholder="Responsável Técnico"
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none"
                onChange={(e) => setNovoRegistro({...novoRegistro, responsavel: e.target.value})}
              />

              <textarea 
                className="w-full bg-[#0f172a] border border-white/10 rounded-xl p-3 text-sm h-24 resize-none outline-none focus:border-blue-500"
                placeholder="Descrição técnica..."
                onChange={(e) => setNovoRegistro({...novoRegistro, descricao: e.target.value})}
              />

              <button type="submit" className="w-full py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 transition-all">
                Salvar e Gerar Alerta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}