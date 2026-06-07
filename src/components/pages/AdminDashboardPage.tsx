import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Users, AlertCircle, CheckCircle, TrendingDown, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios, AvaliaesdeEnfermagem, AvaliaesMdicas } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    attentionPatients: 0,
    stablePatients: 0,
    totalChecklists: 0,
    nursingEvaluations: 0,
    medicalEvaluations: 0,
    averagePain: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const { items: checklists } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      const { items: nursingEvals } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const { items: medicalEvals } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');

      const criticalCount = checklists.filter(c => c.riskLevel === 'critical').length;
      const attentionCount = checklists.filter(c => c.riskLevel === 'attention').length;
      const stableCount = checklists.filter(c => c.riskLevel === 'stable').length;

      const totalPain = checklists.reduce((sum, c) => sum + (c.painLevel || 0), 0);
      const avgPain = checklists.length > 0 ? totalPain / checklists.length : 0;

      setStats({
        totalPatients: patients.length,
        criticalPatients: criticalCount,
        attentionPatients: attentionCount,
        stablePatients: stableCount,
        totalChecklists: checklists.length,
        nursingEvaluations: nursingEvals.length,
        medicalEvaluations: medicalEvals.length,
        averagePain: Math.round(avgPain * 10) / 10,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const riskDistributionData = [
    { name: 'Estável', value: stats.stablePatients, color: '#32CD32' },
    { name: 'Atenção', value: stats.attentionPatients, color: '#FFD700' },
    { name: 'Crítico', value: stats.criticalPatients, color: '#FF0000' },
  ];

  const activityData = [
    { name: 'Checklists', value: stats.totalChecklists },
    { name: 'Aval. Enfermagem', value: stats.nursingEvaluations },
    { name: 'Aval. Médica', value: stats.medicalEvaluations },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-secondary/30">
        <div className="max-w-[120rem] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">Pós-Op Conectado</h1>
                <p className="font-paragraph text-sm text-foreground/60">Dashboard Administrativo</p>
              </div>
            </Link>
            <Link to="/">
              <button
                onClick={() => {
                  localStorage.removeItem('professionalId');
                  localStorage.removeItem('professionalProfile');
                }}
                className="px-6 py-2 bg-destructive text-destructive-foreground font-paragraph font-semibold rounded-lg hover:opacity-90 transition-opacity"
              >
                Sair
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="mb-8">
          <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
            Visão Geral do Sistema
          </h2>
          <p className="font-paragraph text-lg text-foreground/70">
            Métricas e estatísticas gerais de monitoramento
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <span className="font-heading text-4xl font-bold text-foreground">{stats.totalPatients}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Pacientes Monitorados</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-critical/10 rounded-2xl p-6 border border-critical/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-critical rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-critical-foreground" />
              </div>
              <span className="font-heading text-4xl font-bold text-critical">{stats.criticalPatients}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Alertas Críticos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-stable/10 rounded-2xl p-6 border border-stable/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-stable rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-stable-foreground" />
              </div>
              <span className="font-heading text-4xl font-bold text-stable">{stats.stablePatients}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Pacientes Estáveis</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-primary/10 rounded-2xl p-6 border border-primary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-heading text-4xl font-bold text-foreground">{stats.averagePain}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Média de Dor (0-10)</p>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Risk Distribution */}
          <div className="bg-white rounded-2xl p-8 border border-secondary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Distribuição por Risco</h3>
                <p className="font-paragraph text-sm text-foreground/60">Status dos pacientes</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #ADD8E6',
                    borderRadius: '8px',
                    fontFamily: 'nunito sans'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-2xl p-8 border border-secondary/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Atividades do Sistema</h3>
                <p className="font-paragraph text-sm text-foreground/60">Total de registros</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ADD8E6" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#333333', fontSize: 12 }}
                  stroke="#ADD8E6"
                />
                <YAxis 
                  tick={{ fill: '#333333', fontSize: 12 }}
                  stroke="#ADD8E6"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #ADD8E6',
                    borderRadius: '8px',
                    fontFamily: 'nunito sans'
                  }}
                />
                <Bar dataKey="value" fill="#00BFFF" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-dark-background rounded-3xl p-12">
          <h3 className="font-heading text-3xl font-bold text-dark-foreground mb-8 text-center">
            Impacto do Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-stable/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-stable" />
              </div>
              <p className="font-heading text-4xl font-bold text-dark-foreground mb-2">98%</p>
              <p className="font-paragraph text-base text-dark-foreground/80">Taxa de Recuperação</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-8 h-8 text-primary" />
              </div>
              <p className="font-heading text-4xl font-bold text-dark-foreground mb-2">45%</p>
              <p className="font-paragraph text-base text-dark-foreground/80">Redução de Reinternações</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-attention/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-attention" />
              </div>
              <p className="font-heading text-4xl font-bold text-dark-foreground mb-2">24/7</p>
              <p className="font-paragraph text-base text-dark-foreground/80">Monitoramento Contínuo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
