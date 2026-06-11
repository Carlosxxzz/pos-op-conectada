import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Calendar, Camera, History, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function PatientDashboardPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [checklists, setChecklists] = useState<ChecklistsDirios[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const patientId = localStorage.getItem('patientId');
    if (!patientId) {
      navigate('/patient-login');
      return;
    }

    try {
      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
      setPatient(patientData);

      const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      setChecklists(items);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('patientId');
    navigate('/patient-login');
  };

  const getLatestChecklist = () => {
    if (checklists.length === 0) return null;
    return checklists.sort((a, b) => 
      new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
    )[0];
  };

  const latestChecklist = getLatestChecklist();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!patient) {
    return null;
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
                <p className="font-paragraph text-sm text-foreground/60">Painel do Paciente</p>
              </div>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 font-paragraph"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
            Olá, {patient.fullName?.split(' ')[0]}!
          </h2>
          <p className="font-paragraph text-lg text-foreground/70">
            Bem-vindo ao seu painel de acompanhamento pós-operatório
          </p>
        </div>

        {/* Patient Info Card */}
        <div className="bg-white rounded-2xl p-8 border border-secondary/20 mb-8">
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Informações da Cirurgia</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-1">Tipo de Cirurgia</p>
              <p className="font-paragraph text-base font-semibold text-foreground">{patient.surgeryType}</p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-1">Data da Cirurgia</p>
              <p className="font-paragraph text-base font-semibold text-foreground">
                {patient.surgeryDate ? new Date(patient.surgeryDate).toLocaleDateString('pt-BR') : '-'}
              </p>
            </div>
            <div>
              <p className="font-paragraph text-sm text-foreground/60 mb-1">Hospital</p>
              <p className="font-paragraph text-base font-semibold text-foreground">{patient.responsibleHospital}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link
            to="/patient-checklist"
            className="bg-primary rounded-2xl p-8 hover:opacity-90 transition-opacity"
          >
            <div className="w-14 h-14 bg-primary-foreground/20 rounded-xl flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="font-heading text-xl font-bold text-primary-foreground mb-2">
              Checklist Diário
            </h3>
            <p className="font-paragraph text-sm text-primary-foreground/80">
              Responda seu questionário e envie foto
            </p>
          </Link>

          <Link
            to="/patient-history"
            className="bg-white rounded-2xl p-8 border border-secondary/20 hover:bg-background transition-colors"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <History className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">
              Histórico
            </h3>
            <p className="font-paragraph text-sm text-foreground/70">
              Veja sua evolução
            </p>
          </Link>
        </div>

        {/* Status Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest Checklist */}
          <div className="bg-white rounded-2xl p-8 border border-secondary/20">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Último Checklist</h3>
            {latestChecklist ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-secondary/20">
                  <span className="font-paragraph text-sm text-foreground/60">Data</span>
                  <span className="font-paragraph text-base font-semibold text-foreground">
                    {new Date(latestChecklist.checklistDate || '').toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-secondary/20">
                  <span className="font-paragraph text-sm text-foreground/60">Nível de Dor</span>
                  <span className="font-paragraph text-base font-semibold text-foreground">
                    {latestChecklist.painLevel}/10
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-secondary/20">
                  <span className="font-paragraph text-sm text-foreground/60">Temperatura</span>
                  <span className="font-paragraph text-base font-semibold text-foreground">
                    {latestChecklist.bodyTemperature}°C
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-paragraph text-sm text-foreground/60">Status</span>
                  <span className={`font-paragraph text-sm font-semibold px-3 py-1 rounded-full ${
                    latestChecklist.riskLevel === 'critical' 
                      ? 'bg-critical/10 text-critical'
                      : latestChecklist.riskLevel === 'attention'
                      ? 'bg-attention/10 text-attention-foreground'
                      : 'bg-stable/10 text-stable'
                  }`}>
                    {latestChecklist.riskLevel === 'critical' 
                      ? 'Crítico'
                      : latestChecklist.riskLevel === 'attention'
                      ? 'Atenção'
                      : 'Estável'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                <p className="font-paragraph text-base text-foreground/60">
                  Nenhum checklist preenchido ainda
                </p>
                <Link
                  to="/patient-checklist"
                  className="inline-block mt-4 text-primary font-paragraph font-semibold hover:underline"
                >
                  Preencher agora →
                </Link>
              </div>
            )}
          </div>

          {/* Recovery Status */}
          <div className="bg-white rounded-2xl p-8 border border-secondary/20">
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Status da Recuperação</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-stable/10 rounded-xl border border-stable/20">
                <CheckCircle className="w-6 h-6 text-stable flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-base font-semibold text-foreground mb-1">
                    Acompanhamento Ativo
                  </p>
                  <p className="font-paragraph text-sm text-foreground/70">
                    Você está sendo monitorado pela equipe de enfermagem
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-xl border border-primary/20">
                <AlertCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-base font-semibold text-foreground mb-1">
                    Checklist Diário
                  </p>
                  <p className="font-paragraph text-sm text-foreground/70">
                    Preencha seu checklist todos os dias para melhor acompanhamento
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl border border-secondary/40">
                <Camera className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-paragraph text-base font-semibold text-foreground mb-1">
                    Fotos da Cicatriz
                  </p>
                  <p className="font-paragraph text-sm text-foreground/70">
                    Envie fotos regularmente para acompanhamento visual
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
