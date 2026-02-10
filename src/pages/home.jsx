import { Link } from 'react-router-dom'
import { Calendar, ShieldCheck, Zap, ArrowRight, Check, PlayCircle, Star, MousePointer2, Smartphone } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-indigo-500 selection:text-white relative">
      
      {/* BACKGROUND AURORA (O Efeito Hipnótico) */}
      <div className="fixed inset-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        {/* Blob Roxo */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        {/* Blob Azul */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        {/* Blob Rosa */}
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        {/* Grid Overlay para textura */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      {/* NAVBAR FLUTUANTE PREMIUM */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl h-14 flex justify-between items-center bg-white/60 backdrop-blur-xl border border-white/40 rounded-full z-50 shadow-lg shadow-black/5 ring-1 ring-black/5 px-6 transition-all hover:bg-white/80">
        <div className="flex items-center gap-2 font-bold text-slate-900 tracking-tight cursor-pointer group">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
            <Calendar size={16} strokeWidth={3} />
          </div>
          <span className="hidden sm:block group-hover:text-indigo-600 transition-colors">AgendaGarantida</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#funcionalidades" className="hover:text-indigo-600 transition-colors relative group">
            Funcionalidades
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
          </a>
          <a href="#" className="hover:text-indigo-600 transition-colors relative group">
            Preço
             <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-indigo-600 transition-all group-hover:w-full"></span>
          </a>
        </div>

        <div className="flex gap-3">
          <Link to="/login" className="px-5 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-indigo-600 hover:shadow-indigo-500/30 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
            Acessar
          </Link>
        </div>
      </nav>

      {/* HERO SECTION COM ANIMAÇÃO DE ENTRADA */}
      <main className="pt-44 pb-20 px-6 relative">
        <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
          
          {/* Badge Brilhante */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-200/60 bg-white/50 backdrop-blur-sm text-indigo-700 text-xs font-bold uppercase tracking-wide mb-8 shadow-sm hover:scale-105 transition-transform cursor-default">
            <Star size={12} className="text-yellow-500 fill-yellow-500" />
            O Fim do "No-Show" chegou
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-slate-900 mb-8 leading-[0.9]">
            Sua agenda, <br/>
            <span className="animate-shimmer">blindada.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
            O único sistema onde o agendamento só acontece <span className="text-slate-900 underline decoration-indigo-400 decoration-2 underline-offset-4">depois</span> do Pix cair na conta.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
            <Link to="/login" className="group relative px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl text-lg overflow-hidden shadow-2xl shadow-indigo-900/20 hover:shadow-indigo-600/40 transition-all hover:-translate-y-1">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative flex items-center gap-2">
                Começar Grátis <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link to="/michele-batista" className="flex items-center gap-2 px-8 py-4 bg-white/80 backdrop-blur text-slate-700 font-bold rounded-2xl text-lg border border-slate-200 hover:bg-white hover:scale-105 transition-all shadow-sm">
              <PlayCircle size={20} className="text-indigo-600" />
              Ver na Prática
            </Link>
          </div>

          {/* MOCKUP 3D COM REFLEXO - O "TCHAM" VISUAL */}
          <div className="relative mx-auto max-w-5xl group perspective-1000">
            {/* Glow Traseiro */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative bg-slate-900 rounded-[2rem] p-2 ring-1 ring-white/10 shadow-2xl transform transition-transform duration-500 hover:scale-[1.01] hover:rotate-x-2">
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-[2rem] pointer-events-none"></div>
              
              {/* Tela do App Fake */}
              <div className="bg-slate-50 rounded-[1.5rem] overflow-hidden border border-slate-800/50 min-h-[400px] md:h-[500px] relative">
                
                {/* Header do App Fake */}
                <div className="bg-white border-b border-slate-100 p-4 flex justify-between items-center">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="bg-slate-100 px-3 py-1 rounded-md text-[10px] text-slate-400 font-mono">lock.secure/payment_confirmed</div>
                </div>

                {/* Conteúdo do App Fake */}
                <div className="p-8 grid md:grid-cols-2 gap-8 h-full items-center">
                   <div className="space-y-6 text-left">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase"><Check size={12}/> Pix Confirmado</div>
                      <h3 className="text-3xl font-black text-slate-900">Consulta Confirmada!</h3>
                      <p className="text-slate-500 text-sm">O valor de <strong>R$ 150,00</strong> já está na sua conta. O horário das 14:00 foi bloqueado na sua agenda.</p>
                      
                      {/* Cartão de Notificação Fake */}
                      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-lg flex items-center gap-4 animate-bounce">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white"><Smartphone size={20}/></div>
                          <div>
                            <div className="text-xs text-slate-400">Notificação Push</div>
                            <div className="text-sm font-bold text-slate-800">Novo Pix Recebido: R$ 150,00</div>
                          </div>
                      </div>
                   </div>

                   {/* Calendário Visual Fake */}
                   <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-600/5 pointer-events-none"></div>
                      <div className="grid grid-cols-3 gap-2 opacity-50">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="h-16 bg-slate-50 rounded-lg border border-slate-100"></div>
                        ))}
                      </div>
                      {/* Card Flutuante por cima */}
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-xl shadow-indigo-600/30 transform scale-110">
                            <div className="text-xs opacity-80 uppercase font-bold">Terça-Feira</div>
                            <div className="text-2xl font-black">14:00</div>
                            <div className="text-xs bg-white/20 px-2 py-0.5 rounded mt-2 inline-block">Ocupado</div>
                         </div>
                      </div>
                   </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>

      {/* CARROSSEL INFINITO DE LOGOS (MARQUEE) */}
      <section className="py-10 border-y border-slate-200/60 bg-white/50 backdrop-blur-sm overflow-hidden">
        <div className="relative flex overflow-x-hidden group">
          <div className="animate-marquee whitespace-nowrap flex gap-16 px-8 items-center opacity-40 grayscale transition-all hover:opacity-100 hover:grayscale-0">
             {/* Repetir várias vezes para dar o efeito de infinito */}
             <span className="text-2xl font-black italic tracking-tighter">PSI.CO</span>
             <span className="text-2xl font-bold font-serif">Advocacia+</span>
             <span className="text-2xl font-light tracking-widest uppercase border-2 border-black px-2">NUTRILAB</span>
             <span className="text-2xl font-black tracking-tight text-indigo-900">MENTORIA.AI</span>
             <span className="text-2xl font-bold">ZenApp</span>
             <span className="text-2xl font-black italic tracking-tighter">PSI.CO</span>
             <span className="text-2xl font-bold font-serif">Advocacia+</span>
             <span className="text-2xl font-light tracking-widest uppercase border-2 border-black px-2">NUTRILAB</span>
             <span className="text-2xl font-black tracking-tight text-indigo-900">MENTORIA.AI</span>
             <span className="text-2xl font-bold">ZenApp</span>
          </div>
          {/* Duplicata para o loop perfeito (opcional se o CSS lidar com isso) */}
        </div>
      </section>

      {/* BENTO GRID INTERATIVO */}
      <section id="funcionalidades" className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Card 1: Focado em Pix */}
            <div className="md:col-span-2 group relative bg-white rounded-3xl p-1 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative h-full bg-slate-50 rounded-[22px] p-10 overflow-hidden">
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Zap size={28} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Pagamento Instantâneo</h3>
                  <p className="text-lg text-slate-500 max-w-md group-hover:text-slate-700 transition-colors">
                    Esqueça boletos e TEDs. O sistema gera um QR Code Pix dinâmico e só libera a agenda quando o banco confirma o recebimento.
                  </p>
                </div>
                {/* Efeito visual de fundo */}
                <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                   <Zap size={300} />
                </div>
              </div>
            </div>

            {/* Card 2: Setup Rápido */}
            <div className="group relative bg-white rounded-3xl p-1 overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-slate-900"></div>
              <div className="relative h-full bg-slate-900 rounded-[22px] p-8 flex flex-col justify-between overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                 
                 <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center text-white mb-6">
                    <MousePointer2 size={24} />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-white mb-2">Zero Configuração</h3>
                   <p className="text-slate-400 text-sm">Não precisa entender de código. Crie sua conta, conecte seu Pix e pronto.</p>
                 </div>
              </div>
            </div>

            {/* Card 3: Link Mágico */}
            <div className="group bg-white rounded-3xl p-8 border border-slate-100 hover:border-indigo-200 transition-all duration-300">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-6">
                 <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Mobile First</h3>
              <p className="text-slate-500 text-sm">Seu cliente agenda pelo celular em menos de 45 segundos.</p>
            </div>

            {/* Card 4: Segurança */}
            <div className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-white rounded-3xl p-8 border border-slate-100 flex items-center gap-8 relative overflow-hidden group">
               <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-indigo-200 to-transparent opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
               <div className="relative z-10 max-w-lg">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Dados Criptografados</h3>
                  <p className="text-slate-500">Tanto seus dados quanto os do seu paciente estão seguros com criptografia de ponta a ponta.</p>
               </div>
               <div className="hidden md:block ml-auto">
                  <ShieldCheck size={64} className="text-indigo-200 group-hover:text-indigo-300 transition-colors" />
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* CTA FOOTER */}
      <footer className="py-20 px-6 border-t border-slate-200 bg-white relative overflow-hidden">
         <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
         <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Sua paz de espírito custa<br/>menos que um café.</h2>
            <Link to="/login" className="inline-flex items-center gap-3 px-10 py-5 bg-slate-900 text-white font-bold rounded-full text-lg hover:bg-indigo-600 hover:scale-105 transition-all shadow-xl">
               Criar Conta Gratuita
            </Link>
            <p className="mt-8 text-sm text-slate-400">© 2026 AgendaGarantida Inc.</p>
         </div>
      </footer>

    </div>
  )
}