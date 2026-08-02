/**
 * Auto-generated entity types
 * Contains all CMS collection interfaces in a single file 
 */

/**
 * Collection ID: alertasprioritarios
 * Interface for PriorityAlerts
 */
export interface PriorityAlerts {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  patientId?: string;
  /** @wixFieldType text */
  patientName?: string;
  /** @wixFieldType text */
  alertType?: string;
  /** @wixFieldType text */
  severity?: string;
  /** @wixFieldType text */
  alertValue?: string;
  /** @wixFieldType datetime */
  alertTimestamp?: Date | string;
  /** @wixFieldType boolean */
  resolutionStatus?: boolean;
  /** @wixFieldType datetime */
  resolutionTimestamp?: Date | string;
}


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
  checklistId?: string;
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
  referralReason?: string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType datetime */
  evaluationDate?: Date | string;
  /** @wixFieldType text */
  hospitalName?: string;
  /** @wixFieldType text */
  enfermeiroResponsavel?: string;
  /** @wixFieldType text */
  checklistId?: string;
  /** @wixFieldType text */
  medicalObservations?: string;
  /** @wixFieldType boolean */
  needsFollowUp?: boolean;
  /** @wixFieldType text */
  patientRecommendations?: string;
  /** @wixFieldType text */
  medicalPrescription?: string;
  /** @wixFieldType text */
  medicalConduct?: string;
  /** @wixFieldType text */
  clinicalCondition?: string;
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
  medicalEvaluationId?: string;
  /** @wixFieldType text */
  followUpStatus?: string;
  /** @wixFieldType datetime */
  dataAvaliacaoEnfermagem?: Date | string;
  /** @wixFieldType boolean */
  avaliadoEnfermagem?: boolean;
  /** @wixFieldType text */
  statusEnfermagem?: string;
  /** @wixFieldType text */
  statusMedico?: string;
  /** @wixFieldType text */
  hospital?: string;
  /** @wixFieldType text */
  medicoResponsavel?: string;
  /** @wixFieldType text */
  enfermeiroResponsavel?: string;
  /** @wixFieldType datetime */
  dataEncaminhamento?: Date | string;
  /** @wixFieldType boolean */
  encaminhadoMedico?: boolean;
  /** @wixFieldType text */
  status?: string;
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
 * Collection ID: encaminhamentosmedicos
 * Interface for EncaminhamentosMdicos
 */
export interface EncaminhamentosMdicos {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  patientId?: string;
  /** @wixFieldType text */
  checklistId?: string;
  /** @wixFieldType text */
  hospitalId?: string;
  /** @wixFieldType text */
  nurseId?: string;
  /** @wixFieldType text */
  nurseName?: string;
  /** @wixFieldType text */
  doctorId?: string;
  /** @wixFieldType text */
  doctorName?: string;
  /** @wixFieldType text */
  nurseMessage?: string;
  /** @wixFieldType datetime */
  referralDate?: Date | string;
  /** @wixFieldType text */
  status?: string;
  /** @wixFieldType boolean */
  viewed?: boolean;
  /** @wixFieldType text */
  doctorResponse?: string;
  /** @wixFieldType datetime */
  responseDate?: Date | string;
}


/**
 * Collection ID: especialidades
 * Interface for Especialidades
 */
export interface Especialidades {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  professionalType?: string;
  /** @wixFieldType text */
  specialtyCode?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
}


/**
 * Collection ID: historicoatividades
 * Interface for ActivityHistory
 */
export interface ActivityHistory {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  nurseId?: string;
  /** @wixFieldType text */
  nurseName?: string;
  /** @wixFieldType text */
  actionType?: string;
  /** @wixFieldType text */
  patientId?: string;
  /** @wixFieldType text */
  patientName?: string;
  /** @wixFieldType datetime */
  actionTimestamp?: Date | string;
  /** @wixFieldType text */
  actionDescription?: string;
  /** @wixFieldType text */
  actionDetails?: string;
}


/**
 * Collection ID: hospitais
 * Interface for Hospitais
 */
export interface Hospitais {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType text */
  city?: string;
  /** @wixFieldType text */
  state?: string;
  /** @wixFieldType text */
  phone?: string;
  /** @wixFieldType text */
  email?: string;
  /** @wixFieldType text */
  address?: string;
}


/**
 * Collection ID: logsauditoria
 * Interface for LogsdeAuditoria
 */
export interface LogsdeAuditoria {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  action?: string;
  /** @wixFieldType text */
  user?: string;
  /** @wixFieldType date */
  date?: Date | string;
  /** @wixFieldType time */
  time?: any;
  /** @wixFieldType text */
  details?: string;
  /** @wixFieldType text */
  ipAddress?: string;
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
  recipientId?: string;
  /** @wixFieldType text */
  relatedChecklistId?: string;
  /** @wixFieldType text */
  hospital?: string;
  /** @wixFieldType text */
  patientName?: string;
  /** @wixFieldType text */
  patientId?: string;
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
  dischargeObservations?: string;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  dischargeDoctor?: string;
  /** @wixFieldType datetime */
  dischargeDate?: Date | string;
  /** @wixFieldType text */
  dischargeStatus?: string;
  /** @wixFieldType array_string */
  pushTokens?: any;
  /** @wixFieldType text */
  authEmail?: string;
  /** @wixFieldType text */
  lastMedicalEvaluationId?: string;
  /** @wixFieldType text */
  followUpStatus?: string;
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
 * Collection ID: permissoes
 * Interface for Permisses
 */
export interface Permisses {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  permissionName?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType text */
  professionalType?: string;
  /** @wixFieldType boolean */
  canDeletePatients?: boolean;
  /** @wixFieldType boolean */
  canRegisterProfessionals?: boolean;
  /** @wixFieldType boolean */
  canEditHospitals?: boolean;
  /** @wixFieldType boolean */
  canViewAllHospitals?: boolean;
  /** @wixFieldType boolean */
  canAccessSettings?: boolean;
}


/**
 * Collection ID: profissionais
 * Interface for Profissionais
 */
export interface Profissionais {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType date */
  dataNascimento?: Date | string;
  /** @wixFieldType text */
  permissoes?: string;
  /** @wixFieldType text */
  criadoPor?: string;
  /** @wixFieldType datetime */
  ultimoAcesso?: Date | string;
  /** @wixFieldType date */
  dataAdmissao?: Date | string;
  /** @wixFieldType text */
  cargaHoraria?: string;
  /** @wixFieldType text */
  turno?: string;
  /** @wixFieldType text */
  registroProfissional?: string;
  /** @wixFieldType text */
  complemento?: string;
  /** @wixFieldType text */
  numero?: string;
  /** @wixFieldType text */
  endereco?: string;
  /** @wixFieldType text */
  cidade?: string;
  /** @wixFieldType text */
  estado?: string;
  /** @wixFieldType text */
  cep?: string;
  /** @wixFieldType text */
  whatsapp?: string;
  /** @wixFieldType text */
  telefone?: string;
  /** @wixFieldType text */
  sexo?: string;
  /** @wixFieldType text */
  fullName?: string;
  /** @wixFieldType text */
  cpf?: string;
  /** @wixFieldType image - Contains image URL, render with <Image> component, NOT as text */
  profilePhoto?: string;
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


/**
 * Collection ID: setores
 * Interface for Sectors
 */
export interface Sectors {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  name?: string;
  /** @wixFieldType text */
  hospitalId?: string;
  /** @wixFieldType text */
  description?: string;
  /** @wixFieldType boolean */
  isActive?: boolean;
  /** @wixFieldType datetime */
  creationDate?: Date | string;
}


/**
 * Collection ID: statusacompanhamentopaciente
 * Interface for PatientFollowupStatus
 */
export interface PatientFollowupStatus {
  _id: string;
  _createdDate?: Date;
  _updatedDate?: Date;
  /** @wixFieldType text */
  patientName?: string;
  /** @wixFieldType text */
  currentStatus?: string;
  /** @wixFieldType text */
  previousStatus?: string;
  /** @wixFieldType datetime */
  statusChangeDate?: Date | string;
  /** @wixFieldType number */
  daysInCurrentStatus?: number;
  /** @wixFieldType date */
  dischargeDate?: Date | string;
  /** @wixFieldType text */
  dischargeReason?: string;
  /** @wixFieldType date */
  followUpEndDate?: Date | string;
}
