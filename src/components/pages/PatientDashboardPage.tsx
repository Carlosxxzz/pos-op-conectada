import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Calendar, History, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { Pacientes, ChecklistsDirios } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { logger } from '@/lib/logger';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';

export default function PatientDashboardPage() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Pacientes | null>(null);
  const [checklists, setChecklists] = useState<ChecklistsDirios[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Maintain session persistence
  useSessionPersistence();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const patientId = localStorage.getItem('patientId');
      if (!patientId) {
        logger.warn('PatientDashboard', 'loadData', 'No patientId found in localStorage');
        navigate('/patient-login');
        return;
      }

      logger.info('PatientDashboard', 'loadData', 'Loading patient data', { patientId: patientId.substring(0, 8) });

      const patientData = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
      if (!patientData) {
        logger.error('PatientDashboard', 'loadData', 'Patient data not found');
        setError('Dados do paciente não encontrados. Por favor, faça login novamente.');
        navigate('/patient-login');
        return;
      }
      
      setPatient(patientData);
      logger.info('PatientDashboard', 'loadData', 'Patient data loaded successfully');

      const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      setChecklists(items);
      logger.info('PatientDashboard', 'loadData', 'Checklists loaded', { count: items.length });
    } catch (error) {
      logger.error('PatientDashboard', 'loadData', 'Error loading data', error);
      setError('Erro ao carregar dados. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logger.info('PatientDashboard', 'handleLogout', 'User logging out');
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

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 border-2 border-secondary/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
            <h2 className="font-heading text-2xl font-bold text-foreground">Erro</h2>
          </div>
          <p className="font-paragraph text-lg text-foreground/70 mb-6">{error}</p>
          <Button
            onClick={() => {
              setError('');
              loadData();
            }}
            className="w-full bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16"
          >
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b-2 border-secondary/30 flex-shrink-0 sticky top-0 z-40">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 flex-1">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="font-heading text-xl font-bold text-foreground leading-tight">Pós-Op</h1>
                <p className="font-paragraph text-xs text-foreground/60">Conectado</p>
              </div>
            </Link>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 font-paragraph font-bold py-3 px-4 rounded-2xl border-2 h-14 text-base"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">
            Olá, {patient.fullName?.split(' ')[0]}!
          </h2>
          <p className="font-paragraph text-lg text-foreground/70">
            Bem-vindo ao seu acompanhamento
          </p>
        </div>

        {/* Quick Actions - Large Buttons */}
        <div className="space-y-4 mb-8">
          <Link
            to="/patient-checklist"
            className="block bg-primary rounded-3xl p-6 hover:opacity-90 transition-opacity border-2 border-primary"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-2xl font-bold text-white mb-1">
                  Checklist Diário
                </h3>
                <p className="font-paragraph text-base text-white/80">
                  Responda ao questionário enviado pela equipe de saúde
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/patient-evaluations"
            className="block bg-white rounded-3xl p-6 border-2 border-secondary/30 hover:bg-background transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <History className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-2xl font-bold text-foreground mb-1">
                  Avaliação da Equipe
                </h3>
                <p className="font-paragraph text-base text-foreground/70">
                  Visualize as avaliações da equipe de saúde
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/patient-history"
            className="block bg-white rounded-3xl p-6 border-2 border-secondary/30 hover:bg-background transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <History className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-2xl font-bold text-foreground mb-1">
                  Histórico
                </h3>
                <p className="font-paragraph text-base text-foreground/70">
                  Visualize seu histórico de acompanhamentos
                </p>
              </div>
            </div>
          </Link>
        </div>

        {/* Latest Checklist Status */}
        <div className="bg-white rounded-3xl p-6 border-2 border-secondary/30 mb-6">
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Último Checklist</h3>
          {latestChecklist ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b-2 border-secondary/20">
                <span className="font-paragraph text-base text-foreground/60">Data</span>
                <span className="font-paragraph text-lg font-bold text-foreground">
                  {new Date(latestChecklist.checklistDate || '').toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b-2 border-secondary/20">
                <span className="font-paragraph text-base text-foreground/60">Nível de Dor</span>
                <span className="font-paragraph text-lg font-bold text-foreground">
                  {latestChecklist.painLevel}/10
                </span>
              </div>
              <div className="flex items-center justify-between pb-4 border-b-2 border-secondary/20">
                <span className="font-paragraph text-base text-foreground/60">Temperatura</span>
                <span className="font-paragraph text-lg font-bold text-foreground">
                  {latestChecklist.bodyTemperature}°C
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-paragraph text-base text-foreground/60">Status</span>
                <span className={`font-paragraph text-base font-bold px-4 py-2 rounded-2xl ${
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
              <Clock className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <p className="font-paragraph text-lg text-foreground/60 mb-6">
                Nenhum checklist preenchido ainda
              </p>
              <Link
                to="/patient-checklist"
                className="inline-block"
              >
                <Button className="bg-primary text-white hover:opacity-90 font-paragraph font-bold py-4 rounded-2xl text-lg h-16 px-8">
                  Preencher agora
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recovery Status */}
        <div className="bg-white rounded-3xl p-6 border-2 border-secondary/30 mb-6">
          <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Status da Recuperação</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-stable/10 rounded-2xl border-2 border-stable/20">
              <CheckCircle className="w-8 h-8 text-stable flex-shrink-0 mt-1" />
              <div>
                <p className="font-paragraph text-lg font-bold text-foreground mb-1">
                  Acompanhamento Ativo
                </p>
                <p className="font-paragraph text-base text-foreground/70">
                  Você está sendo monitorado
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-primary/10 rounded-2xl border-2 border-primary/20">
              <AlertCircle className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-paragraph text-lg font-bold text-foreground mb-1">
                  Checklist Diário
                </p>
                <p className="font-paragraph text-base text-foreground/70">
                  Preencha todos os dias
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
