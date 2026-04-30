import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schemas } from 'lideris-commoms-microservice';

import { PatientsController } from './controllers/patients.controller';
import { CreateJudicialAuthorityNoticeService } from './services/create-judicial-authority-notice.service';
import { CreatePatientSoatCaseService } from './services/create-patient-soat-case.service';
import { CreatePatientService } from './services/create-patient.service';
import { FindJudicialAuthorityNoticeByIdService } from './services/find-judicial-authority-notice-by-id.service';
import { FindPatientByIdService } from './services/find-patient-by-id.service';
import { FindPatientSoatCaseByIdService } from './services/find-patient-soat-case-by-id.service';
import { IdentifyPatientService } from './services/identify-patient.service';
import { ImportPatientService } from './services/import-patient.service';
import { ListJudicialAuthorityNoticesService } from './services/list-judicial-authority-notices.service';
import { ListPatientSoatCasesService } from './services/list-patient-soat-cases.service';
import { ListPatientsService } from './services/list-patients.service';
import { MergePatientService } from './services/merge-patient.service';
import { SearchPatientService } from './services/search-patient.service';
import { UpdateJudicialAuthorityNoticeService } from './services/update-judicial-authority-notice.service';
import { UpdatePatientSoatCaseService } from './services/update-patient-soat-case.service';
import { UpdatePatientService } from './services/update-patient.service';

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
  ],
  providers: [
    ListPatientsService,
    CreatePatientService,
    FindPatientByIdService,
    UpdatePatientService,
    SearchPatientService,
    IdentifyPatientService,
    MergePatientService,
    ImportPatientService,
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
