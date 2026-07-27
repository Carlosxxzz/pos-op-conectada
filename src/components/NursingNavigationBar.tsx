import { BarChart3, AlertCircle, Stethoscope, CheckCircle, FileText } from 'lucide-react';

interface NursingNavigationBarProps {
  activeTab: 'dashboard' | 'prioritarios' | 'encaminhados' | 'avaliados-medico' | 'historico';
  onTabChange: (tab: 'dashboard' | 'prioritarios' | 'encaminhados' | 'avaliados-medico' | 'historico') => void;
}

export default function NursingNavigationBar({ activeTab, onTabChange }: NursingNavigationBarProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'prioritarios', label: 'Prioritários', icon: AlertCircle },
    { id: 'encaminhados', label: 'Encaminhados ao Médico', icon: Stethoscope },
    { id: 'avaliados-medico', label: 'Avaliados pelo Médico', icon: CheckCircle },
    { id: 'historico', label: 'Histórico', icon: FileText },
  ] as const;

  return (
    <div className="bg-white border-b border-secondary/30 sticky top-0 z-30">
      <div className="max-w-[120rem] mx-auto px-8">
        {/* Horizontal scrolling container for mobile */}
        <div className="overflow-x-auto -mx-8 px-8">
          <div className="flex gap-3 py-4 min-w-min">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-paragraph text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white border-secondary/20 text-foreground hover:border-primary/50 hover:bg-background'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
