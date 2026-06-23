/**
 * Generic pagination + Criteria contract shared by every list endpoint.
 *
 * The transport layer hands the controller a parsed query DTO; the service
 * passes that DTO + a per-resource `CriteriaSchema` to `buildCriteria()` and
 * gets back a `{ filter, sort, page, pageSize }` tuple ready for Mongoose.
 *
 * The response always has the same envelope so the frontend can ship a single
 * `PaginatedResponse<T>` viewmodel and reuse the same Table component for
 * every resource. `hasMore` is intentionally NOT a separate field — the client
 * derives it as `page < totalPages`.
 */

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParam {
  field: string;
  dir: 1 | -1;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

// Cursor pagination interfaces
export interface CursorPaginationParams {
  cursor?: string;
  pageSize: number;
}

export interface CursorPaginationMeta {
  pageSize: number;
  nextCursor: string | null;
  mode: 'cursor';
}

export interface HybridPaginationParams {
  // Offset pagination
  page?: number;
  pageSize?: number;
  // Cursor pagination
  cursor?: string;
}

export interface HybridPaginationMeta {
  pageSize: number;
  // Offset fields (when mode = 'offset')
  page?: number;
  total?: number;
  totalPages?: number;
  // Cursor fields (when mode = 'cursor')
  nextCursor?: string | null;
  mode: 'offset' | 'cursor';
}

export interface HybridPaginatedResponse<T> {
  items: T[];
  pagination: HybridPaginationMeta;
}

// Constants
export const CURSOR_PAGINATION_THRESHOLD = 1000;
export const DEFAULT_CURSOR_PAGE_SIZE = 20;
export const MAX_CURSOR_PAGE_SIZE = 100;

/** Type of a filter field. Used to coerce string query params to the right JS type. */
export type FilterFieldType = 'string' | 'number' | 'boolean' | 'date' | 'objectId' | 'enum';

export interface FilterFieldDescriptor {
  /** Mongo path the value applies to (may differ from the query-string name). */
  path: string;
  type: FilterFieldType;
  /** When `true`, comma-separated values become a `$in` query. */
  multi?: boolean;
  /** For `enum`: the closed set of accepted values. */
  values?: readonly string[];
}

export interface DateRangeDescriptor {
  /** Mongo path. */
  path: string;
  /** Query-string prefix — the controller accepts `<prefix>From` and `<prefix>To`. */
  prefix: string;
}

/**
 * Per-resource Criteria contract. Lives next to the service and acts as the
 * whitelist: anything not declared here is rejected by Joi and ignored by the
 * builder, so the URL surface is intentional, not "whatever the client passes".
 */
export interface CriteriaSchema {
  /** Map of `query-param-name` → descriptor of how to apply it. */
  filters: Record<string, FilterFieldDescriptor>;
  /** Date-range pairs (`<prefix>From` / `<prefix>To`). */
  dateRanges?: DateRangeDescriptor[];
  /** Sortable Mongo paths. */
  sortable: readonly string[];
  /** Mongo paths used by free-text `q` search (case-insensitive partial match). */
  searchable?: readonly string[];
  /** Applied when the caller does not pass `sort`. */
  defaultSort: SortParam[];

  // Hybrid pagination support (NEW FIELDS)
  /** Bounds for offset pagination. */
  maxPageSize?: number;
  defaultPageSize?: number;
  /** Force cursor pagination when result set exceeds this threshold */
  forceCursorThreshold?: number;
  /** When true, only allow cursor pagination (no offset fallback) */
  cursorOnly?: boolean;
}
