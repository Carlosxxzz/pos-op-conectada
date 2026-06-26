/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: avaliacoesenfermagem
 * Interface for AvaliaesdeEnfermagem
 */
export interface AvaliaesdeEnfermagem {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType date */
  checklistDate?: Date | string;
  /** @wixFieldType text */
  patientId?: string;
  /** @wixFieldType text */
  nurseName?: string;
  /** @wixFieldType text */
  clinicalObservations?: string;
  /** @wixFieldType text */
  patientGuidelines?: string;
  /** @wixFieldType text */
  patientStatus?: string;
  /** @wixFieldType boolean */
  referredToDoctor?: boolean;
}


/**
 * Collection ID: avaliacoesmedicas
 * Interface for AvaliaesMdicas
 */
export interface AvaliaesMdicas {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  nursingEvaluationId?: string;
  /** @wixFieldType text */
  followUpStatus?: string;
  /** @wixFieldType text */
  patientId?: string;
  /** @wixFieldType text */
  doctorName?: string;
  /** @wixFieldType text */
  clinicalRecommendations?: string;
  /** @wixFieldType boolean */
  hospitalReturnRecommended?: boolean;
  /** @wixFieldType boolean */
  inPersonEvaluationRecommended?: boolean;
  /** @wixFieldType text */
  medicationGuidanceAdjustment?: string;
}


/**
 * Collection ID: checklistsdiarios
 * Interface for ChecklistsDirios
 */
export interface ChecklistsDirios {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType datetime */
  checklistDate?: Date | string;
  /** @wixFieldType text */
  reasonNotTakingMedication?: string;
  /** @wixFieldType text */
  patientId?: string;
  /** @wixFieldType number */
  painLevel?: number;
  /** @wixFieldType boolean */
  hasFever?: boolean;
  /** @wixFieldType number */
  bodyTemperature?: number;
  /** @wixFieldType boolean */
  scarRedness?: boolean;
  /** @wixFieldType boolean */
  hasSecretion?: boolean;
  /** @wixFieldType boolean */
  hasBadOdor?: boolean;
  /** @wixFieldType boolean */
  shortnessOfBreath?: boolean;
  /** @wixFieldType boolean */
  dizziness?: boolean;
  /** @wixFieldType boolean */
  increasingPain?: boolean;
  /** @wixFieldType boolean */
  takingMedicationCorrectly?: boolean;
  /** @wixFieldType boolean */
  eatingNormally?: boolean;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  scarPhoto?: string;
  /** @wixFieldType text */
  riskLevel?: string;
}


/**
 * Collection ID: medicacoeschecklist
 * Interface for MedicaesdoChecklist
 */
export interface MedicaesdoChecklist {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  medicationName?: string;
  /** @wixFieldType time */
  timeTaken?: any;
  /** @wixFieldType text */
  doseQuantity?: string;
  /** @wixFieldType date */
  checklistDate?: Date | string;
  /** @wixFieldType text */
  patientNotes?: string;
}


/**
 * Collection ID: medicamentos
 * Interface for Medicamentos
 */
export interface Medicamentos {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  medicationName?: string;
  /** @wixFieldType text */
  genericName?: string;
  /** @wixFieldType text */
  dosageForm?: string;
  /** @wixFieldType text */
  strength?: string;
  /** @wixFieldType text */
  routeOfAdministration?: string;
  /** @wixFieldType boolean */
  isApproved?: boolean;
}


/**
 * Collection ID: notificacoes
 * Interface for Notifications
 */
export interface Notifications {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  recipientType?: string;
  /** @wixFieldType text */
  message?: string;
  /** @wixFieldType text */
  notificationType?: string;
  /** @wixFieldType boolean */
  isRead?: boolean;
  /** @wixFieldType datetime */
  timestamp?: Date | string;
}


/**
 * Collection ID: pacientes
 * Interface for Pacientes
 */
export interface Pacientes {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  hospital?: string;
  /** @wixFieldType text */
  cpf?: string;
  /** @wixFieldType date */
  dateOfBirth?: Date | string;
  /** @wixFieldType text */
  phoneNumber?: string;
  /** @wixFieldType text */
  address?: string;
  /** @wixFieldType text */
  susNumber?: string;
  /** @wixFieldType text */
  surgeryType?: string;
  /** @wixFieldType date */
  surgeryDate?: Date | string;
  /** @wixFieldType text */
  responsibleHospital?: string;
  /** @wixFieldType text */
  responsibleDoctorName?: string;
  /** @wixFieldType text */
  emergencyContact?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  password?: string;
}


/**
 * Collection ID: profissionais
 * Interface for Profissionais
 */
export interface Profissionais {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  password?: string;
  /** @wixFieldType text */
  profile?: string;
  /** @wixFieldType text */
  hospital?: string;
  /** @wixFieldType text */
  specialty?: string;
  /** @wixFieldType text */
  status?: string;
}
