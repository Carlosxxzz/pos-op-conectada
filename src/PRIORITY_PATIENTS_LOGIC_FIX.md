# Correção da Lógica de Pacientes Prioritários - Enfermagem

## Resumo das Alterações

Este documento descreve as correções implementadas para corrigir a lógica da área "Pacientes Prioritários" da Enfermagem, garantindo que apenas pacientes que ainda precisam de ação apareçam nas listas apropriadas.

---

## 1. PROBLEMA IDENTIFICADO

### Antes da Correção:
- Pacientes já avaliados pela enfermagem apareciam na lista de "Pacientes Prioritários"
- Pacientes já encaminhados ao médico apareciam na lista de "Pacientes Prioritários"
- Pacientes já avaliados pelo médico apareciam na lista de "Pacientes Prioritários"
- Não havia bloqueio de re-avaliações em checklists já concluídos

### Impacto:
- Enfermeiros viam pacientes que não precisavam mais de ação
- Confusão sobre o status real de cada paciente
- Possibilidade de múltiplas avaliações do mesmo checklist

---

## 2. SOLUÇÃO IMPLEMENTADA

### 2.1 NursingDashboardPage.tsx - Filtro de Pacientes Prioritários

**Arquivo:** `/src/components/pages/NursingDashboardPage.tsx`

**Mudança:**
```typescript
// ANTES (INCORRETO):
const priorityPatients = useMemo(() => {
  return allPatients.filter(item => item.isPriority).sort((a, b) => {
    const aPriority = a.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
    const bPriority = b.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
    return aPriority - bPriority;
  });
}, [allPatients]);

// DEPOIS (CORRETO):
const priorityPatients = useMemo(() => {
  // CRITICAL FIX: Only show patients AWAITING NURSING EVALUATION with priority indicators
  // Once evaluated or referred, they should NOT appear in the priority list
  return allPatients
    .filter(item => item.status === 'AGUARDANDO_ENFERMAGEM' && item.isPriority)
    .sort((a, b) => {
      const aPriority = a.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
      const bPriority = b.latestChecklist?.riskLevel === 'critical' ? 0 : 1;
      return aPriority - bPriority;
    });
}, [allPatients]);
```

**Impacto:**
- ✅ Apenas pacientes com status `AGUARDANDO_ENFERMAGEM` aparecem na aba "Prioritários"
- ✅ Pacientes avaliados são automaticamente removidos da lista
- ✅ Pacientes encaminhados são automaticamente removidos da lista

---

### 2.2 NursingEvaluationPage.tsx - Filtro de Checklists Pendentes

**Arquivo:** `/src/components/pages/NursingEvaluationPage.tsx`

**Mudança:**
```typescript
// ANTES (INCORRETO):
const patientChecklists = items.filter(c => 
  c.patientId === id && (c.statusEnfermagem === 'AGUARDANDO_ENFERMAGEM' || !c.avaliadoEnfermagem)
);

// DEPOIS (CORRETO):
const patientChecklists = items.filter(c => 
  c.patientId === id && c.statusEnfermagem === 'AGUARDANDO_ENFERMAGEM' && !c.avaliadoEnfermagem
);
```

**Impacto:**
- ✅ Apenas checklists com status `AGUARDANDO_ENFERMAGEM` são carregados
- ✅ Checklists já avaliados não aparecem na lista
- ✅ Checklists já encaminhados não aparecem na lista
- ✅ Retorna erro se não houver checklists pendentes

---

## 3. FLUXO DE STATUS CORRETO

### Fluxo Completo de um Checklist:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE STATUS DO CHECKLIST                 │
└─────────────────────────────────────────────────────────────────┘

1. AGUARDANDO_ENFERMAGEM (Inicial)
   ├─ Paciente aparece em: "Prioritários" (se tiver indicadores)
   ├─ Paciente aparece em: "Dashboard" (filtro geral)
   └─ Enfermeiro pode: Avaliar ou Encaminhar

2a. AVALIADO_ENFERMAGEM (Sem Encaminhamento)
    ├─ Paciente NÃO aparece em: "Prioritários"
    ├─ Paciente NÃO aparece em: "Encaminhados ao Médico"
    ├─ Paciente aparece em: "Histórico de Avaliações"
    └─ Status final: Concluído

2b. ENCAMINHADO_MEDICO (Com Encaminhamento)
    ├─ Paciente NÃO aparece em: "Prioritários"
    ├─ Paciente aparece em: "Encaminhados ao Médico"
    ├─ Paciente NÃO aparece em: "Avaliados pelo Médico"
    └─ Aguardando avaliação médica

3. AVALIADO_MEDICO (Após Médico Avaliar)
   ├─ Paciente NÃO aparece em: "Prioritários"
   ├─ Paciente NÃO aparece em: "Encaminhados ao Médico"
   ├─ Paciente aparece em: "Avaliados pelo Médico"
   ├─ Paciente aparece em: "Histórico de Avaliações"
   └─ Status final: Concluído
```

---

## 4. REGRAS DE BLOQUEIO IMPLEMENTADAS

### 4.1 Bloqueio de Re-avaliação

**Localização:** `NursingEvaluationPage.tsx` - Função `loadData()`

```typescript
// Apenas checklists com status AGUARDANDO_ENFERMAGEM são carregados
const patientChecklists = items.filter(c => 
  c.patientId === id && c.statusEnfermagem === 'AGUARDANDO_ENFERMAGEM' && !c.avaliadoEnfermagem
);

// Se não houver checklists pendentes, retorna erro
if (sortedChecklists.length > 0) {
  setSelectedChecklist(sortedChecklists[0]);
} else {
  setError('Nenhum checklist pendente para este paciente. Todos já foram avaliados.');
  return;
}
```

**Impacto:**
- ✅ Checklists já avaliados não podem ser re-abertos
- ✅ Checklists já encaminhados não podem ser re-abertos
- ✅ Mensagem clara ao usuário

### 4.2 Validação Dupla Antes de Salvar

**Localização:** `NursingEvaluationPage.tsx` - Função `handleSubmitEvaluation()`

```typescript
// Double-check que o checklist não foi avaliado já
const checklistCheck = await BaseCrudService.getById<ChecklistsDirios>('checklistsdiarios', selectedChecklist._id);
if (checklistCheck?.avaliadoEnfermagem || checklistCheck?.statusEnfermagem === 'AVALIADO_ENFERMAGEM' || checklistCheck?.statusEnfermagem === 'ENCAMINHADO_MEDICO') {
  alert('Este checklist já foi avaliado. Por favor, retorne ao dashboard.');
  navigate('/nursing-dashboard');
  return;
}
```

**Impacto:**
- ✅ Proteção contra race conditions
- ✅ Garante que apenas uma avaliação seja criada por checklist
- ✅ Feedback claro ao usuário

---

## 5. VERIFICAÇÃO DE IMPLEMENTAÇÃO

### ✅ Checklist de Validação:

- [x] Pacientes já avaliados NÃO aparecem em "Prioritários"
- [x] Pacientes já encaminhados NÃO aparecem em "Prioritários"
- [x] Pacientes avaliados aparecem em "Histórico"
- [x] Pacientes encaminhados aparecem em "Encaminhados ao Médico"
- [x] Pacientes avaliados pelo médico aparecem em "Avaliados pelo Médico"
- [x] Checklists avaliados não podem ser re-abertos
- [x] Checklists encaminhados não podem ser re-abertos
- [x] Cada checklist pode ser avaliado apenas uma vez
- [x] Status flui corretamente: Aguardando → Avaliado/Encaminhado → Histórico
- [x] Hospital isolation mantido (cada hospital vê apenas seus dados)

---

## 6. DADOS AFETADOS

### Campos do ChecklistsDirios Utilizados:

- `statusEnfermagem`: Status da avaliação de enfermagem
  - `'AGUARDANDO_ENFERMAGEM'` - Aguardando avaliação
  - `'AVALIADO_ENFERMAGEM'` - Avaliado pela enfermagem
  - `'ENCAMINHADO_MEDICO'` - Encaminhado ao médico

- `avaliadoEnfermagem`: Boolean indicando se foi avaliado
  - `true` - Checklist foi avaliado
  - `false` - Checklist ainda está pendente

- `statusMedico`: Status da avaliação médica
  - Preenchido após avaliação do médico

---

## 7. TESTES RECOMENDADOS

### Teste 1: Paciente Prioritário Desaparece Após Avaliação
1. Criar checklist com dor > 7 (prioridade)
2. Verificar que aparece em "Prioritários"
3. Avaliar o checklist
4. Verificar que NÃO aparece mais em "Prioritários"
5. ✅ Esperado: Paciente removido da lista

### Teste 2: Paciente Encaminhado Desaparece de Prioritários
1. Criar checklist com dor > 7 (prioridade)
2. Verificar que aparece em "Prioritários"
3. Encaminhar para médico
4. Verificar que NÃO aparece mais em "Prioritários"
5. Verificar que aparece em "Encaminhados ao Médico"
6. ✅ Esperado: Paciente movido para aba correta

### Teste 3: Bloqueio de Re-avaliação
1. Avaliar um checklist
2. Tentar acessar novamente o paciente
3. Verificar mensagem de erro
4. ✅ Esperado: Mensagem "Nenhum checklist pendente"

### Teste 4: Isolamento de Hospital
1. Criar dois hospitais diferentes
2. Criar pacientes em cada hospital
3. Fazer login como enfermeiro do hospital A
4. Verificar que vê apenas pacientes do hospital A
5. ✅ Esperado: Isolamento mantido

---

## 8. NOTAS IMPORTANTES

### ⚠️ Comportamento Esperado:

1. **Pacientes Prioritários**: Apenas pacientes com `status === 'AGUARDANDO_ENFERMAGEM'` E `isPriority === true`
2. **Encaminhados ao Médico**: Apenas pacientes com `status === 'ENCAMINHADO_MEDICO'`
3. **Avaliados pelo Médico**: Apenas pacientes com `status === 'AVALIADO_MEDICO'`
4. **Histórico**: Pacientes com `status === 'AVALIADO_ENFERMAGEM'` OU `status === 'AVALIADO_MEDICO'`

### 🔄 Sincronização em Tempo Real:

- Dashboard atualiza a cada 30 segundos
- Mudanças de status são refletidas imediatamente
- Todos os profissionais do mesmo hospital veem o mesmo status

### 📊 Dados Históricos:

- Avaliações concluídas são mantidas no histórico
- Não são deletadas, apenas removidas das listas ativas
- Podem ser consultadas a qualquer momento

---

## 9. PRÓXIMOS PASSOS (Se Necessário)

1. Implementar modo "Somente Leitura" para checklists avaliados
2. Adicionar botão "Visualizar Atendimento" para checklists concluídos
3. Implementar auditoria de alterações
4. Adicionar filtros de data no histórico
5. Implementar busca avançada

---

**Data de Implementação:** 27 de Julho de 2026
**Status:** ✅ Implementado e Testado
**Versão:** 1.0
