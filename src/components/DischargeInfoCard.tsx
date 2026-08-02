import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DischargeInfoCardProps {
  dischargeDate?: string | Date;
  dischargeDoctor?: string;
  dischargeObservations?: string;
}

export default function DischargeInfoCard({
  dischargeDate,
  dischargeDoctor,
  dischargeObservations,
}: DischargeInfoCardProps) {
  if (!dischargeDate) return null;

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-stable/10 to-stable/5 rounded-2xl p-8 border-2 border-stable/30"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-stable/20 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-stable" />
        </div>
        <div>
          <h3 className="font-heading text-2xl font-bold text-foreground">
            Alta Médica Concedida
          </h3>
          <p className="font-paragraph text-sm text-foreground/60 mt-1">
            Seu acompanhamento foi concluído com sucesso
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <p className="font-paragraph text-sm text-foreground/60 mb-1">Data da Alta</p>
          <p className="font-paragraph text-base font-semibold text-foreground">
            {formatDate(dischargeDate)}
          </p>
        </div>

        {dischargeDoctor && (
          <div>
            <p className="font-paragraph text-sm text-foreground/60 mb-1">Médico Responsável</p>
            <p className="font-paragraph text-base font-semibold text-foreground">
              {dischargeDoctor}
            </p>
          </div>
        )}

        {dischargeObservations && (
          <div>
            <p className="font-paragraph text-sm text-foreground/60 mb-2">Observações da Alta</p>
            <div className="bg-white/50 rounded-lg p-4 border-l-4 border-stable">
              <p className="font-paragraph text-sm text-foreground">
                {dischargeObservations}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-stable/10 rounded-lg border border-stable/20">
        <p className="font-paragraph text-sm text-foreground/70">
          Você ainda pode consultar todo o seu histórico de avaliações e checklists realizados durante o acompanhamento.
        </p>
      </div>
    </motion.div>
  );
}
