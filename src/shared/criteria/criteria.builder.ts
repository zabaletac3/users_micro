import type {
  CriteriaSchema,
  FilterFieldDescriptor,
  PaginatedResponse,
  PaginationParams,
  SortParam,
  HybridPaginatedResponse,
  HybridPaginationParams,
} from './pagination.types';

import { HttpException, HttpStatus } from '@nestjs/common';
import { FilterQuery, Model, Types } from 'mongoose';

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_MAX_PAGE_SIZE = 100;

export interface HybridPaginatedQueryLike {
  // Offset pagination
  page?: number | string;
  pageSize?: number | string;
  // Cursor pagination
  cursor?: string;
  // Sorting and filtering
  sort?: string;
  q?: string;
  /** All the resource-specific filter fields the caller passed. */
  [k: string]: unknown;
}

// Backward compatibility alias
export type PaginatedQueryLike = HybridPaginatedQueryLike;

export interface BuiltCriteria<T> {
  filter: FilterQuery<T>;
  sort: SortParam[];
  // Hybrid pagination
  paginationMode: 'offset' | 'cursor';
  page?: number;
  pageSize: number;
  cursor?: Types.ObjectId;
}

/**
 * Combines a parsed query DTO + the resource's whitelist into the shape the
 * service actually executes against Mongo.
 */
export function buildCriteria<T>(
  query: HybridPaginatedQueryLike,
  schema: CriteriaSchema,
): BuiltCriteria<T> {
  // Determine pagination mode
  const hasCursor = query.cursor != null && query.cursor !== '';
  const hasPage = query.page != null && query.page !== '';

  // Force cursor if schema specifies it or if we have cursor param
  let paginationMode: 'offset' | 'cursor' = 'offset';

  if (schema.cursorOnly || hasCursor) {
    paginationMode = 'cursor';
  } else if (hasPage && !hasCursor) {
    paginationMode = 'offset';
  }

  // Parse pagination params
  const { page, pageSize } = parsePagination(query, schema);
  let cursor: Types.ObjectId | undefined;

  if (paginationMode === 'cursor' && hasCursor) {
    if (!Types.ObjectId.isValid(query.cursor!)) {
      throw new HttpException('PAGINATION_CURSOR_INVALID', HttpStatus.BAD_REQUEST);
    }
    cursor = new Types.ObjectId(query.cursor);
  }

  // Check if we should force cursor pagination due to threshold
  if (paginationMode === 'offset' && schema.forceCursorThreshold) {
    const estimatedSkip = ((page ?? 1) - 1) * pageSize;

    if (estimatedSkip >= schema.forceCursorThreshold) {
      throw new HttpException('PAGINATION_USE_CURSOR', HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  const sort = parseSort(query.sort, schema);
  const filter: FilterQuery<T> = {};

  // Rest of filter logic remains the same...
  for (const [name, descriptor] of Object.entries(schema.filters)) {
    const raw = query[name];

    if (raw == null || raw === '') continue;
    const condition = applyFilter(name, raw, descriptor);

    if (condition !== undefined) {
      (filter as Record<string, unknown>)[descriptor.path] = condition;
    }
  }

  // Date ranges logic
  if (schema.dateRanges?.length) {
    for (const range of schema.dateRanges) {
      const from = query[`${range.prefix}From`];
      const to = query[`${range.prefix}To`];
      const condition = parseDateRange(range.prefix, from, to);

      if (condition) {
        (filter as Record<string, unknown>)[range.path] = condition;
      }
    }
  }

  // Free-text search logic
  if (typeof query.q === 'string' && query.q.trim() && schema.searchable?.length) {
    const term = query.q.trim();
    const regex = new RegExp(escapeRegex(term), 'i');
    const or = schema.searchable.map((field) => ({ [field]: regex }));

    (filter as Record<string, unknown>).$or = or;
  }

  return {
    filter,
    sort,
    paginationMode,
    page: paginationMode === 'offset' ? page : undefined,
    pageSize,
    cursor,
  };
}

/**
 * Runs cursor or offset pagination and wraps the result in the hybrid response format.
 * Automatically detects mode from built criteria and responds appropriately.
 */
export async function paginate<T>(
  model: Model<T>,
  built: BuiltCriteria<T>,
  options?: { projection?: Record<string, 0 | 1>; lean?: boolean },
): Promise<HybridPaginatedResponse<T>> {
  const { filter, sort, paginationMode, page, pageSize, cursor } = built;
  const sortSpec: Record<string, 1 | -1> = {};

  for (const s of sort) sortSpec[s.field] = s.dir;

  if (paginationMode === 'cursor') {
    // Cursor pagination
    const query: FilterQuery<T> = { ...filter };

    if (cursor) {
      (query as any)._id = { $lt: cursor };
    }

    const items = await model
      .find(query, options?.projection ?? null)
      .sort(sortSpec)
      .limit(pageSize + 1)
      .lean(options?.lean !== false)
      .exec();

    const hasMore = items.length > pageSize;
    const resultItems = hasMore ? items.slice(0, pageSize) : items;
    const nextCursor =
      hasMore && resultItems.length > 0
        ? String((resultItems[resultItems.length - 1] as any)._id)
        : null;

    return {
      items: resultItems as unknown as T[],
      pagination: {
        pageSize,
        nextCursor,
        mode: 'cursor' as const,
      },
    };
  } else {
    // Offset pagination
    const skip = ((page ?? 1) - 1) * pageSize;
    const cursor = model
      .find(filter, options?.projection ?? null)
      .sort(sortSpec)
      .skip(skip)
      .limit(pageSize);

    if (options?.lean !== false) cursor.lean();

    const [items, total] = await Promise.all([cursor.exec(), model.countDocuments(filter).exec()]);

    return {
      items: items as unknown as T[],
      pagination: {
        pageSize,
        page: page ?? 1,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
        mode: 'offset' as const,
      },
    };
  }
}

function parsePagination(
  query: HybridPaginatedQueryLike,
  schema: CriteriaSchema,
): PaginationParams {
  const max = schema.maxPageSize ?? DEFAULT_MAX_PAGE_SIZE;
  const defaultSize = schema.defaultPageSize ?? DEFAULT_PAGE_SIZE;
  const page = clampInt(query.page, 1, Number.MAX_SAFE_INTEGER, 1);
  const pageSize = clampInt(query.pageSize, 1, max, defaultSize);

  return { page, pageSize };
}

function parseSort(raw: string | undefined, schema: CriteriaSchema): SortParam[] {
  if (!raw) return [...schema.defaultSort];

  const parts = raw.split(',');
  const result: SortParam[] = [];

  for (const part of parts) {
    const [field, dirRaw] = part.split(':');

    if (!field) continue;
    if (!schema.sortable.includes(field)) {
      throw new HttpException(`SORT_FIELD_NOT_ALLOWED:${field}`, HttpStatus.BAD_REQUEST);
    }
    const dir: 1 | -1 = dirRaw === 'asc' ? 1 : dirRaw === 'desc' ? -1 : -1;

    result.push({ field, dir });
  }

  return result.length ? result : [...schema.defaultSort];
}

function applyFilter(name: string, raw: unknown, descriptor: FilterFieldDescriptor): unknown {
  // Boolean fields accept `true`/`false` strings or actual booleans.
  if (descriptor.type === 'boolean') {
    const coerced = coerceBoolean(raw);

    return coerced === undefined ? undefined : coerced;
  }

  const rawStr = Array.isArray(raw) ? raw.join(',') : String(raw);

  if (descriptor.multi && rawStr.includes(',')) {
    const values = rawStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((v) => coerceScalar(v, descriptor, name));

    return values.length > 1 ? { $in: values } : values[0];
  }

  return coerceScalar(rawStr, descriptor, name);
}

function coerceScalar(value: string, descriptor: FilterFieldDescriptor, name: string): unknown {
  switch (descriptor.type) {
    case 'number': {
      const n = Number(value);

      if (Number.isNaN(n)) {
        throw new HttpException(`FILTER_INVALID_NUMBER:${name}`, HttpStatus.BAD_REQUEST);
      }

      return n;
    }
    case 'date': {
      const d = new Date(value);

      if (Number.isNaN(d.getTime())) {
        throw new HttpException(`FILTER_INVALID_DATE:${name}`, HttpStatus.BAD_REQUEST);
      }

      return d;
    }
    case 'objectId': {
      if (!Types.ObjectId.isValid(value)) {
        throw new HttpException(`FILTER_INVALID_OBJECT_ID:${name}`, HttpStatus.BAD_REQUEST);
      }

      return new Types.ObjectId(value);
    }
    case 'enum': {
      if (descriptor.values && !descriptor.values.includes(value)) {
        throw new HttpException(`FILTER_INVALID_ENUM:${name}`, HttpStatus.BAD_REQUEST);
      }

      return value;
    }
    case 'string':
    default:
      return value;
  }
}

function parseDateRange(prefix: string, from: unknown, to: unknown): unknown {
  const condition: Record<string, Date> = {};

  if (typeof from === 'string' && from) {
    const d = new Date(from);

    if (Number.isNaN(d.getTime())) {
      throw new HttpException(`FILTER_INVALID_DATE:${prefix}From`, HttpStatus.BAD_REQUEST);
    }
    condition.$gte = d;
  }
  if (typeof to === 'string' && to) {
    const d = new Date(to);

    if (Number.isNaN(d.getTime())) {
      throw new HttpException(`FILTER_INVALID_DATE:${prefix}To`, HttpStatus.BAD_REQUEST);
    }
    condition.$lte = d;
  }

  return Object.keys(condition).length ? condition : undefined;
}

function clampInt(raw: unknown, min: number, max: number, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);

  if (!Number.isFinite(n) || Number.isNaN(n)) return fallback;
  const intN = Math.trunc(n);

  if (intN < min) return min;
  if (intN > max) return max;

  return intN;
}

function coerceBoolean(raw: unknown): boolean | undefined {
  if (typeof raw === 'boolean') return raw;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;

  return undefined;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
