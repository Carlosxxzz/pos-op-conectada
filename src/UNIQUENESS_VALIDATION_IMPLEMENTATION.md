# Global Uniqueness Validation Implementation

## Overview
This document describes the implementation of global uniqueness validation for user personal data across the entire system. The validation ensures that CPF, SUS Card (for patients), and Email are unique across all user types (Patients, Nurses, Doctors, and Administrators).

## Implementation Details

### 1. Core Validation Module
**File:** `/src/lib/uniquenessValidator.ts`

This module provides the following functions:

#### `checkPatientUniqueness(cpf, susNumber, email, excludeUserId?)`
- Validates uniqueness for patient registration
- Checks CPF, SUS number, and email across both Pacientes and Profissionais collections
- Returns a result object with:
  - `isUnique: boolean` - Whether all fields are unique
  - `duplicateField?: 'cpf' | 'susNumber' | 'email'` - Which field is duplicated
  - `message?: string` - User-friendly error message

#### `checkProfessionalUniqueness(cpf, email, excludeUserId?)`
- Validates uniqueness for professional registration (Doctors, Nurses, Admins)
- Checks CPF and email across both Pacientes and Profissionais collections
- Returns a result object with the same structure as above

### 2. Data Normalization
The validator normalizes data before comparison to ensure consistency:
- **CPF:** Removes all non-numeric characters
- **SUS Number:** Removes all non-numeric characters
- **Email:** Converts to lowercase and trims whitespace

### 3. Integration Points

#### Patient Registration (PatientLoginPage.tsx)
- Added import: `import { checkPatientUniqueness } from '@/lib/uniquenessValidator';`
- Modified `handleRegister` function to call `checkPatientUniqueness` before creating a new patient
- Displays clear error messages if duplicates are found
- Prevents registration if validation fails

#### Professional Registration (AdminProfessionalFormPage.tsx)
- Added import: `import { checkProfessionalUniqueness } from '@/lib/uniquenessValidator';`
- Modified `validateForm` function to be async and call `checkProfessionalUniqueness`
- Updated `handleSubmit` to await the async validation
- Displays clear error messages if duplicates are found
- Works for both creating new professionals and updating existing ones

### 4. Error Messages
Clear, user-friendly messages are displayed:
- "Este CPF já está cadastrado no sistema."
- "Este Cartão SUS já está cadastrado no sistema."
- "Este e-mail já está cadastrado no sistema."

### 5. Validation Rules

#### Unique Fields (Cannot be duplicated):
- **CPF** - Across all user types
- **Email** - Across all user types
- **SUS Card** - For patients only (professionals don't have this field)

#### Non-unique Fields (Can be repeated):
- Name
- Date of Birth
- Gender
- Address
- City
- State
- Phone Number
- Other non-identifying information

### 6. Database-Level Considerations
The validation is performed at the application level. For production deployment, consider:
1. Adding unique constraints to the database collections
2. Implementing server-side validation
3. Adding database indexes on CPF, SUS number, and email fields for performance

### 7. Error Handling
- Validation errors are caught and logged
- If validation fails due to system errors, the system allows registration to proceed (fail-open approach)
- This prevents legitimate users from being blocked due to temporary system issues

### 8. Performance Considerations
- Validation fetches all users from collections (current approach)
- For large datasets, consider implementing:
  - Pagination with targeted searches
  - Database-level unique constraints
  - Caching mechanisms

## Testing Scenarios

### Scenario 1: Duplicate CPF
1. Register Patient A with CPF "123.456.789-00"
2. Try to register Patient B with same CPF
3. Expected: Registration blocked with message "Este CPF já está cadastrado no sistema."

### Scenario 2: Duplicate Email (Cross-type)
1. Register Professional (Doctor) with email "doctor@hospital.com"
2. Try to register Patient with same email
3. Expected: Registration blocked with message "Este e-mail já está cadastrado no sistema."

### Scenario 3: Duplicate SUS Card
1. Register Patient A with SUS "123 4567 8901 2345"
2. Try to register Patient B with same SUS
3. Expected: Registration blocked with message "Este Cartão SUS já está cadastrado no sistema."

### Scenario 4: Valid Registration
1. Register Patient with unique CPF, SUS, and email
2. Expected: Registration succeeds

### Scenario 5: Update Professional
1. Edit existing professional
2. Change email to one already used by another user
3. Expected: Update blocked with duplicate email message

## Future Enhancements

1. **Database Constraints:** Add unique constraints at the database level
2. **Async Validation:** Implement real-time validation as user types
3. **Batch Operations:** Handle bulk imports with validation
4. **Audit Trail:** Log all uniqueness validation attempts
5. **Performance Optimization:** Implement indexed searches for large datasets

## Files Modified

1. `/src/lib/uniquenessValidator.ts` - NEW: Core validation module
2. `/src/components/pages/PatientLoginPage.tsx` - Added uniqueness check in registration
3. `/src/components/pages/AdminProfessionalFormPage.tsx` - Added uniqueness check in form validation

## Backward Compatibility

This implementation is fully backward compatible:
- Existing users are not affected
- Validation only applies to new registrations and updates
- No changes to database schema required
