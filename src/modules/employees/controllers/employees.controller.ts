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
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Pipes, Decorators, Enums } from 'lideris-commoms-microservice';
import * as EmployeeDtos from '@shared/dto/employees';

import * as EmployeeServices from '../providers';
import * as Validations from '../joi-validations';
import { EMPLOYEE_TRACE_EVENTS } from '../providers/employees.constants';

const { TraceAction } = Enums;

@ApiTags('employees')
@Controller('employees')
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
    description: 'Paginated list with cursor/offset pagination.',
  })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list' })
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
    description: 'Creates a new employee. Company from auth context.',
  })
  @ApiBody({ type: EmployeeDtos.CreateEmployeeDto })
  @ApiResponse({ status: 201, description: 'Created' })
  @ApiResponse({ status: 400, description: 'Invalid data or entity not found' })
  @ApiResponse({ status: 409, description: 'Email or document number exists' })
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
  @ApiOperation({ summary: 'Get employee by ID', description: 'Retrieves an employee by ID.' })
  @ApiParam({ name: 'id', description: 'Employee ID', type: String })
  @ApiResponse({ status: 200, description: 'Found' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findById(@Param('id') id: string, @Decorators.CurrentCompanyId() companyId: string) {
    return this.findByIdService.findById(id, companyId);
  }

  @Patch(':id')
  @Version('1')
  @ApiOperation({
    summary: 'Update employee',
    description: 'Updates fields and complex operations.',
  })
  @ApiParam({ name: 'id', description: 'Employee ID', type: String })
  @ApiBody({ type: EmployeeDtos.UpdateEmployeeDto })
  @ApiResponse({ status: 200, description: 'Updated' })
  @ApiResponse({ status: 404, description: 'Not found' })
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
    description: 'Changes employee status.',
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
