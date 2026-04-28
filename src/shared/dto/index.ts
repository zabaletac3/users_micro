// Importar todos los DTOs
import * as AddOrRemoveDocumentDTO from './add-or-remove-document.dto';
import * as CreatePatientDTO from './create-patient.dto';
import * as FindAllPatientDTO from './find-all-patient.dto';
import * as FindPatientByIdDTO from './find-patient-by-id.dto';
import * as FindPatientByIdResponseDTO from './find-patient-by-id-response.dto';
import * as IdentifyPatientDTO from './identify-patient.dto';
import * as ImportPatientDTO from './import-patient.dto';
import * as JudicialAuthorityNoticeDTO from './judicial-authority-notice.dto';
import * as JudicialAuthorityNoticeResponseDTO from './judicial-authority-notice-response.dto';
import * as ListPatientResponseDTO from './list-patient-response.dto';
import * as MergePatientDTO from './merge-patient.dto';
import * as PatientSoatCaseDTO from './patient-soat-case.dto';
import * as PatientSoatCaseResponseDTO from './patient-soat-case-response.dto';
import * as SearchPatientDTO from './search-patient.dto';
import * as UpdatePatientDTO from './update-patient.dto';

// Crear el objeto DTOs que contenga todos los DTOs
export const DTOs = {
  addOrRemoveDocument: AddOrRemoveDocumentDTO,
  createPatient: CreatePatientDTO,
  findAllPatient: FindAllPatientDTO,
  findPatientById: FindPatientByIdDTO,
  findPatientByIdResponse: FindPatientByIdResponseDTO,
  identifyPatient: IdentifyPatientDTO,
  importPatient: ImportPatientDTO,
  judicialAuthorityNotice: JudicialAuthorityNoticeDTO,
  judicialAuthorityNoticeResponse: JudicialAuthorityNoticeResponseDTO,
  listPatientResponse: ListPatientResponseDTO,
  mergePatient: MergePatientDTO,
  patientSoatCase: PatientSoatCaseDTO,
  patientSoatCaseResponse: PatientSoatCaseResponseDTO,
  searchPatient: SearchPatientDTO,
  updatePatient: UpdatePatientDTO,
};
