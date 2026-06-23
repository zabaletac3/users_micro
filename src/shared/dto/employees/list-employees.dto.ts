import type { HybridPaginatedQueryLike } from '@shared/criteria';

/**
 * DTO for listing employees. Extends the generic hybrid query interface
 * so that query-string parameters are automatically parsed by buildCriteria().
 */

export interface ListEmployeesDto extends HybridPaginatedQueryLike {}

/**
 * Sub-pagination for employee detail (documents, history, statusHistory).
 */
export class SubPaginationEmployeeDto {
  historyLimit?: number;
  historySkip?: number;
  documentLimit?: number;
  documentSkip?: number;
  statusHistoryLimit?: number;
  statusHistorySkip?: number;
  historySearch?: string;
  documentSearch?: string;
  statusHistorySearch?: string;
}
