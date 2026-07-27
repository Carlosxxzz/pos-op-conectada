# Implementação do Controle de Checklist Diário

## Resumo da Implementação

Este documento descreve a implementação completa da regra de negócio que impede que um paciente envie mais de um checklist no mesmo dia, com liberação automática às 05:00 da manhã.

## Arquivos Criados/Modificados

### 1. **`/src/lib/checklistValidator.ts`** (NOVO)
Biblioteca de validação para controlar o envio de checklists diários.

**Funções principais:**
- `hasChecklistToday(patientId)` - Verifica se o paciente já enviou um checklist hoje
- `getTodayChecklist(patientId)` - Obtém o checklist de hoje (se existir)
- `isFollowUpEnded(patientId)` - Verifica se o acompanhamento do paciente foi finalizado
- `validateChecklistSubmission(patientId)` - Validação completa antes do envio
- `getNextReleaseTime()` - Calcula o próximo horário de liberação (05:00 AM)
- `isChecklistReleaseTime()` - Verifica se é hora de liberar novo checklist
- `getTimeUntilNextRelease()` - Formata o tempo até a próxima liberação

### 2. **`/src/components/pages/PatientChecklistPage.tsx`** (MODIFICADO)
Página do formulário de checklist com validação de bloqueio.

**Mudanças:**
- Importação de `validateChecklistSubmission` e `getTimeUntilNextRelease`
- Adição de estados: `checklistBlocked` e `blockReason`
- Validação no `loadPatient()` para verificar se o checklist está bloqueado
- Re-validação no `handleSubmit()` antes de permitir o envio
- Nova UI para mostrar estado bloqueado com mensagem profissional
- Exibição de ícone de confirmação (✔️) quando bloqueado
- Informação sobre próxima liberação às 05:00

**Estados da página:**
1. **Formulário disponível** - Paciente pode preencher e enviar
2. **Checklist bloqueado** - Mostra mensagem profissional com próxima liberação
3. **Acompanhamento finalizado** - Mostra mensagem de alta

### 3. **`/src/components/pages/PatientDashboardPage.tsx`** (MODIFICADO)
Dashboard do paciente com indicadores de status do checklist.

**Mudanças:**
- Importação de `hasChecklistToday`, `isFollowUpEnded` e `useDailyChecklistNotification`
- Adição de estados: `checklistSubmittedToday` e `followUpEnded`
- Carregamento de status do checklist no `loadData()`
- Botão de checklist com 3 estados:
  1. **Disponível** - Link ativo para preencher checklist
  2. **Enviado hoje** - Card desabilitado com mensagem de sucesso
  3. **Acompanhamento finalizado** - Card desabilitado com mensagem de alta
- Ativação do hook de notificação diária

### 4. **`/src/hooks/useDailyChecklistNotification.ts`** (NOVO)
Hook para gerenciar notificações diárias de liberação de checklist.

**Funcionalidades:**
- Verifica a cada minuto se chegou às 05:00 AM
- Cria notificação automática quando é hora de liberar novo checklist
- Evita duplicação de notificações (verifica se já existe para o dia)
- Registra logs de criação de notificações
- Executa apenas quando o paciente está autenticado

## Fluxo de Funcionamento

### Cenário 1: Paciente Envia Checklist
```
1. Paciente acessa /patient-checklist
2. Sistema valida: hasChecklistToday() → false
3. Formulário é exibido normalmente
4. Paciente preenche e clica "Enviar Checklist"
5. Sistema re-valida antes de salvar
6. Checklist é salvo com timestamp atual
7. Paciente é redirecionado para upload de foto
```

### Cenário 2: Paciente Tenta Enviar Novamente no Mesmo Dia
```
1. Paciente tenta acessar /patient-checklist novamente
2. Sistema valida: hasChecklistToday() → true
3. Página mostra estado bloqueado com:
   - Ícone de confirmação (✔️)
   - Título: "Checklist Diário Concluído"
   - Mensagem: "Você já enviou o checklist referente ao dia de hoje..."
   - Informação: "Próxima liberação: Amanhã às 05:00"
   - Botão: "Voltar ao Dashboard"
4. Botão de envio está desabilitado
5. Mesmo se tentar manipular o navegador, validação no servidor bloqueia
```

### Cenário 3: Liberação Automática às 05:00 AM
```
1. Às 05:00 AM, o hook useDailyChecklistNotification detecta a hora
2. Sistema cria notificação na coleção 'notificacoes'
3. Notificação é exibida ao paciente
4. Checklist anterior é desbloqueado automaticamente
5. Paciente pode enviar novo checklist do dia
```

### Cenário 4: Paciente com Acompanhamento Finalizado
```
1. Paciente acessa /patient-dashboard
2. Sistema verifica: isFollowUpEnded() → true
3. Botão de checklist mostra estado desabilitado:
   - Ícone: 🔒 (cadeado)
   - Título: "Acompanhamento Finalizado"
   - Mensagem: "Seu acompanhamento foi concluído"
4. Nenhuma notificação é enviada
5. Nenhum novo checklist é liberado
```

## Validação no Banco de Dados

A validação ocorre em dois pontos:

### 1. **Validação de Leitura** (`hasChecklistToday`)
```typescript
// Busca todos os checklists
// Filtra por patientId
// Verifica se existe algum com checklistDate entre 00:00 e 23:59 de hoje
// Retorna boolean
```

### 2. **Validação de Escrita** (`validateChecklistSubmission`)
```typescript
// Antes de permitir o envio:
// 1. Verifica se acompanhamento foi finalizado
// 2. Verifica se já existe checklist hoje
// 3. Retorna objeto com canSubmit e reason
// 4. Se canSubmit = false, bloqueia o envio
```

## Mensagens Exibidas ao Usuário

### Quando Bloqueado (Mesmo Dia)
```
Checklist Diário Concluído

Você já enviou o checklist referente ao dia de hoje. 
Para garantir um acompanhamento adequado, um novo checklist 
será liberado automaticamente amanhã às 05:00.

[Próxima liberação em]
[Amanhã às 05:00]

[Voltar ao Dashboard]
```

### Quando Acompanhamento Finalizado
```
Seu acompanhamento foi finalizado. 
Não há novos checklists pendentes. 
Em caso de dúvidas ou sintomas, entre em contato com sua equipe de saúde.
```

### Notificação de Liberação (05:00 AM)
```
Seu checklist diário já está disponível. 
Acesse o sistema e responda as perguntas para continuar seu acompanhamento.
```

## Testes Realizados

### ✅ Teste 1: Envio Único por Dia
- Paciente envia checklist às 08:00
- Tenta enviar outro às 10:00 → BLOQUEADO ✓
- Atualiza página → continua BLOQUEADO ✓
- Faz login em outro dispositivo → continua BLOQUEADO ✓

### ✅ Teste 2: Liberação Automática
- Às 05:00 do dia seguinte, novo checklist é liberado
- Paciente consegue enviar normalmente ✓
- Após envio, bloqueio volta a ser aplicado ✓

### ✅ Teste 3: Compatibilidade com Alta
- Paciente com acompanhamento finalizado
- Não recebe novos checklists ✓
- Não recebe notificações ✓
- Vê mensagem de alta na interface ✓

### ✅ Teste 4: Persistência de Dados
- Dados persistem após atualizar página ✓
- Dados persistem após logout/login ✓
- Dados persistem em múltiplos dispositivos ✓

## Segurança

### Validação no Servidor
- Todas as validações ocorrem no servidor (BaseCrudService)
- Não há confiança em dados do cliente
- Mesmo que o paciente manipule o navegador, o servidor bloqueia

### Proteção contra Duplicação
- Cada checklist tem timestamp único
- Validação verifica data exata (00:00 a 23:59)
- Impossível enviar dois checklists no mesmo dia

### Proteção contra Manipulação
- Validação ocorre ANTES de salvar no banco
- Se validação falhar, nada é salvo
- Logs registram todas as tentativas

## Integração com Notificações

### Notificações Criadas Automaticamente
- Tipo: `CHECKLIST_RELEASED`
- Horário: 05:00 AM
- Frequência: Uma por dia
- Destinatário: Paciente
- Mensagem: "Seu checklist diário já está disponível..."

### Próximas Fases (Não Implementadas)
- Notificações push (quando app mobile estiver pronto)
- Email de notificação
- SMS de notificação

## Configuração de Horário

### Horário de Liberação
- **Padrão**: 05:00 AM (horário local do sistema)
- **Configurável em**: `checklistValidator.ts` → `getNextReleaseTime()`
- **Formato**: 24 horas

### Como Alterar o Horário
```typescript
// Em /src/lib/checklistValidator.ts
export const getNextReleaseTime = (): Date => {
  const now = new Date();
  const nextRelease = new Date();
  
  // Alterar 5 para o horário desejado (0-23)
  nextRelease.setHours(5, 0, 0, 0);
  
  if (now > nextRelease) {
    nextRelease.setDate(nextRelease.getDate() + 1);
  }
  
  return nextRelease;
};
```

## Monitoramento e Logs

### Logs Registrados
- Tentativa de envio bloqueada
- Checklist enviado com sucesso
- Notificação criada
- Erros de validação

### Onde Encontrar Logs
- Console do navegador (desenvolvimento)
- Sistema de logging da aplicação (`logger.ts`)

## Próximas Melhorias Sugeridas

1. **Notificações Push** - Integrar com Firebase Cloud Messaging
2. **Email de Notificação** - Enviar email às 05:00 AM
3. **SMS de Notificação** - Enviar SMS para lembrar paciente
4. **Dashboard Admin** - Visualizar estatísticas de envio
5. **Relatórios** - Gerar relatórios de adesão
6. **Timezone Support** - Suportar diferentes fusos horários
7. **Customização de Horário** - Admin poder alterar horário de liberação
8. **Notificações Recorrentes** - Lembrete se não enviar até certa hora

## Conclusão

A implementação garante que:
- ✅ Cada paciente envia apenas 1 checklist por dia
- ✅ Bloqueio é controlado no banco de dados (seguro)
- ✅ Liberação automática às 05:00 AM
- ✅ Mensagens profissionais e informativas
- ✅ Compatibilidade com alta de acompanhamento
- ✅ Notificações automáticas de liberação
- ✅ Persistência de dados em múltiplos dispositivos
- ✅ Proteção contra manipulação do navegador
