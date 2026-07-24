
// HPI 1.7-G
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Users, Stethoscope, Shield, TrendingDown, Clock, ArrowRight, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Image } from '@/components/ui/image';

const PLACEHOLDER_IMG = "https://static.wixstatic.com/media/2621fb_8a5d7587b48d4e81863254166203f083~mv2.png?originWidth=1280&originHeight=704";

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground font-paragraph selection:bg-primary/30 selection:text-primary-foreground overflow-clip">
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(173, 216, 230, 0.3);
        }
        .text-gradient {
          background: linear-gradient(135deg, #00BFFF 0%, #0A192F 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .mesh-bg {
          background-color: #0A192F;
          background-image:
            radial-gradient(at 0% 0%, rgba(0, 191, 255, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(173, 216, 230, 0.1) 0px, transparent 50%);
        }
        .hairline-grid {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, rgba(173, 216, 230, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(173, 216, 230, 0.2) 1px, transparent 1px);
        }
      `}</style>

      <Header scrollYProgress={scrollYProgress} />

      <main>
        <HeroSection />
        <StatsSection />
        <SystemArchitectureSection />
        <VisualBreather />
        <TriageSection />
      </main>

      <Footer />
    </div>
  );
}

function Header({ scrollYProgress }: { scrollYProgress: any }) {
  const headerBg = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["rgba(255, 255, 255, 0)", "rgba(255, 255, 255, 0.9)"]
  );
  const headerBorder = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["rgba(173, 216, 230, 0)", "rgba(173, 216, 230, 0.3)"]
  );
  const headerBlur = useTransform(
    scrollYProgress,
    [0, 0.05],
    ["blur(0px)", "blur(12px)"]
  );

  return (
    <motion.header
      style={{
        backgroundColor: headerBg,
        borderColor: headerBorder,
        backdropFilter: headerBlur,
        WebkitBackdropFilter: headerBlur
      }}
      className="fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300"
    >
      <div className="w-full max-w-[120rem] mx-auto px-6 md:px-12 h-24 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300 shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-heading text-xl font-bold text-foreground leading-tight tracking-tight">Pós-Op Conectado</span>
            <span className="text-xs text-foreground/60 font-medium tracking-wider uppercase">Healthtech System</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {[
            { name: 'Área do Paciente', path: '/patient-login' },
            { name: 'Acesso Profissional', path: '/professional-login' }
          ].map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-sm font-semibold text-foreground/80 hover:text-primary transition-colors relative group py-2"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="lg:hidden">
          {/* Mobile menu placeholder - functionality preserved via links elsewhere */}
          <div className="w-10 h-10 flex flex-col justify-center items-center gap-1.5 bg-secondary/20 rounded-lg">
            <span className="w-5 h-[2px] bg-foreground block" />
            <span className="w-5 h-[2px] bg-foreground block" />
            <span className="w-5 h-[2px] bg-foreground block" />
          </div>
        </div>
      </div>
    </motion.header>
  );
}

function HeroSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  const yImage = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityText = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const yText = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={sectionRef} className="relative w-full min-h-screen pt-24 pb-12 md:pb-20 flex items-center bg-background hairline-grid">
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-r from-transparent via-secondary/20 to-transparent transform -skew-x-12" />
      </div>

      <div className="w-full max-w-[120rem] mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start lg:items-center relative z-10">

        <motion.div
          style={{ opacity: opacityText, y: yText }}
          className="lg:col-span-6 flex flex-col justify-center pt-8 md:pt-12 lg:pt-0"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 w-fit mb-6 md:mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-bold text-primary tracking-wider uppercase">Monitoramento Contínuo</span>
          </div>

          <h1 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-4 md:mb-6 tracking-tight">
            Precisão no <br/>
            <span className="text-gradient">Pós-Operatório.</span>
          </h1>

          <p className="text-base md:text-lg lg:text-xl text-foreground/70 mb-8 md:mb-10 max-w-2xl leading-relaxed">
            Plataforma digital para hospitais públicos. Reduzimos complicações após a alta hospitalar através de monitoramento remoto, triagem inteligente e conexão direta entre pacientes e equipes médicas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pb-4">
            <Link
              to="/patient-login"
              className="group relative inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-primary text-primary-foreground font-bold rounded-xl overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              <span className="relative flex items-center gap-2">
                Acesso do Paciente
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
            <Link
              to="/professional-login"
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 bg-transparent text-foreground border-2 border-secondary/50 font-bold rounded-xl hover:bg-secondary/10 hover:border-primary/50 transition-all"
            >
              Acesso Profissional
            </Link>
          </div>
        </motion.div>

        <div className="lg:col-span-6 relative h-[50vh] md:h-[60vh] lg:h-[80vh] w-full rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-white/20">
          <motion.div style={{ y: yImage }} className="absolute inset-[-10%] w-[120%] h-[120%]">
            <Image
              src={PLACEHOLDER_IMG}
              alt="Interface do sistema Pós-Op Conectado"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-background/40 to-transparent mix-blend-multiply" />
          </motion.div>

          {/* Floating UI Element */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="absolute bottom-4 md:bottom-8 left-4 md:left-8 right-4 md:right-8 glass-panel rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-stable/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-stable" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Status do Paciente</p>
                <p className="text-xs text-foreground/60">Atualizado há 2 min</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-stable font-bold">Estável</p>
              <p className="text-xs text-foreground/60">Risco Baixo</p>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { icon: Shield, value: "98%", label: "Taxa de Recuperação", color: "text-stable" },
    { icon: TrendingDown, value: "45%", label: "Redução de Reinternações", color: "text-primary" },
    { icon: Clock, value: "24/7", label: "Monitoramento Contínuo", color: "text-attention" },
    { icon: Users, value: "1.2k+", label: "Pacientes Ativos", color: "text-foreground" }
  ];

  return (
    <section className="w-full bg-white border-y border-secondary/30 relative z-20">
      <div className="max-w-[120rem] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-secondary/30">
          {stats.map((stat, index) => (
            <div key={index} className="py-12 px-6 flex flex-col items-center text-center group">
              <stat.icon className={`w-8 h-8 mb-4 opacity-70 group-hover:opacity-100 transition-opacity ${stat.color}`} />
              <p className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-2 tracking-tight">{stat.value}</p>
              <p className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SystemArchitectureSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const pillars = [
    {
      id: "patient",
      title: "Área do Paciente",
      icon: Users,
      description: "Interface simplificada para o paciente reportar seu estado diário, garantindo adesão ao tratamento.",
      features: ["Checklist diário de sintomas", "Upload de fotos da cicatriz", "Histórico de recuperação", "Orientações personalizadas"],
      link: "/patient-login",
      linkText: "Acessar Portal do Paciente"
    },
    {
      id: "nursing",
      title: "Área da Enfermagem",
      icon: Activity,
      description: "Dashboard operacional para triagem e acompanhamento contínuo da evolução dos pacientes.",
      features: ["Dashboard com priorização inteligente", "Avaliação de checklists e fotos", "Envio de orientações", "Encaminhamento médico"],
      link: "/nursing-dashboard",
      linkText: "Acessar Painel de Enfermagem"
    },
    {
      id: "medical",
      title: "Área Médica",
      icon: Stethoscope,
      description: "Ambiente clínico para análise profunda de casos escalados e tomada de decisão médica.",
      features: ["Casos encaminhados pela enfermagem", "Histórico clínico completo", "Recomendações clínicas", "Ajuste de medicação"],
      link: "/medical-dashboard",
      linkText: "Acessar Painel Médico"
    }
  ];

  return (
    <section ref={containerRef} className="w-full bg-background py-32 relative">
      <div className="max-w-[120rem] mx-auto px-6 md:px-12">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Sticky Left Column */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-32">
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-6">
                Arquitetura do <br/>Cuidado Integrado
              </h2>
              <p className="text-lg text-foreground/70 mb-8">
                Três interfaces especializadas trabalhando em sincronia para garantir a segurança do paciente e a eficiência da equipe hospitalar.
              </p>

              {/* Progress Indicator */}
              <div className="hidden lg:block w-1 h-48 bg-secondary/30 rounded-full overflow-hidden relative">
                <motion.div
                  className="absolute top-0 left-0 w-full bg-primary"
                  style={{ height: useTransform(scrollYProgress, [0, 1], ["0%", "100%"]) }}
                />
              </div>
            </div>
          </div>

          {/* Scrolling Right Column */}
          <div className="lg:col-span-8 flex flex-col gap-24">
            {pillars.map((pillar, index) => (
              <PillarCard key={pillar.id} pillar={pillar} index={index} />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}

function PillarCard({ pillar, index }: { pillar: any, index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { margin: "-20% 0px -20% 0px" });

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-12'}`}
    >
      <div className="bg-white rounded-3xl p-8 md:p-12 border border-secondary/20 shadow-xl shadow-primary/5 relative overflow-hidden group">
        {/* Decorative background element */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mb-8 border border-secondary/30 shadow-sm">
              <pillar.icon className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading text-3xl font-bold text-foreground mb-4">{pillar.title}</h3>
            <p className="text-foreground/70 mb-8 leading-relaxed">{pillar.description}</p>

            <ul className="space-y-4 mb-8">
              {pillar.features.map((feature: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground/80">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              to={pillar.link}
              className="inline-flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all"
            >
              {pillar.linkText}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative h-[400px] rounded-2xl overflow-hidden border border-secondary/20">
            <Image
              src={PLACEHOLDER_IMG}
              alt={pillar.title}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualBreather() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const yBg = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <section ref={sectionRef} className="relative w-full h-[80vh] overflow-hidden flex items-center justify-center">
      <motion.div style={{ y: yBg }} className="absolute inset-[-20%] w-[140%] h-[140%] z-0">
        <Image
          src={PLACEHOLDER_IMG}
          alt="Equipe médica"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-dark-background/80 mix-blend-multiply" />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <Shield className="w-16 h-16 text-primary mx-auto mb-8 opacity-80" />
        <h2 className="font-heading text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
          A tecnologia não substitui o cuidado. <br/>
          <span className="text-primary">Ela o amplifica.</span>
        </h2>
        <p className="text-xl text-white/70 font-light">
          Conectando pacientes e profissionais para recuperações mais seguras.
        </p>
      </div>
    </section>
  );
}

function TriageSection() {
  return (
    <section className="w-full py-32 mesh-bg relative overflow-hidden">
      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '100px 100px'
      }} />

      <div className="max-w-[120rem] mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-fit mb-6">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-white tracking-wider uppercase">Inteligência Clínica</span>
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-6">
            Triagem Inteligente por Risco
          </h2>
          <p className="text-lg text-white/60 max-w-3xl mx-auto">
            O sistema analisa automaticamente os sintomas reportados no checklist diário e classifica os pacientes, destacando casos que exigem atenção imediata da equipe de enfermagem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">

          {/* Stable Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-stable transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            <div className="w-14 h-14 bg-stable/20 rounded-2xl flex items-center justify-center mb-6 border border-stable/30">
              <CheckCircle2 className="w-7 h-7 text-stable" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-2">Verde - Estável</h3>
            <p className="text-white/60 text-sm mb-6">Recuperação progredindo dentro do esperado. Sem sinais de alerta.</p>
            <ul className="space-y-2">
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-stable rounded-full"/> Dor controlada (0-3)</li>
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-stable rounded-full"/> Sem febre</li>
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-stable rounded-full"/> Cicatriz limpa</li>
            </ul>
          </div>

          {/* Attention Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-attention transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            <div className="w-14 h-14 bg-attention/20 rounded-2xl flex items-center justify-center mb-6 border border-attention/30">
              <AlertTriangle className="w-7 h-7 text-attention" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-2">Amarelo - Atenção</h3>
            <p className="text-white/60 text-sm mb-6">Sintomas moderados que requerem monitoramento próximo da enfermagem.</p>
            <ul className="space-y-2">
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-attention rounded-full"/> Dor moderada (4-7)</li>
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-attention rounded-full"/> Vermelhidão leve</li>
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-attention rounded-full"/> Dúvidas sobre medicação</li>
            </ul>
          </div>

          {/* Critical Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-critical transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
            <div className="w-14 h-14 bg-critical/20 rounded-2xl flex items-center justify-center mb-6 border border-critical/30">
              <ShieldAlert className="w-7 h-7 text-critical" />
            </div>
            <h3 className="font-heading text-2xl font-bold text-white mb-2">Vermelho - Crítico</h3>
            <p className="text-white/60 text-sm mb-6">Sinais de risco alto. Prioridade máxima para avaliação e possível encaminhamento médico.</p>
            <ul className="space-y-2">
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-critical rounded-full"/> Febre &gt; 38°C</li>
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-critical rounded-full"/> Dor intensa (8-10)</li>
              <li className="text-xs text-white/40 flex items-center gap-2"><span className="w-1 h-1 bg-critical rounded-full"/> Secreção ou falta de ar</li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-white border-t border-secondary/30 pt-20 pb-10">
      <div className="max-w-[120rem] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">

          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary-foreground" />
              </div>
              <h4 className="font-heading text-xl font-bold text-foreground">Pós-Op Conectado</h4>
            </div>
            <p className="text-sm text-foreground/60 leading-relaxed max-w-sm">
              Plataforma digital de monitoramento pós-operatório para hospitais públicos. Elevando o padrão de cuidado após a alta.
            </p>
          </div>

          <div className="md:col-span-2 md:col-start-6">
            <h5 className="font-heading text-sm font-bold text-foreground uppercase tracking-wider mb-6">Acesso Rápido</h5>
            <ul className="space-y-4">
              <li><Link to="/patient-login" className="text-sm text-foreground/60 hover:text-primary transition-colors">Área do Paciente</Link></li>
              <li><Link to="/professional-login" className="text-sm text-foreground/60 hover:text-primary transition-colors">Acesso Profissional</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-heading text-sm font-bold text-foreground uppercase tracking-wider mb-6">Suporte</h5>
            <ul className="space-y-4">
              <li className="text-sm text-foreground/60">Central de Ajuda</li>
              <li className="text-sm text-foreground/60">0800 123 4567</li>
              <li className="text-sm text-foreground/60">suporte@posopconectado.gov.br</li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <h5 className="font-heading text-sm font-bold text-foreground uppercase tracking-wider mb-6">Legal</h5>
            <ul className="space-y-4">
              <li className="text-sm text-foreground/60">Sobre o Projeto</li>
              <li className="text-sm text-foreground/60">Privacidade (LGPD)</li>
              <li className="text-sm text-foreground/60">Termos de Uso</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-secondary/30 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/50 font-semibold tracking-wide">
            © {new Date().getFullYear()} Pós-Op Conectado. Sistema de Monitoramento Pós-Operatório Digital.
          </p>
          <div className="flex items-center gap-2 text-xs text-foreground/50">
            <span>Desenvolvido para a Saúde Pública</span>
            <Shield className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </footer>
  );
}
