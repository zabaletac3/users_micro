import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UsePipes,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreatePatientDto } from '@shared/dto/create-patient.dto';
import { FindAllPatientsDto } from '@shared/dto/find-all-patient.dto';
import {
  AffiliationPopulatedDto,
  PayerPopulatedDto,
  FindPatientByIdResponseDto,
} from '@shared/dto/find-patient-by-id-response.dto';
import { FindPatientByIdDto } from '@shared/dto/find-patient-by-id.dto';
import { IdentifyPatientDto } from '@shared/dto/identify-patient.dto';
import { ImportPatientDto } from '@shared/dto/import-patient.dto';
import {
  JudicialAuthorityNoticeResponseDto,
  JudicialAuthorityNoticeListResponseDto,
} from '@shared/dto/judicial-authority-notice-response.dto';
import {
  CreateJudicialAuthorityNoticeDto,
  UpdateJudicialAuthorityNoticeDto,
} from '@shared/dto/judicial-authority-notice.dto';
import { PatientItemResponseDto } from '@shared/dto/list-patient-response.dto';
import { MergePatientDto } from '@shared/dto/merge-patient.dto';
import {
  PatientSoatCaseResponseDto,
  PatientSoatCaseListResponseDto,
} from '@shared/dto/patient-soat-case-response.dto';
import {
  CreatePatientSoatCaseDto,
  UpdatePatientSoatCaseDto,
} from '@shared/dto/patient-soat-case.dto';
import { SearchPatientQueryDto } from '@shared/dto/search-patient.dto';
import { UpdatePatientDto } from '@shared/dto/update-patient.dto';
import { Decorators, Pipes } from 'lideris-commoms-microservice';
import { Schemas } from 'lideris-commoms-microservice';

import {
  ApiCreateJudicialAuthorityNotice,
  ApiGetJudicialAuthorityNoticeById,
  ApiListJudicialAuthorityNotices,
  ApiUpdateJudicialAuthorityNotice,
} from '../docs/api-judicial-authority-notice.docs';
import {
  ApiCreatePatientSoatCase,
  ApiGetPatientSoatCaseById,
  ApiListPatientSoatCases,
  ApiUpdatePatientSoatCase,
} from '../docs/api-patient-soat-cases.docs';
import { ApiImportPatient } from '../docs/api-import-patient.docs';
import { ApiMergePatient } from '../docs/api-merge-patient.docs';
import { ApiIdentifyPatient } from '../docs/api-identify-patient.docs';
import { ApiSearchPatient } from '../docs/api-search-patient.docs';
import { ApiUpdatePatient } from '../docs/api-update-patient.docs';
import { ApiListPatients } from '../docs/api-list-patients.docs';
import { ApiCreatePatient } from '../docs/create-patient.docs';
import {
  CreatePatientSchema,
  CreatePatientSoatCaseSchema,
  CreateJudicialAuthorityNoticeSchema,
  IdentifyPatientSchema,
  ImportPatientSchema,
  MergePatientSchema,
  UpdatePatientSchema,
  UpdatePatientSoatCaseSchema,
  UpdateJudicialAuthorityNoticeSchema,
} from '../joi-validation';
import { CreateJudicialAuthorityNoticeService } from '../services/create-judicial-authority-notice.service';
import { CreatePatientSoatCaseService } from '../services/create-patient-soat-case.service';
import { CreatePatientService } from '../services/create-patient.service';
import { FindJudicialAuthorityNoticeByIdService } from '../services/find-judicial-authority-notice-by-id.service';
import { FindPatientByIdService } from '../services/find-patient-by-id.service';
import { FindPatientSoatCaseByIdService } from '../services/find-patient-soat-case-by-id.service';
import { IdentifyPatientService } from '../services/identify-patient.service';
import { ImportPatientService } from '../services/import-patient.service';
import { ListJudicialAuthorityNoticesService } from '../services/list-judicial-authority-notices.service';
import { ListPatientSoatCasesService } from '../services/list-patient-soat-cases.service';
import { ListPatientsService } from '../services/list-patients.service';
import { MergePatientService } from '../services/merge-patient.service';
import { SearchPatientService } from '../services/search-patient.service';
import { UpdateJudicialAuthorityNoticeService } from '../services/update-judicial-authority-notice.service';
import { UpdatePatientSoatCaseService } from '../services/update-patient-soat-case.service';
import { UpdatePatientService } from '../services/update-patient.service';

@ApiTags('patients')
@ApiBearerAuth()
@ApiExtraModels(
  PatientItemResponseDto,
  AffiliationPopulatedDto,
  PayerPopulatedDto,
  CreatePatientSoatCaseDto,
  UpdatePatientSoatCaseDto,
  Schemas.SOATData,
  Schemas.SoatVehicleOwner,
  Schemas.SoatVictimTransportCoverage,
  PatientSoatCaseResponseDto,
  PatientSoatCaseListResponseDto,
  CreateJudicialAuthorityNoticeDto,
  UpdateJudicialAuthorityNoticeDto,
  Schemas.JudicialReferringIps,
  JudicialAuthorityNoticeResponseDto,
  JudicialAuthorityNoticeListResponseDto,
)
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly listPatientsService: ListPatientsService,
    private readonly createPatientService: CreatePatientService,
    private readonly findPatientByIdService: FindPatientByIdService,
    private readonly updatePatientService: UpdatePatientService,
    private readonly searchPatientService: SearchPatientService,
    private readonly identifyPatientService: IdentifyPatientService,
    private readonly mergePatientService: MergePatientService,
    private readonly importPatientService: ImportPatientService,
    private readonly createPatientSoatCaseService: CreatePatientSoatCaseService,
    private readonly listPatientSoatCasesService: ListPatientSoatCasesService,
    private readonly findPatientSoatCaseByIdService: FindPatientSoatCaseByIdService,
    private readonly updatePatientSoatCaseService: UpdatePatientSoatCaseService,
    private readonly createJudicialAuthorityNoticeService: CreateJudicialAuthorityNoticeService,
    private readonly listJudicialAuthorityNoticesService: ListJudicialAuthorityNoticesService,
    private readonly findJudicialAuthorityNoticeByIdService: FindJudicialAuthorityNoticeByIdService,
    private readonly updateJudicialAuthorityNoticeService: UpdateJudicialAuthorityNoticeService,
  ) {}

  @Version('1')
  @ApiListPatients()
  @Get()
  async listPatients(@Query() dto: FindAllPatientsDto) {
    return this.listPatientsService.execute(dto);
  }

  @Version('1')
  @ApiSearchPatient()
  @Get('search')
  async searchPatient(@Query() dto: SearchPatientQueryDto) {
    return this.searchPatientService.execute(dto);
  }

  @Version('1')
  @ApiListPatientSoatCases()
  @Get(':id/soat-cases')
  async listPatientSoatCases(@Param('id') id: string, @Query('companyId') companyId: string) {
    return this.listPatientSoatCasesService.execute(id, companyId);
  }

  @Version('1')
  @ApiGetPatientSoatCaseById()
  @Get(':id/soat-cases/:soatCaseId')
  async getPatientSoatCaseById(
    @Param('id') id: string,
    @Param('soatCaseId') soatCaseId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.findPatientSoatCaseByIdService.execute(id, companyId, soatCaseId);
  }

  @Version('1')
  @ApiCreatePatientSoatCase()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new Pipes.JoiValidationPipe(CreatePatientSoatCaseSchema))
  @Post(':id/soat-cases')
  async createPatientSoatCase(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() dto: CreatePatientSoatCaseDto,
  ) {
    return this.createPatientSoatCaseService.execute(id, companyId, dto);
  }

  @Version('1')
  @ApiUpdatePatientSoatCase()
  @UsePipes(new Pipes.JoiValidationPipe(UpdatePatientSoatCaseSchema))
  @Patch(':id/soat-cases/:soatCaseId')
  async updatePatientSoatCase(
    @Param('id') id: string,
    @Param('soatCaseId') soatCaseId: string,
    @Query('companyId') companyId: string,
    @Body() dto: UpdatePatientSoatCaseDto,
  ) {
    return this.updatePatientSoatCaseService.execute(id, companyId, soatCaseId, dto);
  }

  @Version('1')
  @ApiListJudicialAuthorityNotices()
  @Get(':id/judicial-authority-notices')
  async listJudicialAuthorityNotices(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Query('soatCaseId') soatCaseId?: string,
  ) {
    return this.listJudicialAuthorityNoticesService.execute(id, companyId, soatCaseId);
  }

  @Version('1')
  @ApiGetJudicialAuthorityNoticeById()
  @Get(':id/judicial-authority-notices/:noticeId')
  async getJudicialAuthorityNoticeById(
    @Param('id') id: string,
    @Param('noticeId') noticeId: string,
    @Query('companyId') companyId: string,
  ) {
    return this.findJudicialAuthorityNoticeByIdService.execute(id, companyId, noticeId);
  }

  @Version('1')
  @ApiCreateJudicialAuthorityNotice()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new Pipes.JoiValidationPipe(CreateJudicialAuthorityNoticeSchema))
  @Post(':id/judicial-authority-notices')
  async createJudicialAuthorityNotice(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() dto: CreateJudicialAuthorityNoticeDto,
  ) {
    return this.createJudicialAuthorityNoticeService.execute(id, companyId, dto);
  }

  @Version('1')
  @ApiUpdateJudicialAuthorityNotice()
  @UsePipes(new Pipes.JoiValidationPipe(UpdateJudicialAuthorityNoticeSchema))
  @Patch(':id/judicial-authority-notices/:noticeId')
  async updateJudicialAuthorityNotice(
    @Param('id') id: string,
    @Param('noticeId') noticeId: string,
    @Query('companyId') companyId: string,
    @Body() dto: UpdateJudicialAuthorityNoticeDto,
  ) {
    return this.updateJudicialAuthorityNoticeService.execute(id, companyId, noticeId, dto);
  }

  @Version('1')
  @ApiResponse({
    status: 200,
    description: 'Patient found.',
    type: FindPatientByIdResponseDto,
  })
  @Get(':id')
  async findPatientById(@Param('id') id: string, @Query() dto: FindPatientByIdDto) {
    return this.findPatientByIdService.execute(id, dto);
  }

  @Version('1')
  @ApiCreatePatient()
  @UsePipes(new Pipes.JoiValidationPipe(CreatePatientSchema))
  @Post()
  async create(
    @Body() dto: CreatePatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) {
      throw new UnauthorizedException('INVALID_USER_CONTEXT');
    }

    return this.createPatientService.execute(dto, userId);
  }

  @Version('1')
  @ApiImportPatient()
  @UsePipes(new Pipes.JoiValidationPipe(ImportPatientSchema))
  @Post(':id/import')
  async import(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() dto: ImportPatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) throw new UnauthorizedException('INVALID_USER_CONTEXT');

    return this.importPatientService.execute(id, companyId, dto, userId);
  }

  @Version('1')
  @ApiMergePatient()
  @UsePipes(new Pipes.JoiValidationPipe(MergePatientSchema))
  @Post(':id/merge')
  async merge(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() dto: MergePatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) throw new UnauthorizedException('INVALID_USER_CONTEXT');

    return this.mergePatientService.execute(id, companyId, dto, userId);
  }

  @Version('1')
  @ApiIdentifyPatient()
  @UsePipes(new Pipes.JoiValidationPipe(IdentifyPatientSchema))
  @Patch(':id/identify')
  async identify(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() dto: IdentifyPatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) throw new UnauthorizedException('INVALID_USER_CONTEXT');

    return this.identifyPatientService.execute(id, companyId, dto, userId);
  }

  @Version('1')
  @ApiUpdatePatient()
  @UsePipes(new Pipes.JoiValidationPipe(UpdatePatientSchema))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() dto: UpdatePatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) {
      throw new UnauthorizedException('INVALID_USER_CONTEXT');
    }

    return this.updatePatientService.execute(id, companyId, dto, userId);
  }
}
