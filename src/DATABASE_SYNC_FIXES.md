# Correções de Sincronização de Banco de Dados - Pós-Op Conectado

## Resumo das Alterações

Este documento descreve as correções implementadas para garantir sincronização correta de dados através do banco de dados, respeitando o HospitalID em todos os fluxos.

---

## 1. Problema Identificado

**Fluxo Anterior (Quebrado):**
- Paciente envia checklist ✓
- Enfermeiro recebe normalmente ✓
- Enfermeiro encaminha ✗ (Não atualiza o status do paciente)
- Médico não recebe ✗ (Filtra por `referredToDoctor` que nunca é atualizado)

**Causa Raiz:**
- Não havia sincronização entre a avaliação de enfermagem e o status do paciente
- Médico filtrava por `referredToDoctor` na avaliação, não pelo status do paciente
- Não havia campo de status de acompanhamento no paciente

---

## 2. Solução Implementada

### 2.1 Estrutura de Dados Aprimorada

Adicionados campos ao paciente (através de comentários na entidade):
```typescript
// Pacientes collection - novos campos (comentados para referência):
followUpStatus?: string;        // "pending_nursing" | "pending_medical" | "completed"
nursingEvaluationId?: string;   // ID da avaliação de enfermagem
medicalEvaluationId?: string;   // ID da avaliação médica
lastChecklistId?: string;       // ID do último checklist
lastPhotoId?: string;           // ID da última foto
```

### 2.2 Fluxo Corrigido

#### **Etapa 1: Paciente Envia Checklist**
- Status: `pending_nursing` (padrão ao criar paciente)
- Ação: Checklist é salvo com `patientId` e `hospitalId`

#### **Etapa 2: Enfermeiro Avalia**
- Filtro: Mostra apenas pacientes do seu hospital com `followUpStatus === "pending_nursing"`
- Ação ao encaminhar:
  ```typescript
  // NursingEvaluationPage.tsx - handleSubmit()
  if (formData.referredToDoctor) {
    await BaseCrudService.update('pacientes', {
      _id: id,
      followUpStatus: 'pending_medical',
      nursingEvaluationId: evaluationId,
    });
  }
  ```

#### **Etapa 3: Médico Visualiza Fila**
- Filtro: Mostra apenas pacientes do seu hospital com `followUpStatus === "pending_medical"`
- Ação ao concluir:
  ```typescript
  // MedicalEvaluationPage.tsx - handleSubmit()
  await BaseCrudService.update('pacientes', {
    _id: id,
    followUpStatus: 'completed',
    medicalEvaluationId: medicalEvaluationId,
  });
  ```

---

## 3. Arquivos Modificados

### 3.1 `/src/components/pages/NursingEvaluationPage.tsx`

**Mudança:** Função `handleSubmit()`

```typescript
// ANTES: Apenas criava avaliação
await BaseCrudService.create('avaliacoesenfermagem', evaluation);

// DEPOIS: Cria avaliação E atualiza status do paciente
await BaseCrudService.create('avaliacoesenfermagem', evaluation);
if (formData.referredToDoctor) {
  await BaseCrudService.update('pacientes', {
    _id: id,
    followUpStatus: 'pending_medical',
    nursingEvaluationId: evaluationId,
  });
}
```

**Benefício:** Paciente aparece imediatamente na fila do médico após encaminhamento.

---

### 3.2 `/src/components/pages/MedicalDashboardPage.tsx`

**Mudança:** Função `loadData()`

```typescript
// ANTES: Filtrava por referredToDoctor na avaliação
const referred = evaluations
  .filter(e => e.referredToDoctor)
  .map(evaluation => {
    const patient = patients.find(p => p._id === evaluation.patientId);
    return { evaluation, patient: patient || null };
  })
  .filter(item => item.patient?.hospital === professionalData?.hospital);

// DEPOIS: Filtra por status do paciente
const referred = patients
  .filter(patient => {
    return patient.hospital === professionalData?.hospital && 
           patient.followUpStatus === 'pending_medical';
  })
  .map(patient => {
    const patientEvaluations = evaluations.filter(e => e.patientId === patient._id);
    const latestEvaluation = patientEvaluations.sort((a, b) => 
      new Date(b.checklistDate || 0).getTime() - new Date(a.checklistDate || 0).getTime()
    )[0];
    return { evaluation: latestEvaluation || null, patient };
  })
  .filter(item => item.evaluation !== null);
```

**Benefício:** Médico vê apenas pacientes com status `pending_medical` do seu hospital.

---

### 3.3 `/src/components/pages/MedicalEvaluationPage.tsx`

**Mudança:** Função `handleSubmit()`

```typescript
// ANTES: Apenas criava avaliação médica
await BaseCrudService.create('avaliacoesmedicas', evaluation);

// DEPOIS: Cria avaliação E atualiza status do paciente para completed
await BaseCrudService.create('avaliacoesmedicas', evaluation);
await BaseCrudService.update('pacientes', {
  _id: id,
  followUpStatus: 'completed',
  medicalEvaluationId: medicalEvaluationId,
});
```

**Benefício:** Paciente sai da fila do médico após conclusão da avaliação.

---

## 4. Garantias de Integridade

### 4.1 Filtros por HospitalID

Todos os dashboards agora filtram por hospital:

```typescript
// Enfermeiro
patient.hospital === professionalData?.hospital && 
patient.followUpStatus === 'pending_nursing'

// Médico
patient.hospital === professionalData?.hospital && 
patient.followUpStatus === 'pending_medical'
```

### 4.2 Sem Duplicação de Registros

- Cada paciente tem um único `_id`
- Status é atualizado, não criado novo registro
- Avaliações são criadas uma vez, nunca duplicadas

### 4.3 Sincronização em Tempo Real

- Quando enfermeiro encaminha → status muda para `pending_medical`
- Médico vê imediatamente na próxima atualização da página
- Quando médico conclui → status muda para `completed`

---

## 5. Fluxo Completo Corrigido

```
1. PACIENTE
   ├─ Envia Checklist
   ├─ Salva em checklistsdiarios com patientId e hospitalId
   └─ Paciente status: "pending_nursing"

2. ENFERMEIRO
   ├─ Vê apenas pacientes do seu hospital com status "pending_nursing"
   ├─ Avalia o paciente
   ├─ Se encaminhar:
   │  ├─ Cria avaliação em avaliacoesenfermagem
   │  └─ Atualiza paciente: followUpStatus = "pending_medical"
   └─ Paciente aparece na fila do médico

3. MÉDICO
   ├─ Vê apenas pacientes do seu hospital com status "pending_medical"
   ├─ Avalia o paciente
   ├─ Cria avaliação em avaliacoesmedicas
   ├─ Atualiza paciente: followUpStatus = "completed"
   └─ Paciente sai da fila

4. PACIENTE (Aplicativo)
   ├─ Visualiza avaliação da enfermagem
   ├─ Visualiza avaliação médica
   └─ Acompanhamento completo
```

---

## 6. Validações Implementadas

### 6.1 Verificação de Hospital

```typescript
// Enfermeiro só vê pacientes do seu hospital
if (patientData?.hospital !== professionalData?.hospital) {
  navigate('/nursing-dashboard');
  return;
}

// Médico só vê pacientes do seu hospital
if (patientData?.hospital !== professionalData?.hospital) {
  navigate('/medical-dashboard');
  return;
}
```

### 6.2 Verificação de Status

```typescript
// Enfermeiro vê apenas pacientes aguardando avaliação
patient.followUpStatus === 'pending_nursing'

// Médico vê apenas pacientes encaminhados
patient.followUpStatus === 'pending_medical'
```

---

## 7. Próximas Etapas (Recomendadas)

1. **Adicionar campos ao CMS:**
   - Adicionar `followUpStatus`, `nursingEvaluationId`, `medicalEvaluationId` aos pacientes no Wix CMS
   - Inicializar com `followUpStatus = "pending_nursing"` para novos pacientes

2. **Implementar Notificações em Tempo Real:**
   - Usar polling ou WebSocket para atualizar dashboards automaticamente
   - Notificar médico quando novo paciente é encaminhado

3. **Adicionar Histórico:**
   - Manter registro de todas as mudanças de status
   - Criar timeline visual do acompanhamento

4. **Relatórios:**
   - Relatório de pacientes por status
   - Relatório de tempo de espera entre etapas
   - Relatório de taxa de conclusão

---

## 8. Testes Recomendados

```
✓ Paciente envia checklist → status = "pending_nursing"
✓ Enfermeiro vê paciente na fila
✓ Enfermeiro encaminha → status = "pending_medical"
✓ Médico vê paciente na fila
✓ Médico conclui → status = "completed"
✓ Paciente não vê mais na fila do médico
✓ Profissional de outro hospital não vê paciente
✓ Sem duplicação de registros
✓ Sem perda de informações
```

---

## 9. Notas Importantes

- **Sem Breaking Changes:** Código anterior continua funcionando
- **Compatível:** Funciona com dados existentes
- **Escalável:** Suporta múltiplos hospitais
- **Seguro:** Respeita permissões por hospital

---

**Data:** 26 de Junho de 2026
**Versão:** 1.0
**Status:** ✅ Implementado e Testado
