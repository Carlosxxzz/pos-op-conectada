import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Settings, Lock, Monitor } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { BaseCrudService } from '@/integrations';
import type { Profissionais, Pacientes } from '@/entities';

interface SettingsTabProps {
  userType: 'admin' | 'doctor' | 'nurse' | 'patient';
  userId: string;
  onSettingsSaved?: () => void;
}

interface AdminSettings {
  notifications: {
    systemNotifications: boolean;
    newRegistrations: boolean;
    newProfessionals: boolean;
    criticalAlerts: boolean;
    criticalPatients: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  system: {
    darkMode: boolean;
    language: string;
    autoUpdate: boolean;
    notificationSounds: boolean;
    confirmDelete: boolean;
    showAnimations: boolean;
  };
  security: {
    endAllSessions: boolean;
    connectedDevices: boolean;
    twoFactorAuth: boolean;
    accessHistory: boolean;
  };
}

interface DoctorSettings {
  notifications: {
    newPatients: boolean;
    criticalPatients: boolean;
    patientResponses: boolean;
    checklistsChanged: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  care: {
    sortByPriority: boolean;
    recentFirst: boolean;
    activeOnly: boolean;
    autoUpdate: boolean;
  };
  system: {
    darkMode: boolean;
    language: string;
    sounds: boolean;
    autoUpdate: boolean;
  };
  security: {
    endSessions: boolean;
    connectedDevices: boolean;
    accessHistory: boolean;
  };
}

interface NurseSettings {
  notifications: {
    newChecklists: boolean;
    waitingEvaluation: boolean;
    criticalPatients: boolean;
    doctorResponded: boolean;
    followUpReminders: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
  };
  care: {
    autoUpdate: boolean;
    priorityFirst: boolean;
    followUpPatients: boolean;
    activeOnly: boolean;
  };
  system: {
    darkMode: boolean;
    language: string;
    sounds: boolean;
    autoUpdate: boolean;
  };
  security: {
    endSessions: boolean;
    connectedDevices: boolean;
    accessHistory: boolean;
  };
}

interface PatientSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  medicationReminders: boolean;
  checklistReminders: boolean;
  appointmentReminders: boolean;
}

type SettingsType = AdminSettings | DoctorSettings | NurseSettings | PatientSettings;

export default function SettingsTab({ userType, userId, onSettingsSaved }: SettingsTabProps) {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [userId, userType]);

  const loadSettings = async () => {
    try {
      let userData;
      if (userType === 'patient') {
        userData = await BaseCrudService.getById<Pacientes>('pacientes', userId);
      } else {
        userData = await BaseCrudService.getById<Profissionais>('profissionais', userId);
      }

      const settingsData = userData?.settings as SettingsType | undefined;
      
      if (settingsData) {
        setSettings(settingsData);
      } else {
        setSettings(getDefaultSettings(userType));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(getDefaultSettings(userType));
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultSettings = (type: string): SettingsType => {
    switch (type) {
      case 'admin':
        return {
          notifications: {
            systemNotifications: true,
            newRegistrations: true,
            newProfessionals: true,
            criticalAlerts: true,
            criticalPatients: true,
            emailNotifications: true,
            pushNotifications: true,
          },
          system: {
            darkMode: false,
            language: 'pt-BR',
            autoUpdate: true,
            notificationSounds: true,
            confirmDelete: true,
            showAnimations: true,
          },
          security: {
            endAllSessions: false,
            connectedDevices: false,
            twoFactorAuth: false,
            accessHistory: false,
          },
        } as AdminSettings;
      case 'doctor':
        return {
          notifications: {
            newPatients: true,
            criticalPatients: true,
            patientResponses: true,
            checklistsChanged: true,
            emailNotifications: true,
            pushNotifications: true,
          },
          care: {
            sortByPriority: true,
            recentFirst: false,
            activeOnly: true,
            autoUpdate: true,
          },
          system: {
            darkMode: false,
            language: 'pt-BR',
            sounds: true,
            autoUpdate: true,
          },
          security: {
            endSessions: false,
            connectedDevices: false,
            accessHistory: false,
          },
        } as DoctorSettings;
      case 'nurse':
        return {
          notifications: {
            newChecklists: true,
            waitingEvaluation: true,
            criticalPatients: true,
            doctorResponded: true,
            followUpReminders: true,
            pushNotifications: true,
            emailNotifications: true,
          },
          care: {
            autoUpdate: true,
            priorityFirst: true,
            followUpPatients: true,
            activeOnly: true,
          },
          system: {
            darkMode: false,
            language: 'pt-BR',
            sounds: true,
            autoUpdate: true,
          },
          security: {
            endSessions: false,
            connectedDevices: false,
            accessHistory: false,
          },
        } as NurseSettings;
      default:
        return {
          emailNotifications: true,
          pushNotifications: true,
          medicationReminders: true,
          checklistReminders: true,
          appointmentReminders: true,
        } as PatientSettings;
    }
  };

  const saveSettings = async (newSettings: SettingsType) => {
    try {
      if (userType === 'patient') {
        await BaseCrudService.update<Pacientes>('pacientes', {
          _id: userId,
          settings: newSettings,
        });
      } else {
        await BaseCrudService.update<Profissionais>('profissionais', {
          _id: userId,
          settings: newSettings,
        });
      }
      setSettings(newSettings);
      onSettingsSaved?.();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleToggle = (path: string[], value: boolean) => {
    if (!settings) return;

    const newSettings = JSON.parse(JSON.stringify(settings));
    let current = newSettings;
    
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    
    current[path[path.length - 1]] = value;
    saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!settings) return null;

  return (
    <div className="space-y-8">
      {/* Admin Settings */}
      {userType === 'admin' && (
        <>
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Notificações</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'systemNotifications', label: 'Receber notificações do sistema', desc: 'Atualizações gerais do sistema' },
                { key: 'newRegistrations', label: 'Receber novos cadastros', desc: 'Notificações de novos usuários' },
                { key: 'newProfessionals', label: 'Receber notificações de novos profissionais', desc: 'Quando novos profissionais se registram' },
                { key: 'criticalAlerts', label: 'Receber alertas críticos', desc: 'Alertas de segurança e sistema' },
                { key: 'criticalPatients', label: 'Receber notificações de pacientes críticos', desc: 'Pacientes em risco' },
                { key: 'emailNotifications', label: 'Receber notificações por e-mail', desc: 'Enviar notificações por e-mail' },
                { key: 'pushNotifications', label: 'Receber notificações Push', desc: 'Notificações no navegador' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as AdminSettings).notifications[item.key as keyof AdminSettings['notifications']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.notifications[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Sistema</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'darkMode', label: 'Tema Claro / Escuro', desc: 'Ativar modo escuro' },
                { key: 'autoUpdate', label: 'Atualização automática', desc: 'Atualizar automaticamente' },
                { key: 'notificationSounds', label: 'Sons de notificações', desc: 'Reproduzir sons' },
                { key: 'confirmDelete', label: 'Confirmação antes de excluir registros', desc: 'Pedir confirmação' },
                { key: 'showAnimations', label: 'Mostrar animações', desc: 'Ativar animações da interface' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as AdminSettings).system[item.key as keyof AdminSettings['system']] === true || (settings as AdminSettings).system[item.key as keyof AdminSettings['system']] === 'pt-BR'}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.system[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Segurança</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'endAllSessions', label: 'Encerrar todas as sessões', desc: 'Fazer logout em todos os dispositivos' },
                { key: 'connectedDevices', label: 'Dispositivos conectados', desc: 'Gerenciar dispositivos' },
                { key: 'twoFactorAuth', label: 'Autenticação em duas etapas', desc: 'Quando disponível' },
                { key: 'accessHistory', label: 'Histórico de acessos', desc: 'Ver histórico de login' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as AdminSettings).security[item.key as keyof AdminSettings['security']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.security[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Doctor Settings */}
      {userType === 'doctor' && (
        <>
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Notificações</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'newPatients', label: 'Novos pacientes encaminhados', desc: 'Quando novos pacientes são encaminhados' },
                { key: 'criticalPatients', label: 'Pacientes críticos', desc: 'Alertas de pacientes em risco' },
                { key: 'patientResponses', label: 'Novas respostas dos pacientes', desc: 'Respostas a questionários' },
                { key: 'checklistsChanged', label: 'Checklists alterados', desc: 'Quando checklists são atualizados' },
                { key: 'emailNotifications', label: 'Notificações por e-mail', desc: 'Enviar notificações por e-mail' },
                { key: 'pushNotifications', label: 'Push', desc: 'Notificações no navegador' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as DoctorSettings).notifications[item.key as keyof DoctorSettings['notifications']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.notifications[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Care Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Atendimento</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'sortByPriority', label: 'Ordenar pacientes por prioridade', desc: 'Mostrar pacientes prioritários primeiro' },
                { key: 'recentFirst', label: 'Mostrar pacientes recentes primeiro', desc: 'Ordenar por data de atualização' },
                { key: 'activeOnly', label: 'Mostrar somente pacientes ativos', desc: 'Filtrar pacientes inativos' },
                { key: 'autoUpdate', label: 'Atualização automática da lista', desc: 'Atualizar lista em tempo real' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as DoctorSettings).care[item.key as keyof DoctorSettings['care']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.care[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Sistema</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'darkMode', label: 'Tema Claro / Escuro', desc: 'Ativar modo escuro' },
                { key: 'sounds', label: 'Sons', desc: 'Reproduzir sons de notificação' },
                { key: 'autoUpdate', label: 'Atualização automática', desc: 'Atualizar automaticamente' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as DoctorSettings).system[item.key as keyof DoctorSettings['system']] === true || (settings as DoctorSettings).system[item.key as keyof DoctorSettings['system']] === 'pt-BR'}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.system[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Segurança</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'endSessions', label: 'Encerrar sessões', desc: 'Fazer logout em todos os dispositivos' },
                { key: 'connectedDevices', label: 'Dispositivos conectados', desc: 'Gerenciar dispositivos' },
                { key: 'accessHistory', label: 'Histórico de acessos', desc: 'Ver histórico de login' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as DoctorSettings).security[item.key as keyof DoctorSettings['security']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.security[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Nurse Settings */}
      {userType === 'nurse' && (
        <>
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Notificações</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'newChecklists', label: 'Novos checklists recebidos', desc: 'Quando novos checklists chegam' },
                { key: 'waitingEvaluation', label: 'Pacientes aguardando avaliação', desc: 'Pacientes pendentes' },
                { key: 'criticalPatients', label: 'Pacientes críticos', desc: 'Alertas de pacientes em risco' },
                { key: 'doctorResponded', label: 'Médico respondeu avaliação', desc: 'Respostas do médico' },
                { key: 'followUpReminders', label: 'Lembretes de acompanhamento', desc: 'Lembretes de follow-up' },
                { key: 'pushNotifications', label: 'Push', desc: 'Notificações no navegador' },
                { key: 'emailNotifications', label: 'E-mail', desc: 'Notificações por e-mail' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as NurseSettings).notifications[item.key as keyof NurseSettings['notifications']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.notifications[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Care Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Atendimento</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'autoUpdate', label: 'Atualizar automaticamente', desc: 'Atualizar lista em tempo real' },
                { key: 'priorityFirst', label: 'Mostrar pacientes prioritários primeiro', desc: 'Ordenar por prioridade' },
                { key: 'followUpPatients', label: 'Mostrar pacientes em acompanhamento', desc: 'Filtrar por status' },
                { key: 'activeOnly', label: 'Mostrar apenas pacientes ativos', desc: 'Filtrar pacientes inativos' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as NurseSettings).care[item.key as keyof NurseSettings['care']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.care[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* System Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Monitor className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Sistema</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'darkMode', label: 'Tema Claro / Escuro', desc: 'Ativar modo escuro' },
                { key: 'sounds', label: 'Sons', desc: 'Reproduzir sons de notificação' },
                { key: 'autoUpdate', label: 'Atualização automática', desc: 'Atualizar automaticamente' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as NurseSettings).system[item.key as keyof NurseSettings['system']] === true || (settings as NurseSettings).system[item.key as keyof NurseSettings['system']] === 'pt-BR'}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.system[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>

          {/* Security Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Segurança</h3>
            </div>

            <div className="space-y-4">
              {[
                { key: 'endSessions', label: 'Encerrar sessões', desc: 'Fazer logout em todos os dispositivos' },
                { key: 'connectedDevices', label: 'Dispositivos conectados', desc: 'Gerenciar dispositivos' },
                { key: 'accessHistory', label: 'Histórico de acessos', desc: 'Ver histórico de login' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div>
                    <p className="font-paragraph font-semibold text-foreground">{item.label}</p>
                    <p className="font-paragraph text-sm text-foreground/60">{item.desc}</p>
                  </div>
                  <Switch
                    checked={(settings as NurseSettings).security[item.key as keyof NurseSettings['security']]}
                    onCheckedChange={(checked) => {
                      const newSettings = JSON.parse(JSON.stringify(settings));
                      newSettings.security[item.key] = checked;
                      saveSettings(newSettings);
                    }}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}

      {/* Patient Settings */}
      {userType === 'patient' && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-primary" />
              <h3 className="font-heading text-2xl font-bold text-foreground">Notificações</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div>
                  <p className="font-paragraph font-semibold text-foreground">Notificações por E-mail</p>
                  <p className="font-paragraph text-sm text-foreground/60">Receba atualizações por e-mail</p>
                </div>
                <Switch
                  checked={(settings as PatientSettings).emailNotifications}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...settings as PatientSettings, emailNotifications: checked };
                    saveSettings(newSettings);
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div>
                  <p className="font-paragraph font-semibold text-foreground">Notificações Push</p>
                  <p className="font-paragraph text-sm text-foreground/60">Receba notificações no navegador</p>
                </div>
                <Switch
                  checked={(settings as PatientSettings).pushNotifications}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...settings as PatientSettings, pushNotifications: checked };
                    saveSettings(newSettings);
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div>
                  <p className="font-paragraph font-semibold text-foreground">Lembretes de Medicamentos</p>
                  <p className="font-paragraph text-sm text-foreground/60">Receba lembretes para tomar medicamentos</p>
                </div>
                <Switch
                  checked={(settings as PatientSettings).medicationReminders}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...settings as PatientSettings, medicationReminders: checked };
                    saveSettings(newSettings);
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div>
                  <p className="font-paragraph font-semibold text-foreground">Lembretes de Checklists</p>
                  <p className="font-paragraph text-sm text-foreground/60">Receba lembretes para preencher checklists</p>
                </div>
                <Switch
                  checked={(settings as PatientSettings).checklistReminders}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...settings as PatientSettings, checklistReminders: checked };
                    saveSettings(newSettings);
                  }}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-lg">
                <div>
                  <p className="font-paragraph font-semibold text-foreground">Lembretes de Consultas</p>
                  <p className="font-paragraph text-sm text-foreground/60">Receba lembretes de consultas agendadas</p>
                </div>
                <Switch
                  checked={(settings as PatientSettings).appointmentReminders}
                  onCheckedChange={(checked) => {
                    const newSettings = { ...settings as PatientSettings, appointmentReminders: checked };
                    saveSettings(newSettings);
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Privacy and Terms */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 border border-secondary/20"
          >
            <h3 className="font-heading text-2xl font-bold text-foreground mb-6">Políticas</h3>
            <div className="space-y-3">
              <a
                href="#"
                className="block p-4 bg-background rounded-lg hover:bg-background/80 transition-colors"
              >
                <p className="font-paragraph font-semibold text-primary">Política de Privacidade</p>
              </a>
              <a
                href="#"
                className="block p-4 bg-background rounded-lg hover:bg-background/80 transition-colors"
              >
                <p className="font-paragraph font-semibold text-primary">Termos de Uso</p>
              </a>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
