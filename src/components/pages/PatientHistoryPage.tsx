import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ArrowLeft, TrendingUp, Calendar, Image as ImageIcon, Pill, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BaseCrudService } from '@/integrations';
import type { ChecklistsDirios, MedicacoesChecklist } from '@/entities';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Image } from '@/components/ui/image';
import ResponsiveImageDisplay from '@/components/ResponsiveImageDisplay';

export default function PatientHistoryPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [checklists, setChecklists] = useState<ChecklistsDirios[]>([]);
  const [medicationsByChecklist, setMedicationsByChecklist] = useState<{ [key: string]: MedicacoesChecklist[] }>({});
  const [referralStatus, setReferralStatus] = useState<{ [key: string]: string }>({});

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
      const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
      const patientChecklists = items.filter(c => c.patientId === patientId);
      setChecklists(patientChecklists.sort((a, b) => 
        new Date(a.checklistDate || 0).getTime() - new Date(b.checklistDate || 0).getTime()
      ));

      // Load medications for each checklist
      const { items: allMedications } = await BaseCrudService.getAll<MedicacoesChecklist>('medicacoeschecklist');
      const medsByChecklist: { [key: string]: MedicacoesChecklist[] } = {};
      
      patientChecklists.forEach(checklist => {
        const checklistDateStr = new Date(checklist.checklistDate || '').toISOString().split('T')[0];
        medsByChecklist[checklist._id] = allMedications.filter(med => {
          const medDateStr = new Date(med.checklistDate || '').toISOString().split('T')[0];
          return medDateStr === checklistDateStr;
        });
      });
      
      setMedicationsByChecklist(medsByChecklist);

      // Load referral status for each checklist
      const { items: allReferrals } = await BaseCrudService.getAll('encaminhamentosmedicos');
      const { items: nursingEvals } = await BaseCrudService.getAll('avaliacoesenfermagem');
      const { items: medicalEvals } = await BaseCrudService.getAll('avaliacoesmedicas');
      const statusMap: { [key: string]: string } = {};
      
      patientChecklists.forEach(checklist => {
        const referral = allReferrals.find((r: any) => r.checklistId === checklist._id && r.patientId === patientId);
        const nursing = nursingEvals.find((n: any) => n.checklistId === checklist._id);
        const medical = medicalEvals.find((m: any) => m.checklistId === checklist._id);
        
        // CASE 1: Nursing evaluation finalized (no referral)
        if (nursing && !referral && !medical) {
          statusMap[checklist._id] = 'Avaliação Finalizada';
        }
        // CASE 2: Medical evaluation completed
        else if (medical) {
          statusMap[checklist._id] = 'Avaliação Concluída';
        }
        // CASE 3: Referral pending
        else if (referral && referral.status !== 'CONCLUIDO') {
          statusMap[checklist._id] = 'Aguardando Avaliação Médica';
        }
      });
      
      setReferralStatus(statusMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = checklists.map(c => ({
    date: new Date(c.checklistDate || '').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    dor: c.painLevel || 0,
    temperatura: c.bodyTemperature || 36.5,
  }));

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
            <Link to="/patient-dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Activity className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground">AcompanhaMed</h1>
                <p className="font-paragraph text-sm text-foreground/60">Histórico de Acompanhamento</p>
              </div>
            </Link>
            <Link to="/patient-dashboard">
              <Button variant="outline" className="flex items-center gap-2 font-paragraph">
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[120rem] mx-auto px-8 py-12">
        <div className="mb-8">
          <h2 className="font-heading text-4xl font-bold text-foreground mb-2">
            Histórico de Acompanhamento
          </h2>
          <p className="font-paragraph text-lg text-foreground/70">
            Acompanhe sua evolução ao longo do tempo
          </p>
        </div>

        {checklists.length > 0 ? (
          <>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Pain Chart */}
              <div className="bg-white rounded-2xl p-8 border border-secondary/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Evolução da Dor</h3>
                    <p className="font-paragraph text-sm text-foreground/60">Últimos registros</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ADD8E6" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#333333', fontSize: 12 }}
                      stroke="#ADD8E6"
                    />
                    <YAxis 
                      domain={[0, 10]}
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
                    <Line 
                      type="monotone" 
                      dataKey="dor" 
                      stroke="#00BFFF" 
                      strokeWidth={3}
                      dot={{ fill: '#00BFFF', r: 5 }}
                      name="Nível de Dor"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Temperature Chart */}
              <div className="bg-white rounded-2xl p-8 border border-secondary/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-foreground">Temperatura Corporal</h3>
                    <p className="font-paragraph text-sm text-foreground/60">Últimos registros</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ADD8E6" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: '#333333', fontSize: 12 }}
                      stroke="#ADD8E6"
                    />
                    <YAxis 
                      domain={[35, 40]}
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
                    <Line 
                      type="monotone" 
                      dataKey="temperatura" 
                      stroke="#00BFFF" 
                      strokeWidth={3}
                      dot={{ fill: '#00BFFF', r: 5 }}
                      name="Temperatura (°C)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Checklist History */}
            <div className="bg-white rounded-2xl p-8 border border-secondary/20">
              <h3 className="font-heading text-2xl font-bold text-foreground mb-6">
                Acompanhamentos Completos
              </h3>
              <div className="space-y-6">
                {checklists.slice().reverse().map((checklist) => (
                  <div key={checklist._id} className="border border-secondary/20 rounded-xl overflow-hidden">
                    {/* Header with date and status */}
                    <div className="p-6 bg-background border-b border-secondary/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-paragraph text-base font-semibold text-foreground">
                              {new Date(checklist.checklistDate || '').toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="font-paragraph text-sm text-foreground/60">
                              {new Date(checklist.checklistDate || '').toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span className={`font-paragraph text-sm font-semibold px-3 py-1 rounded-full ${
                            checklist.riskLevel === 'critical' 
                              ? 'bg-critical/10 text-critical'
                              : checklist.riskLevel === 'attention'
                              ? 'bg-attention/10 text-attention-foreground'
                              : 'bg-stable/10 text-stable'
                          }`}>
                            {checklist.riskLevel === 'critical' 
                              ? 'Crítico'
                              : checklist.riskLevel === 'attention'
                              ? 'Atenção'
                              : 'Estável'}
                          </span>
                          {referralStatus[checklist._id] && (
                            <span className={`font-paragraph text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                              referralStatus[checklist._id] === 'Encaminhado ao Médico'
                                ? 'bg-attention/10 text-attention-foreground'
                                : referralStatus[checklist._id] === 'Continuidade'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-stable/10 text-stable'
                            }`}>
                              {referralStatus[checklist._id] === 'Encaminhado ao Médico' && (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {referralStatus[checklist._id] === 'Continuidade' && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {referralStatus[checklist._id] === 'Encaminhado ao Médico'
                                ? 'Aguardando Avaliação Médica'
                                : referralStatus[checklist._id] === 'Continuidade'
                                ? 'Continuidade'
                                : referralStatus[checklist._id]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Photo if available */}
                    {checklist.scarPhoto && (
                      <div className="bg-white border-b border-secondary/20 p-4">
                        <ResponsiveImageDisplay
                          src={checklist.scarPhoto}
                          alt="Foto da cicatriz"
                        />
                      </div>
                    )}

                    {/* Checklist data */}
                    <div className="p-6 bg-white">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1">Dor</p>
                          <p className="font-paragraph text-base font-semibold text-foreground">
                            {checklist.painLevel}/10
                          </p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1">Temperatura</p>
                          <p className="font-paragraph text-base font-semibold text-foreground">
                            {checklist.bodyTemperature}°C
                          </p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1">Febre</p>
                          <p className="font-paragraph text-base font-semibold text-foreground">
                            {checklist.hasFever ? 'Sim' : 'Não'}
                          </p>
                        </div>
                        <div>
                          <p className="font-paragraph text-xs text-foreground/60 mb-1">Medicação</p>
                          <p className="font-paragraph text-base font-semibold text-foreground">
                            {checklist.takingMedicationCorrectly ? 'Correta' : 'Incorreta'}
                          </p>
                        </div>
                      </div>

                      {/* Symptoms */}
                      <div className="pt-4 border-t border-secondary/20">
                        <p className="font-paragraph text-xs text-foreground/60 mb-3 font-semibold">SINTOMAS RELATADOS</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {checklist.scarRedness && (
                            <span className="text-xs bg-critical/10 text-critical px-2 py-1 rounded">Vermelhidão</span>
                          )}
                          {checklist.hasSecretion && (
                            <span className="text-xs bg-critical/10 text-critical px-2 py-1 rounded">Secreção</span>
                          )}
                          {checklist.hasBadOdor && (
                            <span className="text-xs bg-critical/10 text-critical px-2 py-1 rounded">Mau cheiro</span>
                          )}
                          {checklist.shortnessOfBreath && (
                            <span className="text-xs bg-attention/10 text-attention-foreground px-2 py-1 rounded">Falta de ar</span>
                          )}
                          {checklist.dizziness && (
                            <span className="text-xs bg-attention/10 text-attention-foreground px-2 py-1 rounded">Tontura</span>
                          )}
                          {checklist.increasingPain && (
                            <span className="text-xs bg-attention/10 text-attention-foreground px-2 py-1 rounded">Dor crescente</span>
                          )}
                          {!checklist.scarRedness && !checklist.hasSecretion && !checklist.hasBadOdor && 
                           !checklist.shortnessOfBreath && !checklist.dizziness && !checklist.increasingPain && (
                            <span className="text-xs bg-stable/10 text-stable px-2 py-1 rounded">Sem sintomas</span>
                          )}
                        </div>
                      </div>

                      {/* Medications Section */}
                      {checklist.takingMedicationCorrectly && medicationsByChecklist[checklist._id]?.length > 0 && (
                        <div className="pt-4 border-t border-secondary/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Pill className="w-4 h-4 text-primary" />
                            <p className="font-paragraph text-xs text-foreground/60 font-semibold">MEDICAMENTOS INFORMADOS</p>
                          </div>
                          <div className="space-y-2">
                            {medicationsByChecklist[checklist._id].map((med) => (
                              <div key={med._id} className="text-xs bg-background rounded px-2 py-1 border border-secondary/10">
                                <p className="font-paragraph font-semibold text-foreground">
                                  {med.medicationName} — {med.timeTaken} — {med.doseQuantity}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Medication Not Taken Reason */}
                      {!checklist.takingMedicationCorrectly && checklist.reasonNotTakingMedication && (
                        <div className="pt-4 border-t border-secondary/20">
                          <p className="font-paragraph text-xs text-foreground/60 font-semibold mb-2">MOTIVO - NÃO TOMOU MEDICAÇÃO</p>
                          <p className="text-xs bg-attention/10 text-foreground px-2 py-1 rounded border border-attention/20">
                            {checklist.reasonNotTakingMedication}
                          </p>
                        </div>
                      )}

                      {/* Photo status */}
                      <div className="pt-4 border-t border-secondary/20 flex items-center gap-2">
                        {checklist.scarPhoto ? (
                          <>
                            <ImageIcon className="w-4 h-4 text-stable" />
                            <p className="font-paragraph text-xs text-stable font-semibold">Foto enviada</p>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 text-foreground/40" />
                            <p className="font-paragraph text-xs text-foreground/60">Sem foto</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl p-16 border border-secondary/20 text-center">
            <Calendar className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <p className="font-paragraph text-lg text-foreground/60 mb-4">
              Nenhum checklist preenchido ainda
            </p>
            <Link to="/patient-checklist">
              <Button className="bg-primary text-primary-foreground hover:opacity-90 font-paragraph font-semibold">
                Preencher primeiro checklist
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
