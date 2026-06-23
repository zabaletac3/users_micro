export const EMPLOYEE_PROJECTION = {
  loginHistory: 0,
  password: 0,
  permissions: 0,
} as const;

export const EMPLOYEE_POPULATE = [
  {
    path: 'position',
    select: 'name _id',
  },
  {
    path: 'departmentIds',
    select: 'name _id',
  },
  {
    path: 'areaIds',
    select: 'name _id',
  },
];

// Trace actions for employee operations
export const EMPLOYEE_TRACE_ACTION = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const;

// Trace event codes for employee operations
export const EMPLOYEE_TRACE_EVENTS = {
  CREATED: 'EMPLOYEE_CREATED',
  UPDATED: 'EMPLOYEE_UPDATED',
  ACTIVATED: 'EMPLOYEE_ACTIVATED',
  DEACTIVATED: 'EMPLOYEE_DEACTIVATED',
} as const;
