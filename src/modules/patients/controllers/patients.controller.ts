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
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as PATIENT_DTOS from '@shared/dto';
import { Decorators, Pipes } from 'lideris-commoms-microservice';
import { I18nKeys } from '@shared/constants/i18n-keys.constants';

import * as DOCS from '../docs';
import * as JOI_SCHEMAS from '../joi-validation';
import * as SOAT_CASE_SERVICES from '../providers/soat-case';
import * as JUDICIAL_NOTICE_SERVICES from '../providers/judicial-notice';
import * as PATIENT_SERVICES from '../providers/patients';

@ApiTags('patients')
@ApiBearerAuth()
//TODO: Validar si es necesario el decorador @APiExtraModel()
@Controller('patients')
export class PatientsController {
  constructor(
    private readonly listPatientsService: PATIENT_SERVICES.ListPatientsService,
    private readonly createPatientService: PATIENT_SERVICES.CreatePatientService,
    private readonly findPatientByIdService: PATIENT_SERVICES.FindPatientByIdService,
    private readonly updatePatientService: PATIENT_SERVICES.UpdatePatientService,
    private readonly searchPatientService: PATIENT_SERVICES.SearchPatientService,
    private readonly identifyPatientService: PATIENT_SERVICES.IdentifyPatientService,
    private readonly mergePatientService: PATIENT_SERVICES.MergePatientService,
    private readonly importPatientService: PATIENT_SERVICES.ImportPatientService,
    private readonly createPatientSoatCaseService: SOAT_CASE_SERVICES.CreatePatientSoatCaseService,
    private readonly listPatientSoatCasesService: SOAT_CASE_SERVICES.ListPatientSoatCasesService,
    private readonly findPatientSoatCaseByIdService: SOAT_CASE_SERVICES.FindPatientSoatCaseByIdService,
    private readonly updatePatientSoatCaseService: SOAT_CASE_SERVICES.UpdatePatientSoatCaseService,
    private readonly createJudicialAuthorityNoticeService: JUDICIAL_NOTICE_SERVICES.CreateJudicialAuthorityNoticeService,
    private readonly listJudicialAuthorityNoticesService: JUDICIAL_NOTICE_SERVICES.ListJudicialAuthorityNoticesService,
    private readonly findJudicialAuthorityNoticeByIdService: JUDICIAL_NOTICE_SERVICES.FindJudicialAuthorityNoticeByIdService,
    private readonly updateJudicialAuthorityNoticeService: JUDICIAL_NOTICE_SERVICES.UpdateJudicialAuthorityNoticeService,
  ) {}

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiListPatients()
  @Get()
  async listPatients(
    @Decorators.CurrentCompanyId() companyId: string,
    @Query() query: PATIENT_DTOS.FindAllPatientsDto,
  ) {
    return this.listPatientsService.execute({ ...query, companyId });
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiSearchPatient()
  @Get('search')
  async searchPatient(
    @Decorators.CurrentCompanyId() companyId: string,
    @Query() query: PATIENT_DTOS.SearchPatientQueryDto,
  ) {
    return this.searchPatientService.execute({ ...query, companyId });
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiListPatientSoatCases()
  @Get(':id/soat-cases')
  async listPatientSoatCases(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
  ) {
    return this.listPatientSoatCasesService.execute(id, companyId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiGetPatientSoatCaseById()
  @Get(':id/soat-cases/:soatCaseId')
  async getPatientSoatCaseById(
    @Param('id') id: string,
    @Param('soatCaseId') soatCaseId: string,
    @Decorators.CurrentCompanyId() companyId: string,
  ) {
    return this.findPatientSoatCaseByIdService.execute(id, companyId, soatCaseId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiCreatePatientSoatCase()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.CreatePatientSoatCaseSchema))
  @Post(':id/soat-cases')
  async createPatientSoatCase(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.CreatePatientSoatCaseDto,
  ) {
    return this.createPatientSoatCaseService.execute(id, companyId, dto);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiUpdatePatientSoatCase()
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.UpdatePatientSoatCaseSchema))
  @Patch(':id/soat-cases/:soatCaseId')
  async updatePatientSoatCase(
    @Param('id') id: string,
    @Param('soatCaseId') soatCaseId: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.UpdatePatientSoatCaseDto,
  ) {
    return this.updatePatientSoatCaseService.execute(id, companyId, soatCaseId, dto);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiListJudicialAuthorityNotices()
  @Get(':id/judicial-authority-notices')
  async listJudicialAuthorityNotices(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Query('soatCaseId') soatCaseId?: string,
  ) {
    return this.listJudicialAuthorityNoticesService.execute(id, companyId, soatCaseId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiGetJudicialAuthorityNoticeById()
  @Get(':id/judicial-authority-notices/:noticeId')
  async getJudicialAuthorityNoticeById(
    @Param('id') id: string,
    @Param('noticeId') noticeId: string,
    @Decorators.CurrentCompanyId() companyId: string,
  ) {
    return this.findJudicialAuthorityNoticeByIdService.execute(id, companyId, noticeId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiCreateJudicialAuthorityNotice()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.CreateJudicialAuthorityNoticeSchema))
  @Post(':id/judicial-authority-notices')
  async createJudicialAuthorityNotice(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.CreateJudicialAuthorityNoticeDto,
  ) {
    return this.createJudicialAuthorityNoticeService.execute(id, companyId, dto);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiUpdateJudicialAuthorityNotice()
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.UpdateJudicialAuthorityNoticeSchema))
  @Patch(':id/judicial-authority-notices/:noticeId')
  async updateJudicialAuthorityNotice(
    @Param('id') id: string,
    @Param('noticeId') noticeId: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.UpdateJudicialAuthorityNoticeDto,
  ) {
    return this.updateJudicialAuthorityNoticeService.execute(id, companyId, noticeId, dto);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @ApiResponse({
    status: 200,
    description: 'Patient found.',
    type: PATIENT_DTOS.FindPatientByIdResponseDto,
  })
  @Get(':id')
  async findPatientById(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Query() query: PATIENT_DTOS.FindPatientByIdDto,
  ) {
    return this.findPatientByIdService.execute(id, { ...query, companyId });
  }

  @Version('1')
  @DOCS.ApiCreatePatient()
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.CreatePatientSchema))
  @Post()
  async create(
    @Body() dto: PATIENT_DTOS.CreatePatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) {
      throw new UnauthorizedException(I18nKeys.COMMON_ERROR_INVALID_USER_CONTEXT);
    }

    return this.createPatientService.execute(dto, userId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiImportPatient()
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.ImportPatientSchema))
  @Post(':id/import')
  async import(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.ImportPatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) throw new UnauthorizedException(I18nKeys.COMMON_ERROR_INVALID_USER_CONTEXT);

    return this.importPatientService.execute(id, companyId, dto, userId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiMergePatient()
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.MergePatientSchema))
  @Post(':id/merge')
  async merge(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.MergePatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) throw new UnauthorizedException(I18nKeys.COMMON_ERROR_INVALID_USER_CONTEXT);

    return this.mergePatientService.execute(id, companyId, dto, userId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiIdentifyPatient()
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.IdentifyPatientSchema))
  @Patch(':id/identify')
  async identify(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.IdentifyPatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) throw new UnauthorizedException(I18nKeys.COMMON_ERROR_INVALID_USER_CONTEXT);

    return this.identifyPatientService.execute(id, companyId, dto, userId);
  }

  @Version('1')
  @DOCS.ApiCompanyIdFromAuthContext()
  @DOCS.ApiUpdatePatient()
  @UsePipes(new Pipes.JoiValidationPipe(JOI_SCHEMAS.UpdatePatientSchema))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Decorators.CurrentCompanyId() companyId: string,
    @Body() dto: PATIENT_DTOS.UpdatePatientDto,
    @Decorators.CurrentAuthzContext()
    authzContext: { principal: { userId: string } },
  ) {
    const { userId } = authzContext.principal;

    if (!userId) {
      throw new UnauthorizedException(I18nKeys.COMMON_ERROR_INVALID_USER_CONTEXT);
    }

    return this.updatePatientService.execute(id, companyId, dto, userId);
  }
}
