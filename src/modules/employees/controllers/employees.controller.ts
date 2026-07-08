import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  Version,
} from '@nestjs/common';
import {
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Pipes, Decorators, Enums } from 'lideris-commoms-microservice';
import * as EmployeeDtos from '@shared/dto/employees';

import * as EmployeeServices from '../providers';
import * as Validations from '../joi-validations';
import { EMPLOYEE_TRACE_EVENTS } from '../providers/employees.constants';

const { TraceAction } = Enums;

@ApiTags('employees')
@Controller('employees')
@Decorators.Public()
@ApiExtraModels(EmployeeDtos.EmployeeListResponseDto, EmployeeDtos.EmployeeResponseDto)
export class EmployeesController {
  constructor(
    private readonly findAllService: EmployeeServices.FindAllEmployeesService,
    private readonly findByIdService: EmployeeServices.FindEmployeeByIdService,
    private readonly createService: EmployeeServices.CreateEmployeeService,
    private readonly updateService: EmployeeServices.UpdateEmployeeService,
    private readonly handleStatusService: EmployeeServices.HandleEmployeeStatusService,
  ) {}

  @Get()
  @Version('1')
  @ApiOperation({
    summary: 'List employees',
    description: `Paginated list of employees with hybrid cursor/offset pagination.

**Cursor pagination (recommended for large datasets):**
Use \`?cursor=<last_id>&pageSize=20\` — faster, no \`skip\`, consistent under inserts/deletes.
The response \`pagination.nextCursor\` is the ID to pass as \`?cursor=\` for the next page.
When \`nextCursor\` is \`null\`, there are no more pages.
Default: \`pageSize=20\`, mode: \`cursor\`.

**Offset pagination:**
Use \`?page=1&pageSize=20\` — standard page/size. The response includes \`total\` and \`totalPages\`.

**Position type filter:**
Use \`?positionTypes=doctor,collaborator\` to filter employees by position type. Resolved via gRPC to micro-organization.

**Free-text search:**
Use \`?q=term\` to search across name, email, documentNumber, serial, and phone.`,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Free-text search (name, email, documentNumber, serial, phone)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for offset pagination (1-based)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    description: 'Items per page (1-100, default 20)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description:
      'Cursor _id for cursor-based pagination. Pass the last item _id from previous page.',
  })
  @ApiQuery({
    name: 'positionTypes',
    required: false,
    description:
      'Comma-separated position types (e.g. doctor,collaborator). Resolves position IDs via gRPC.',
  })
  @ApiQuery({ name: 'isActive', required: false, description: 'true/false' })
  @ApiQuery({ name: 'gender', required: false, description: 'MALE/FEMALE/OTHER' })
  @ApiQuery({
    name: 'maritalStatus',
    required: false,
    description: 'SINGLE/MARRIED/DIVORCED/WIDOWED/SEPARATED/COUPLE',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated employee list',
    type: EmployeeDtos.EmployeeListResponseDto,
  })
  @UsePipes(new Pipes.JoiQueryValidationPipe(Validations.listEmployeesSchema))
  async findAll(
    @Query() query: Record<string, unknown>,
    @Decorators.CurrentCompanyId() companyId: string,
  ) {
    return this.findAllService.findAll(query, companyId);
  }

  @Post()
  @Version('1')
  @ApiOperation({
    summary: 'Create employee',
    description:
      'Creates a new employee. Company from auth context. Validates related entities (position, departments, areas) via gRPC to micro-organization.',
  })
  @ApiBody({ type: EmployeeDtos.CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Employee created' })
  @ApiResponse({ status: 400, description: 'Related entity not found or not in position' })
  @ApiResponse({ status: 409, description: 'Email or document number already exists' })
  @Decorators.TraceEvent({
    action: TraceAction.CREATE,
    eventCode: EMPLOYEE_TRACE_EVENTS.CREATED as Enums.TraceEventCode,
    entityType: 'employee',
    buildMessage: () => 'Employee created successfully',
    getEntityId: (result: { data?: { _id?: string } }) => String(result?.data?._id ?? ''),
  })
  @UsePipes(new Pipes.JoiValidationPipe(Validations.createEmployeeSchema))
  async createEmployee(
    @Body() dto: EmployeeDtos.CreateEmployeeDto,
    @Decorators.CurrentCompanyId() companyId: string,
  ) {
    return this.createService.create(dto, companyId);
  }

  @Get(':id')
  @Version('1')
  @ApiOperation({
    summary: 'Get employee by ID',
    description:
      'Retrieves an employee by ID with populated position, department, area, and sub-specialty names.',
  })
  @ApiParam({
    name: 'id',
    description: 'Employee ID',
    type: String,
    example: '6a076e8dbd4f50a897804854',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee found',
    type: EmployeeDtos.EmployeeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async findById(@Param('id') id: string, @Decorators.CurrentCompanyId() companyId: string) {
    return this.findByIdService.findById(id, companyId);
  }

  @Patch(':id')
  @Version('1')
  @ApiOperation({
    summary: 'Update employee',
    description:
      'Updates fields and complex operations (documents, profile images, position, departments, areas).',
  })
  @ApiParam({ name: 'id', description: 'Employee ID', type: String })
  @ApiBody({ type: EmployeeDtos.UpdateEmployeeDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Employee or entity not found' })
  @Decorators.TraceEvent({
    action: TraceAction.UPDATE,
    eventCode: EMPLOYEE_TRACE_EVENTS.UPDATED as Enums.TraceEventCode,
    entityType: 'employee',
    buildMessage: () => 'Employee updated successfully',
    getEntityId: (result: { data?: { _id?: string } }) => String(result?.data?._id ?? ''),
  })
  @UsePipes(new Pipes.JoiValidationPipe(Validations.updateEmployeeSchema))
  async updateEmployee(
    @Param('id') id: string,
    @Body() dto: EmployeeDtos.UpdateEmployeeDto,
    @Decorators.CurrentCompanyId() companyId: string,
  ) {
    return this.updateService.update(companyId, id, dto);
  }

  @Patch(':id/status')
  @Version('1')
  @ApiOperation({
    summary: 'Activate/deactivate employee',
    description: 'Changes employee status with audit trail.',
  })
  @ApiParam({ name: 'id', description: 'Employee ID', type: String })
  @ApiBody({ type: EmployeeDtos.HandleEmployeeStatusDto })
  @ApiResponse({ status: 200, description: 'Status changed' })
  @ApiResponse({ status: 400, description: 'Already in target status' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Decorators.TraceEvent({
    action: TraceAction.UPDATE,
    eventCode: EMPLOYEE_TRACE_EVENTS.ACTIVATED as Enums.TraceEventCode,
    entityType: 'employee',
    buildMessage: (result: { messageKey?: string; data?: { _id?: string } }) =>
      result?.messageKey === 'EMPLOYEE_ACTIVATED_SUCCESS'
        ? 'Employee activated'
        : 'Employee deactivated',
    getEntityId: (result: { data?: { _id?: string } }) => String(result?.data?._id ?? ''),
  })
  @UsePipes(new Pipes.JoiValidationPipe(Validations.handleEmployeeStatusSchema))
  async handleStatusEmployee(
    @Param('id') id: string,
    @Body() dto: EmployeeDtos.HandleEmployeeStatusDto,
    @Decorators.CurrentCompanyId() companyId: string,
    @Req() req: { authzContext?: { principal?: { userId?: string } } },
  ) {
    const userId = req.authzContext?.principal?.userId;

    return this.handleStatusService.handle(companyId, id, dto, userId ?? '');
  }
}
