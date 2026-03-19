  import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020617] text-white flex flex-col items-center px-6">

      {/* Navbar */}
      <header className="w-full max-w-6xl flex justify-between items-center py-6">
        <h1 className="text-xl font-bold">SIADT</h1>

        <Link
          href="/Login"
          className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Acessar plataforma
        </Link>
      </header>

      {/* Hero */}
      <section className="text-center mt-16 max-w-3xl">

        <h1 className="text-5xl font-bold leading-tight">
          Monitoramento de{" "}
          <span className="text-blue-500">Deslizamentos</span>
          <br />
          em tempo real
        </h1>

        <p className="text-gray-400 mt-6">
          Plataforma técnica para geólogos e engenheiros.
          Mapeie riscos, emita alertas e gerencie relatórios
          com precisão científica.
        </p>

        <div className="flex justify-center gap-4 mt-8">

          <Link
            href="/Login"
            className="bg-blue-600 px-6 py-3 rounded-xl hover:bg-blue-700 transition"
          >
            Acessar Dashboard
          </Link>

          <button className="border border-gray-600 px-6 py-3 rounded-xl hover:bg-gray-800 transition">
            Relatório Técnico
          </button>

        </div>

      </section>

      {/* Estatísticas */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full max-w-6xl">

        <div className="bg-[#0f172a] p-6 rounded-xl text-center border border-slate-800">
          <h2 className="text-2xl font-bold">1.200+</h2>
          <p className="text-gray-400 text-sm">Áreas monitoradas</p>
        </div>

        <div className="bg-[#0f172a] p-6 rounded-xl text-center border border-slate-800">
          <h2 className="text-2xl font-bold">340</h2>
          <p className="text-gray-400 text-sm">Profissionais ativos</p>
        </div>

        <div className="bg-[#0f172a] p-6 rounded-xl text-center border border-slate-800">
          <h2 className="text-2xl font-bold">58%</h2>
          <p className="text-gray-400 text-sm">Precisão dos alertas</p>
        </div>

        <div className="bg-[#0f172a] p-6 rounded-xl text-center border border-slate-800">
          <h2 className="text-2xl font-bold">247</h2>
          <p className="text-gray-400 text-sm">Alertas emitidos</p>
        </div>

      </section>

      {/* Funcionalidades */}
      <section className="mt-20 max-w-6xl w-full">

        <h2 className="text-3xl font-bold text-center mb-12">
          Tudo que você precisa em campo e no escritório
        </h2>

        <div className="grid md:grid-cols-2 gap-6">

          <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800">
            <h3 className="text-blue-400 font-semibold">
              Mapeamento de Risco
            </h3>
            <p className="text-gray-400 mt-2 text-sm">
              Mapas avançados com precisão geológica em tempo real.
            </p>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800">
            <h3 className="text-yellow-400 font-semibold">
              Alertas Emergenciais
            </h3>
            <p className="text-gray-400 mt-2 text-sm">
              Emita alertas técnicos e notifique equipes em campo.
            </p>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800">
            <h3 className="text-green-400 font-semibold">
              Análise de Dados
            </h3>
            <p className="text-gray-400 mt-2 text-sm">
              Gráficos históricos e indicadores geológicos.
            </p>
          </div>

          <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800">
            <h3 className="text-purple-400 font-semibold">
              Relatórios Técnicos
            </h3>
            <p className="text-gray-400 mt-2 text-sm">
              Gere relatórios completos com exportação em PDF.
            </p>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="mt-20 mb-20 w-full max-w-4xl bg-[#0f172a] border border-blue-900 rounded-2xl p-12 text-center">

        <h2 className="text-2xl font-bold">
          Proteja vidas com dados precisos
        </h2>

        <p className="text-gray-400 mt-4">
          Acesso ao painel completo de monitoramento
          e tomada de decisões baseada em evidências.
        </p>

        <Link
          href="/Login"
          className="inline-block mt-6 bg-blue-600 px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Entrar na plataforma →
        </Link>

      </section>

    </main>
  );
}