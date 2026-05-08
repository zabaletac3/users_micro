import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schemas } from 'lideris-commoms-microservice';

import { PatientsController } from './controllers/patients.controller';
import { IdDocumentsModule } from './id-documents/id-documents.module';
import { CreateJudicialAuthorityNoticeService } from './providers/judicial-notice/create-judicial-authority-notice.service';
import { CreatePatientSoatCaseService } from './providers/soat-case/create-patient-soat-case.service';
import * as PATIENT_SERVICES from './providers/patients';
import { FindJudicialAuthorityNoticeByIdService } from './providers/judicial-notice/find-judicial-authority-notice-by-id.service';
import { FindPatientSoatCaseByIdService } from './providers/soat-case/find-patient-soat-case-by-id.service';
import { ListJudicialAuthorityNoticesService } from './providers/judicial-notice/list-judicial-authority-notices.service';
import { ListPatientSoatCasesService } from './providers/soat-case/list-patient-soat-cases.service';
import { UpdateJudicialAuthorityNoticeService } from './providers/judicial-notice/update-judicial-authority-notice.service';
import { UpdatePatientSoatCaseService } from './providers/soat-case/update-patient-soat-case.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schemas.User.name, schema: Schemas.UserSchema },
      { name: Schemas.UserAffiliation.name, schema: Schemas.UserAffiliationSchema },
      { name: Schemas.Company.name, schema: Schemas.CompanySchema },
      { name: Schemas.Payer.name, schema: Schemas.PayerSchema },
      { name: Schemas.Document.name, schema: Schemas.DocumentSchema },
      { name: Schemas.UserClinicalProfile.name, schema: Schemas.UserClinicalProfileSchema },
      { name: Schemas.JudicialAuthorityNotice.name, schema: Schemas.JudicialAuthorityNoticeSchema },
      { name: Schemas.PatientSoatCase.name, schema: Schemas.PatientSoatCaseSchema },
    ]),
    IdDocumentsModule,
  ],
  providers: [
    PATIENT_SERVICES.ListPatientsService,
    PATIENT_SERVICES.CreatePatientService,
    PATIENT_SERVICES.FindPatientByIdService,
    PATIENT_SERVICES.UpdatePatientService,
    PATIENT_SERVICES.SearchPatientService,
    PATIENT_SERVICES.IdentifyPatientService,
    PATIENT_SERVICES.MergePatientService,
    PATIENT_SERVICES.ImportPatientService,
    CreatePatientSoatCaseService,
    ListPatientSoatCasesService,
    FindPatientSoatCaseByIdService,
    UpdatePatientSoatCaseService,
    CreateJudicialAuthorityNoticeService,
    ListJudicialAuthorityNoticesService,
    FindJudicialAuthorityNoticeByIdService,
    UpdateJudicialAuthorityNoticeService,
  ],
  controllers: [PatientsController],
})
export class PatientsModule {}
