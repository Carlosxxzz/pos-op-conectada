# NURSING AREA STATUS FLOW - CRITICAL FIX

## Problem Summary
When a doctor completes a medical evaluation, the patient was NOT being automatically removed from the "Encaminhados ao Médico" (Forwarded to Doctor) list in the nursing area. The status was not being updated in the database, causing the patient to remain visible in the pending referrals list.

## Solution Implemented

### 1. **MedicalEvaluationPage.tsx** - Doctor Evaluation Submission
**Status Update on Submit:**
- When doctor clicks "Finalizar Avaliação Médica", the system now:
  1. Creates medical evaluation record in `avaliacoesmedicas`
  2. Updates checklist status to reflect medical evaluation completion
  3. **CRITICAL**: Updates referral status to `'CONCLUIDO'` (line 191)
  4. Updates patient follow-up status
  5. Creates notification for patient

**Key Code:**
```typescript
// Update the referral record to mark as CONCLUIDO (completed)
await BaseCrudService.update('encaminhamentosmedicos', {
  _id: referralData._id,
  viewed: true,
  doctorResponse: formData.medicalConduct,
  responseDate: now,
  status: 'CONCLUIDO', // CRITICAL: This status change triggers removal from pending referrals
});
```

### 2. **NursingDashboardPage.tsx** - Status Logic Fix
**Updated Status Determination (lines 150-167):**

The dashboard now checks referral status BEFORE determining if patient should appear in "Encaminhados ao Médico":

```typescript
if (nursingEval) {
  status = 'AVALIADO_ENFERMAGEM';
  nurseName = nursingEval.nurseName;
  evaluationDate = nursingEval.checklistDate;
} else if (referral) {
  // CRITICAL FIX: Check referral status - if CONCLUIDO or has medical eval, show as AVALIADO_MEDICO
  if (referral.status === 'CONCLUIDO' || medicalEval) {
    status = 'AVALIADO_MEDICO';
    doctorName = medicalEval?.doctorName || referral.doctorName;
    evaluationDate = medicalEval?.evaluationDate || referral.responseDate;
  } else {
    // Only show as ENCAMINHADO_MEDICO if referral is still pending (not CONCLUIDO)
    status = 'ENCAMINHADO_MEDICO';
    nurseName = referral.nurseName;
    doctorName = referral.doctorName;
    referralDate = referral.referralDate;
  }
}
```

**Impact:**
- Patients with `referral.status === 'CONCLUIDO'` are automatically moved to "Avaliados Médico" tab
- They no longer appear in "Encaminhados ao Médico" list
- Dashboard stats automatically update
- UI reflects changes immediately without page refresh

### 3. **NursingReferralViewPage.tsx** - Read-Only Mode
**Current Implementation:**
- Already displays referrals in read-only mode
- Shows "Visualização de Encaminhamento (Somente Leitura)" in header
- Displays medical evaluation if it exists

### 4. **NursingPatientsEvaluatedByDoctorPage.tsx** - Evaluated Patients History
**Current Implementation:**
- Shows patients that have been evaluated by doctor
- Read-only mode with Lock icon indicator
- Only allows viewing, no editing buttons

## Complete Status Flow

### STAGE 1: Patient Submits Checklist
- Status: `AGUARDANDO_ENFERMAGEM` (Awaiting Nursing Evaluation)
- Appears in: "Aguardando Avaliação" tab

### STAGE 2: Nurse Starts Evaluation
- Status: `AVALIADO_ENFERMAGEM` (Evaluated by Nursing)
- Appears in: "Avaliados Enfermagem" tab
- Other nurses can only view (read-only)

### STAGE 3a: Nurse Resolves Case
- Status: `AVALIADO_ENFERMAGEM`
- Appears in: "Histórico de Avaliações" (History)
- No further action needed

### STAGE 3b: Nurse Refers to Doctor
- Referral created with status: `PENDENTE` (or empty)
- Patient appears in: "Encaminhados ao Médico" tab
- Nurses can only view (read-only)

### STAGE 4: Doctor Completes Evaluation
- **AUTOMATIC UPDATE**: Referral status → `'CONCLUIDO'`
- Patient automatically moves to: "Pacientes Avaliados pelo Médico" tab
- Appears in: "Histórico de Avaliações" (History)
- All nurses can view (read-only)
- No editing allowed

## Database Changes

### `encaminhamentosmedicos` Collection
- **New Status Values:**
  - `'PENDENTE'` or empty: Awaiting doctor response
  - `'CONCLUIDO'`: Doctor has completed evaluation

### `avaliacoesmedicas` Collection
- Created when doctor submits evaluation
- Links to referral via `nursingEvaluationId`

## UI Behavior

### Dashboard Tabs
1. **Dashboard** - Overview with stats
2. **Prioritários** - Critical patients
3. **Encaminhados** - Only shows patients with `referral.status !== 'CONCLUIDO'`
4. **Avaliados Médico** - Shows patients with `referral.status === 'CONCLUIDO'` or medical evaluation exists
5. **Histórico** - Links to evaluation history pages
6. **Perfil** - Nurse profile

### Permissions After Doctor Evaluation
- ✅ All nurses can view checklist
- ✅ All nurses can view photos
- ✅ All nurses can view nursing evaluation
- ✅ All nurses can view medical evaluation
- ✅ All nurses can view medications
- ✅ All nurses can view observations
- ❌ No nurse can edit any information
- ❌ No action buttons (Avaliar, Continuar, Editar, Encaminhar, Salvar, Finalizar)
- ✅ Only "Visualizar" (View) button available

## Testing Checklist

- [ ] Patient submits checklist → appears in "Aguardando Avaliação"
- [ ] Nurse evaluates → status changes to "Avaliado Enfermagem"
- [ ] Nurse refers to doctor → appears in "Encaminhados ao Médico"
- [ ] Doctor completes evaluation → automatically moves to "Avaliados Médico"
- [ ] Patient disappears from "Encaminhados ao Médico" list
- [ ] Patient appears in "Pacientes Avaliados pelo Médico" tab
- [ ] Status shows "✓ Avaliado Médico"
- [ ] No edit buttons visible on evaluated patients
- [ ] All nurses can view the completed evaluation
- [ ] Dashboard stats update automatically
- [ ] No page refresh needed for UI update

## Files Modified

1. `/src/components/pages/MedicalEvaluationPage.tsx` - Doctor evaluation submission
2. `/src/components/pages/NursingDashboardPage.tsx` - Status logic fix
3. `/src/components/pages/NursingReferralViewPage.tsx` - Already read-only
4. `/src/components/pages/NursingPatientsEvaluatedByDoctorPage.tsx` - Already read-only

## Real-Time Updates

The dashboard auto-refreshes every 30 seconds (line 78 in NursingDashboardPage):
```typescript
useEffect(() => {
  loadData();
  const interval = setInterval(loadData, 30000); // 30 second refresh
  return () => clearInterval(interval);
}, []);
```

This ensures that even without manual page refresh, the UI will reflect status changes within 30 seconds.
