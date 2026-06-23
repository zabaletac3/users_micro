import type { CriteriaSchema } from '@shared/criteria';

export const employeesCriteria: CriteriaSchema = {
  filters: {
    name: { path: 'name', type: 'string' },
    lastName: { path: 'lastName', type: 'string' },
    email: { path: 'email', type: 'string' },
    documentNumber: { path: 'documentNumber', type: 'string' },
    documentType: { path: 'documentType', type: 'string' },
    isActive: { path: 'isActive', type: 'boolean' },
    gender: { path: 'gender', type: 'string' },
    maritalStatus: { path: 'maritalStatus', type: 'string' },
    position: { path: 'position', type: 'objectId', multi: true },
    departmentIds: { path: 'departmentIds', type: 'objectId', multi: true },
    areaIds: { path: 'areaIds', type: 'objectId', multi: true },
    serial: { path: 'serial', type: 'string' },
  },
  dateRanges: [{ path: 'hiringDate', prefix: 'hiringDate' }],
  searchable: [
    'name',
    'lastName',
    'email',
    'userName',
    'phone',
    'documentNumber',
    'fullName',
    'serial',
  ],
  sortable: ['name', 'lastName', 'email', 'documentNumber', 'createdAt', 'hiringDate'],
  defaultSort: [{ field: 'createdAt', dir: -1 }],
  defaultPageSize: 20,
  maxPageSize: 100,
};
