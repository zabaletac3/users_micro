import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule } from '@nestjs/microservices';
import { Schemas, registerGRPCConfig, registerKafkaConfig } from 'lideris-commoms-microservice';
import {
  StatusChangeHistorySchema,
  StatusChangeHistory,
} from '@shared/schemas/status-change-history.schema';
import { ResendProvider } from '@shared/providers/resend.provider';

import constants from '../../constants';

import { EmployeesController } from './controllers/employees.controller';
import {
  FindAllEmployeesService,
  FindEmployeeByIdService,
  CreateEmployeeService,
  UpdateEmployeeService,
  HandleEmployeeStatusService,
  OrganizationGrpcClientService,
  EmployeesKafkaService,
} from './providers';
import { HandleDocumentService } from './providers/handle-document.service';
import { HandleProfileImageService } from './providers/handle-profile-image.service';
import { HandlePositionService } from './providers/handle-position.service';
import { EMPLOYEES_KAFKA_CLIENT } from './providers/employees-kafka.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Schemas.User.name, schema: Schemas.UserSchema },
      { name: Schemas.Document.name, schema: Schemas.DocumentSchema },
      { name: Schemas.Position.name, schema: Schemas.PositionSchema },
      { name: Schemas.Company.name, schema: Schemas.CompanySchema },
      { name: Schemas.Department.name, schema: Schemas.DepartmentSchema },
      { name: Schemas.Area.name, schema: Schemas.AreaSchema },
      { name: Schemas.MedicalSpecialty.name, schema: Schemas.MedicalSpecialtySchema },
      { name: StatusChangeHistory.name, schema: StatusChangeHistorySchema },
    ]),
    ClientsModule.register([
      registerGRPCConfig(
        'organization' as never,
        'ORGANIZATION_PACKAGE',
        constants.GRPC_URL_ORGANIZATION,
      ),
      registerKafkaConfig(EMPLOYEES_KAFKA_CLIENT, `${constants.KAFKA_GROUP_ID}-employees`),
    ]),
  ],
  controllers: [EmployeesController],
  providers: [
    FindAllEmployeesService,
    FindEmployeeByIdService,
    CreateEmployeeService,
    UpdateEmployeeService,
    HandleEmployeeStatusService,
    HandleDocumentService,
    HandleProfileImageService,
    HandlePositionService,
    OrganizationGrpcClientService,
    EmployeesKafkaService,
    ResendProvider,
  ],
})
export class EmployeesModule {}
