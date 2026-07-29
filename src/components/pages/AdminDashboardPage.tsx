import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Users, AlertCircle, CheckCircle, TrendingDown, BarChart3 } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios, AvaliaesdeEnfermagem, AvaliaesMdicas, Profissionais } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ProfessionalProfileHeader from '@/components/ProfessionalProfileHeader';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [professional, setProfessional] = useState<Profissionais | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    criticalPatients: 0,
    attentionPatients: 0,
    stablePatients: 0,
    totalChecklists: 0,
    nursingEvaluations: 0,
    medicalEvaluations: 0,
    averagePain: 0,
    totalProfessionals: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get professional info from localStorage
      const professionalId = localStorage.getItem('professionalId');
      if (!professionalId) {
        navigate('/professional-login');
        return;
      }

      const professionalData = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
      setProfessional(professionalData);

      const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
      const { items: checklists } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      const { items: nursingEvals } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const { items: medicalEvals } = await BaseCrudService.getAll<AvaliaesMdicas>('avaliacoesmedicas');
      const { items: allProfessionals } = await BaseCrudService.getAll<Profissionais>('profissionais');

      const criticalCount = checklists.filter(c => c.riskLevel === 'critical').length;
      const attentionCount = checklists.filter(c => c.riskLevel === 'attention').length;
      const stableCount = checklists.filter(c => c.riskLevel === 'stable').length;

      const totalPain = checklists.reduce((sum, c) => sum + (c.painLevel || 0), 0);
      const avgPain = checklists.length > 0 ? totalPain / checklists.length : 0;

      // Filter professionals by admin's hospital
      const adminHospital = professionalData?.hospital;
      const hospitalProfessionals = adminHospital 
        ? allProfessionals.filter(p => p.hospital === adminHospital).length 
        : 0;

      setStats({
        totalPatients: patients.length,
        criticalPatients: criticalCount,
        attentionPatients: attentionCount,
        stablePatients: stableCount,
        totalChecklists: checklists.length,
        nursingEvaluations: nursingEvals.length,
        medicalEvaluations: medicalEvals.length,
        averagePain: Math.round(avgPain * 10) / 10,
        totalProfessionals: hospitalProfessionals,
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('professionalId');
    localStorage.removeItem('professionalProfile');
    navigate('/professional-login');
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
      <ProfessionalProfileHeader
        professional={professional}
        dashboardLink="/admin-dashboard"
        profileLink="/admin-profile"
        onLogout={handleLogout}
      />

      {/* Main Content - Full Width */}
      <div className="px-8 py-12 max-w-[100rem] mx-auto">
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
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Distribuição por Risco</h3>
                <p className="font-paragraph text-sm text-foreground/60">Status dos pacientes</p>
              </div>
            </div>
            
            {/* Responsive Chart Container */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Pie Chart - Centered */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={riskDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
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
                      formatter={(value) => `${value} pacientes`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend - Side on Desktop, Below on Mobile */}
              <div className="w-full lg:w-1/2 flex flex-col gap-4">
                {riskDistributionData.map((item, index) => {
                  const total = riskDistributionData.reduce((sum, d) => sum + d.value, 0);
                  const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-foreground/5 hover:bg-foreground/10 transition">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-paragraph text-sm font-medium text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="font-paragraph text-xs text-foreground/60">
                          {item.value} pacientes
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-heading text-base font-bold text-foreground">
                          {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-2xl p-8 border border-secondary/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold text-foreground">Atividades do Sistema</h3>
                <p className="font-paragraph text-sm text-foreground/60">Total de registros</p>
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <ResponsiveContainer width="100%" height={300} minWidth={250}>
                <BarChart data={activityData} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ADD8E6" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#333333', fontSize: 11 }}
                    stroke="#ADD8E6"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fill: '#333333', fontSize: 11 }}
                    stroke="#ADD8E6"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      border: '1px solid #ADD8E6',
                      borderRadius: '8px',
                      fontFamily: 'nunito sans'
                    }}
                    formatter={(value) => `${value} registros`}
                  />
                  <Bar dataKey="value" fill="#00BFFF" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-white rounded-2xl p-8 border border-secondary/20 mb-8">
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
            Resumo do Sistema
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-2">Total de Profissionais</p>
              <p className="font-heading text-3xl font-bold text-foreground">{stats.totalProfessionals}</p>
              <p className="font-paragraph text-xs text-foreground/50 mt-1">Profissionais do seu hospital</p>
            </div>
          </div>
        </div>

        {/* Management Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-primary/10 rounded-2xl p-8 border border-primary/20 cursor-pointer hover:bg-primary/20 transition"
          onClick={() => navigate('/admin-professionals')}
        >
          <h4 className="font-heading text-xl font-bold text-foreground mb-3">Gestão de Profissionais</h4>
          <p className="font-paragraph text-sm text-foreground/70 mb-4">
            Administre todos os profissionais do sistema, crie novos usuários e gerencie permissões
          </p>
          <Link to="/admin-professionals" className="text-primary font-heading font-bold hover:underline">
            Acessar →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
