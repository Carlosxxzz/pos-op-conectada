# Implementação do Fluxo Completo de Alta Médica - AcompanhaMed

## Visão Geral

Este documento descreve a implementação completa do fluxo de Alta Médica (ALTA_MEDICA) no sistema AcompanhaMed. O fluxo permite que médicos concedam alta a pacientes, interrompendo automaticamente novos checklists enquanto mantém todo o histórico disponível para consulta.

## Mudanças Realizadas

### 1. Banco de Dados - Novos Campos na Tabela Pacientes

Foram adicionados 4 novos campos à coleção `pacientes`:

- **dischargeStatus** (TEXT): Armazena o status de alta (ex: "ALTA_MEDICA")
- **dischargeDate** (DATETIME): Data e hora em que a alta foi concedida
- **dischargeDoctor** (TEXT): Nome do médico responsável pela alta
- **dischargeObservations** (TEXT): Observações/motivo da alta

### 2. Validação de Checklist - Função `isPatientDischarged()`

**Arquivo**: `/src/lib/checklistValidator.ts`

Nova função que verifica se um paciente foi dado alta:

```typescript
export const isPatientDischarged = async (patientId: string): Promise<boolean> => {
  try {
    const patient = await BaseCrudService.getById<Pacientes>('pacientes', patientId);
    if (!patient) return false;
    
    return patient.dischargeStatus === 'ALTA_MEDICA';
  } catch (error) {
    logger.error('checklistValidator', 'isPatientDischarged', 'Error checking discharge status', error);
    return false;
  }
};
```

A função `validateChecklistSubmission()` foi atualizada para verificar se o paciente foi dado alta antes de permitir novos checklists.

### 3. Página de Avaliação Médica - Concessão de Alta

**Arquivo**: `/src/components/pages/MedicalEvaluationPage.tsx`

#### Mudanças:

1. **Novo campo no formulário**: `dischargeObservations` para capturar observações específicas da alta

2. **Campo condicional**: O campo "Observações da Alta Médica" aparece apenas quando o médico seleciona "Não (Alta)" na opção de acompanhamento

3. **Atualização automática do paciente**: Quando a alta é concedida, o sistema atualiza automaticamente:
   - `dischargeStatus = 'ALTA_MEDICA'`
   - `dischargeDate = data/hora atual`
   - `dischargeDoctor = nome do médico`
   - `dischargeObservations = observações fornecidas`

```typescript
// Se concedendo alta
if (!formData.needsFollowUp) {
  patientUpdateData.dischargeStatus = 'ALTA_MEDICA';
  patientUpdateData.dischargeDate = now;
  patientUpdateData.dischargeDoctor = professional.fullName || professional.email || '';
  patientUpdateData.dischargeObservations = formData.dischargeObservations || formData.medicalObservations;
}
```

### 4. Página de Checklist do Paciente - Bloqueio de Novos Checklists

**Arquivo**: `/src/components/pages/PatientChecklistPage.tsx`

#### Mudanças:

1. **Importação da função**: `isPatientDischarged` foi adicionada às importações

2. **Verificação de alta**: Antes de validar se o checklist pode ser enviado, o sistema verifica se o paciente foi dado alta:

```typescript
// Check if patient has been discharged
const discharged = await isPatientDischarged(patientId);
if (discharged) {
  setChecklistBlocked(true);
  setBlockReason('Seu acompanhamento foi concluído e você recebeu alta médica. Não há novos checklists disponíveis. Você ainda pode consultar seu histórico de avaliações e checklists realizados.');
  return;
}
```

3. **Mensagem profissional**: Quando o paciente tenta acessar o checklist após receber alta, vê uma mensagem clara e profissional informando que:
   - Seu acompanhamento foi concluído
   - Recebeu alta médica
   - Não há novos checklists disponíveis
   - Pode consultar seu histórico

### 5. Componente de Informação de Alta - DischargeInfoCard

**Arquivo**: `/src/components/DischargeInfoCard.tsx`

Novo componente reutilizável que exibe informações da alta:

- Data e hora da alta
- Médico responsável
- Observações da alta
- Mensagem informando que o histórico permanece disponível

Pode ser usado em:
- Página de histórico do paciente
- Página de avaliações
- Dashboard do paciente

### 6. Página de Histórico de Avaliação Médica - Visualização de Alta

**Arquivo**: `/src/components/pages/MedicalEvaluationHistoryPage.tsx`

#### Mudanças:

1. **Importação do componente**: `DischargeInfoCard` foi adicionado

2. **Exibição diferenciada**: Quando o status da avaliação é "Alta", as observações são exibidas em um estilo diferenciado (com fundo verde/estável)

3. **Indicador visual**: Badge de status mostra claramente "ALTA" quando aplicável

## Fluxo Completo de Alta Médica

### 1. Médico Realiza Avaliação

1. Médico acessa a página de avaliação do paciente
2. Preenche todos os campos da avaliação
3. Na seção "Necessita novo acompanhamento?", seleciona "Não (Alta)"
4. Campo "Observações da Alta Médica" aparece
5. Médico preenche observações (opcional)
6. Clica em "Finalizar Avaliação Médica"

### 2. Sistema Processa a Alta

1. Cria registro de avaliação médica com status "Alta"
2. Atualiza checklist com status "Alta"
3. **Atualiza paciente com dados de alta**:
   - `dischargeStatus = 'ALTA_MEDICA'`
   - `dischargeDate = agora`
   - `dischargeDoctor = nome do médico`
   - `dischargeObservations = observações`
4. Cria notificação para o paciente informando a alta

### 3. Paciente Recebe Alta

1. Paciente recebe notificação de que foi concedida alta
2. Ao tentar acessar novo checklist, vê mensagem de conclusão
3. Pode acessar histórico completo de avaliações e checklists
4. Não recebe mais checklists diários

### 4. Profissionais Visualizam a Alta

1. **Médicos**: Veem o status "ALTA" na avaliação médica
2. **Enfermeiros**: Veem que o paciente foi dado alta no histórico
3. **Administradores**: Veem o status de alta no perfil do paciente

## Regras Implementadas

✅ **Após receber Alta:**
- ✓ Não criar novos checklists
- ✓ Não permitir envio manual de checklist
- ✓ Não permitir reabrir acompanhamento automaticamente
- ✓ Não remover nenhum histórico
- ✓ Não apagar avaliações
- ✓ Não apagar fotos enviadas pelo paciente
- ✓ Não apagar registros existentes
- ✓ Todo o histórico permanece disponível apenas para consulta

✅ **Controle de Permissões:**
- ✓ Somente Médico pode conceder Alta
- ✓ Nem Enfermeiro nem Administrador podem alterar esse status

✅ **Compatibilidade:**
- ✓ Pacientes sem Alta continuam recebendo um checklist por dia
- ✓ A mudança afeta exclusivamente pacientes com status ALTA_MEDICA
- ✓ Nenhuma funcionalidade existente foi alterada

## Testes Obrigatórios

### Teste 1: Criar Paciente e Enviar Checklists
- [ ] Criar novo paciente
- [ ] Enviar checklists normalmente (pelo menos 2-3 dias)
- [ ] Verificar que checklists são liberados diariamente às 05:00

### Teste 2: Avaliação de Enfermagem
- [ ] Enfermeiro avalia o checklist
- [ ] Encaminha para médico
- [ ] Verificar que referral foi criado

### Teste 3: Avaliação Médica e Concessão de Alta
- [ ] Médico acessa avaliação do paciente
- [ ] Preenche todos os campos
- [ ] Seleciona "Não (Alta)" em "Necessita novo acompanhamento?"
- [ ] Campo "Observações da Alta Médica" aparece
- [ ] Preenche observações
- [ ] Clica "Finalizar Avaliação Médica"
- [ ] Verificar que avaliação foi criada com status "Alta"

### Teste 4: Bloqueio de Novos Checklists
- [ ] Paciente tenta acessar novo checklist
- [ ] Vê mensagem: "Seu acompanhamento foi concluído e você recebeu alta médica..."
- [ ] Botão de responder checklist não aparece
- [ ] Próximo dia às 05:00, nenhum novo checklist é liberado

### Teste 5: Histórico Permanece Disponível
- [ ] Paciente acessa "Histórico"
- [ ] Vê todos os checklists anteriores
- [ ] Vê todas as avaliações de enfermagem
- [ ] Vê todas as avaliações médicas
- [ ] Última avaliação mostra claramente "ALTA"

### Teste 6: Visualização por Profissionais
- [ ] Médico vê status "ALTA" na avaliação
- [ ] Enfermeiro vê que paciente foi dado alta
- [ ] Administrador vê status de alta no perfil do paciente

### Teste 7: Integridade de Dados
- [ ] Nenhum histórico foi perdido
- [ ] Nenhuma avaliação foi apagada
- [ ] Nenhuma foto foi removida
- [ ] Todos os registros permanecem intactos

## Estrutura de Dados

### Paciente com Alta Médica

```json
{
  "_id": "patient-123",
  "fullName": "João Silva",
  "followUpStatus": "Alta",
  "dischargeStatus": "ALTA_MEDICA",
  "dischargeDate": "2026-08-02T14:30:00Z",
  "dischargeDoctor": "Dr. Carlos Santos",
  "dischargeObservations": "Paciente apresenta boa recuperação. Cicatriz cicatrizada. Sem sinais de infecção. Recomendado retorno em 30 dias se necessário.",
  "lastMedicalEvaluationId": "eval-456"
}
```

### Avaliação Médica com Alta

```json
{
  "_id": "eval-456",
  "patientId": "patient-123",
  "doctorName": "Dr. Carlos Santos",
  "status": "Alta",
  "followUpStatus": "Alta",
  "needsFollowUp": false,
  "evaluationDate": "2026-08-02T14:30:00Z",
  "medicalConduct": "Alta médica concedida",
  "medicalObservations": "Paciente apresenta boa recuperação...",
  "clinicalCondition": "stable"
}
```

## Notas Importantes

1. **Irreversibilidade**: Uma vez que um paciente recebe alta, o status não pode ser revertido automaticamente. Qualquer reabertura de acompanhamento deve ser feita manualmente por um administrador.

2. **Notificações**: O paciente recebe notificação quando a alta é concedida, informando que seu acompanhamento foi concluído.

3. **Histórico**: Todo o histórico do paciente permanece acessível para fins de consulta e auditoria.

4. **Segurança**: Apenas médicos podem conceder alta. Enfermeiros e administradores podem visualizar mas não podem alterar o status de alta.

5. **Compatibilidade**: A implementação não afeta pacientes que ainda estão em acompanhamento ativo.

## Suporte e Manutenção

Para questões relacionadas à implementação de alta médica:

1. Verificar logs em `/src/lib/logger.ts`
2. Consultar validações em `/src/lib/checklistValidator.ts`
3. Revisar fluxo de avaliação em `/src/components/pages/MedicalEvaluationPage.tsx`
4. Verificar bloqueio de checklist em `/src/components/pages/PatientChecklistPage.tsx`
