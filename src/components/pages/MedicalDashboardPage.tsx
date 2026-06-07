import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Stethoscope, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { AvaliaesdeEnfermagem, Pacientes } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { motion } from 'framer-motion';

interface ReferredCase {
  evaluation: AvaliaesdeEnfermagem;
  patient: Pacientes | null;
}

export default function MedicalDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [referredCases, setReferredCases] = useState<ReferredCase[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { items: evaluations } = await BaseCrudService.getAll<AvaliaesdeEnfermagem>('avaliacoesenfermagem');
      const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');

      const referred = evaluations
        .filter(e => e.referredToDoctor)
        .map(evaluation => {
          const patient = patients.find(p => p._id === evaluation.patientId);
          return { evaluation, patient: patient || null };
        })
        .sort((a, b) => 
          new Date(b.evaluation.checklistDate || 0).getTime() - new Date(a.evaluation.checklistDate || 0).getTime()
        );

      setReferredCases(referred);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
                <p className="font-paragraph text-sm text-foreground/60">Dashboard Médico</p>
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
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 border border-secondary/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-primary" />
              </div>
              <span className="font-heading text-3xl font-bold text-foreground">{referredCases.length}</span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Casos Encaminhados</p>
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
              <span className="font-heading text-3xl font-bold text-critical">
                {referredCases.filter(c => c.evaluation.patientStatus === 'critical').length}
              </span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Casos Críticos</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-attention/10 rounded-2xl p-6 border border-attention/20"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-attention rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-attention-foreground" />
              </div>
              <span className="font-heading text-3xl font-bold text-attention-foreground">
                {referredCases.filter(c => c.evaluation.patientStatus === 'observation').length}
              </span>
            </div>
            <p className="font-paragraph text-sm text-foreground/70">Em Observação</p>
          </motion.div>
        </div>

        {/* Referred Cases */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <Stethoscope className="w-6 h-6 text-primary" />
            <h2 className="font-heading text-3xl font-bold text-foreground">
              Casos Encaminhados pela Enfermagem
            </h2>
          </div>

          {referredCases.length > 0 ? (
            <div className="space-y-4">
              {referredCases.map((item, index) => (
                <motion.div
                  key={item.evaluation._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link
                    to={`/medical-evaluation/${item.patient?._id}`}
                    className={`block rounded-2xl p-6 border-2 hover:opacity-80 transition-opacity ${
                      item.evaluation.patientStatus === 'critical'
                        ? 'bg-critical/10 border-critical'
                        : item.evaluation.patientStatus === 'observation'
                        ? 'bg-attention/10 border-attention/30'
                        : 'bg-white border-secondary/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-heading text-xl font-bold text-foreground">
                            {item.patient?.fullName || 'Paciente'}
                          </span>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            item.evaluation.patientStatus === 'critical'
                              ? 'bg-critical text-critical-foreground'
                              : item.evaluation.patientStatus === 'observation'
                              ? 'bg-attention text-attention-foreground'
                              : 'bg-stable text-stable-foreground'
                          }`}>
                            {item.evaluation.patientStatus === 'critical'
                              ? 'CRÍTICO'
                              : item.evaluation.patientStatus === 'observation'
                              ? 'OBSERVAÇÃO'
                              : 'ESTÁVEL'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Cirurgia</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">
                              {item.patient?.surgeryType || '-'}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Enfermeiro(a)</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">
                              {item.evaluation.nurseName}
                            </p>
                          </div>
                          <div>
                            <p className="font-paragraph text-xs text-foreground/60 mb-1">Data da Avaliação</p>
                            <p className="font-paragraph text-sm font-semibold text-foreground">
                              {item.evaluation.checklistDate
                                ? new Date(item.evaluation.checklistDate).toLocaleDateString('pt-BR')
                                : '-'}
                            </p>
                          </div>
                        </div>

                        <div className="bg-background/50 rounded-xl p-4">
                          <p className="font-paragraph text-xs text-foreground/60 mb-2">Observações Clínicas:</p>
                          <p className="font-paragraph text-sm text-foreground line-clamp-2">
                            {item.evaluation.clinicalObservations}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-primary flex-shrink-0 ml-4" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-16 border border-secondary/20 text-center">
              <Stethoscope className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <p className="font-paragraph text-lg text-foreground/60">
                Nenhum caso encaminhado no momento
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
