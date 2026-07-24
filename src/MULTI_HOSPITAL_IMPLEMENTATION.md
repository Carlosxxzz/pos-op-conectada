# Multi-Hospital Architecture Implementation Plan

## Overview
This document outlines the implementation of a complete multi-tenant (multi-hospital) architecture for the Pós-Op Conectado system. The system will use hospital isolation as the primary filter for all data operations.

## Key Changes Required

### 1. Authentication & Session Management
- **Professional Login**: Store `professionalHospital` in localStorage ✓
- **Patient Login**: Store `patientHospital` in localStorage ✓
- **useHospitalContext Hook**: Created to retrieve hospital context ✓
- **useProfessionalAuth Hook**: Updated to include hospitalId ✓

### 2. Hospital Selection in Forms
- **AdminProfessionalFormPage**: Load hospitals from database, allow selection
- **PatientLoginPage**: Load hospitals from database for patient registration

### 3. Data Filtering by Hospital
All pages must filter data by the logged-in user's hospital:

#### Patient Pages
- PatientDashboardPage: Filter checklists by patient's hospital
- PatientChecklistPage: Filter by hospital
- PatientPhotosPage: Filter by hospital
- PatientHistoryPage: Filter by hospital
- PatientEvaluationsPage: Filter by hospital

#### Professional Pages
- NursingDashboardPage: Filter patients, checklists, evaluations by hospital
- NursingEvaluationPage: Filter by hospital
- MedicalDashboardPage: Filter patients, checklists, evaluations by hospital
- MedicalEvaluationPage: Filter by hospital
- AdminProfessionalsPage: Filter professionals by admin's hospital
- AdminDashboardPage: Filter all data by hospital

#### Shared Data
- Notifications: Filter by hospital
- Referrals: Filter by hospital
- Alerts: Filter by hospital

### 4. Concurrent Evaluation Locking
- When a nurse/doctor opens a checklist for evaluation, lock it for others in the same hospital
- Show message: "Este paciente está sendo avaliado por outro [profissional]"
- Implement using evaluation status tracking

### 5. Hospital-Specific Dashboards
All dashboards must show only data from the user's hospital:
- Patient count
- Checklist count
- Alert count
- Evaluation count
- Professional count
- Critical patients
- Pending items

### 6. Admin Isolation
- Admins can only manage professionals in their own hospital
- Admins can only view patients in their own hospital
- Admins cannot see other hospitals' data

### 7. Data Creation with Hospital Context
When creating new records:
- Professionals: Must have hospital field set to admin's hospital
- Patients: Must have hospital field set (from registration or admin assignment)
- Checklists: Inherit hospital from patient
- Evaluations: Inherit hospital from patient
- Referrals: Inherit hospital from patient
- Alerts: Inherit hospital from patient

## Implementation Steps

### Phase 1: Foundation (Authentication & Context)
1. ✓ Create useHospitalContext hook
2. ✓ Update useProfessionalAuth hook
3. Update ProfessionalLoginPage to store hospital
4. Update PatientLoginPage to store hospital

### Phase 2: Form Updates
5. Update AdminProfessionalFormPage to load and select hospitals
6. Update PatientLoginPage registration to select hospital

### Phase 3: Data Filtering
7. Update all dashboard pages to filter by hospital
8. Update all list pages to filter by hospital
9. Update all detail pages to filter by hospital

### Phase 4: Concurrent Access Control
10. Implement evaluation locking mechanism
11. Add concurrent access detection

### Phase 5: Testing & Validation
12. Test multi-hospital isolation
13. Verify no data leakage between hospitals
14. Test concurrent access scenarios

## Database Queries Pattern

All queries should follow this pattern:

```typescript
// Get user's hospital
const professionalId = localStorage.getItem('professionalId');
const professional = await BaseCrudService.getById<Profissionais>('profissionais', professionalId);
const hospitalId = professional?.hospital;

// Filter data by hospital
const { items } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
const filteredItems = items.filter(item => {
  const patient = patients.find(p => p._id === item.patientId);
  return patient?.hospital === hospitalId;
});
```

Or more efficiently, filter at the patient level:

```typescript
const { items: patients } = await BaseCrudService.getAll<Pacientes>('pacientes');
const hospitalPatients = patients.filter(p => p.hospital === hospitalId);
const patientIds = hospitalPatients.map(p => p._id);

const { items: checklists } = await BaseCrudService.getAll<ChecklistsDirios>('checklistsdiarios');
const hospitalChecklists = checklists.filter(c => patientIds.includes(c.patientId || ''));
```

## Security Considerations

1. **Hospital Validation**: Always validate that the user's hospital matches the data's hospital
2. **No Hardcoded Hospitals**: Never hardcode hospital IDs or names
3. **Logout Cleanup**: Clear hospital context on logout
4. **Cross-Hospital Prevention**: Implement checks to prevent accessing other hospitals' data
5. **Audit Logging**: Log all cross-hospital access attempts

## Files to Modify

### Hooks
- [x] useHospitalContext.ts (NEW)
- [x] useProfessionalAuth.ts (UPDATED)

### Pages
- [ ] ProfessionalLoginPage.tsx
- [ ] PatientLoginPage.tsx
- [ ] AdminProfessionalFormPage.tsx
- [ ] AdminProfessionalsPage.tsx
- [ ] AdminDashboardPage.tsx
- [ ] AdminProfilePage.tsx
- [ ] NursingDashboardPage.tsx
- [ ] NursingEvaluationPage.tsx
- [ ] MedicalDashboardPage.tsx
- [ ] MedicalEvaluationPage.tsx
- [ ] PatientDashboardPage.tsx
- [ ] PatientChecklistPage.tsx
- [ ] PatientPhotosPage.tsx
- [ ] PatientHistoryPage.tsx
- [ ] PatientEvaluationsPage.tsx

### Components
- [ ] NotificationPanel.tsx
- [ ] AdminSidebar.tsx

## Testing Checklist

- [ ] Create two different hospitals
- [ ] Register professionals in each hospital
- [ ] Register patients in each hospital
- [ ] Verify professionals only see their hospital's data
- [ ] Verify patients only see their hospital's data
- [ ] Verify admins only manage their hospital
- [ ] Verify checklists don't cross hospitals
- [ ] Verify evaluations don't cross hospitals
- [ ] Verify notifications are hospital-specific
- [ ] Verify dashboards show only hospital data
- [ ] Test concurrent access scenarios
- [ ] Verify logout clears hospital context

## Status
- Phase 1: IN PROGRESS
- Phase 2: PENDING
- Phase 3: PENDING
- Phase 4: PENDING
- Phase 5: PENDING
