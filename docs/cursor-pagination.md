# Cursor Pagination — Guía de Integración

**API:** `https://user.lideris.com.co/user/v1/employees`
**Base path:** `/v1/employees`

---

## ¿Qué es?

Cursor pagination usa el `_id` del último documento devuelto como puntero (`cursor`) para pedir la siguiente página. A diferencia de `?page=2&pageSize=20` (offset), el cursor es:

- **Más rápido**: el `_id` tiene índice nativo, evita `skip()` costoso en colecciones grandes
- **Consistente**: si se insertan/eliminan documentos entre páginas, no se saltan ni duplican resultados
- **Estable**: el orden no cambia bajo escrituras concurrentes

---

## Query Parameters

| Param | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `pageSize` | number | 20 (max 100) | Documentos por página |
| `cursor` | string | — | `_id` del último elemento de la página anterior. La primera página **no** lleva cursor. |

---

## Response

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "pageSize": 20,
      "nextCursor": "6a076e8dbd4f50a897804854",
      "mode": "cursor"
    }
  }
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `items` | array | Resultados de la página actual |
| `pagination.pageSize` | number | Tamaño de página usado |
| `pagination.nextCursor` | string \| null | `_id` del último item. **null** = no hay más páginas |
| `pagination.mode` | string | `"cursor"` o `"offset"` |

---

## Cómo usarlo

### Primera página

No enviar `cursor`:

```
GET /v1/employees?pageSize=20
GET /v1/employees?positionTypes=doctor&pageSize=10
GET /v1/employees?q=pedro&pageSize=20
```

### Página siguiente

Tomar `nextCursor` de la respuesta anterior y pasarlo como `cursor`:

```
GET /v1/employees?pageSize=20&cursor=6a076e8dbd4f50a897804854
```

### Detectar fin

Cuando `nextCursor` es `null`, se llegó al final:

```json
{
  "pagination": {
    "nextCursor": null,
    "mode": "cursor"
  }
}
```

### Ejemplo completo en TypeScript

```typescript
async function getAllEmployees() {
  let cursor: string | null = null;
  const all: Employee[] = [];
  const pageSize = 20;

  do {
    const params = new URLSearchParams({ pageSize: String(pageSize) });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`/v1/employees?${params}`);
    const { data } = await res.json();

    all.push(...data.items);
    cursor = data.pagination.nextCursor;
  } while (cursor !== null);

  return all;
}
```

---

## Filtros compatibles

Todos los filtros funcionan con cursor pagination:

| Filtro | Ejemplo |
|--------|---------|
| Texto libre | `?q=carlos` |
| Position type | `?positionTypes=doctor,collaborator` |
| Estado | `?isActive=true` |
| Género | `?gender=MALE` |
| Estado civil | `?maritalStatus=SINGLE` |
| Búsqueda combinada | `?positionTypes=doctor&q=pedro&isActive=true` |

---

## Offset pagination (legado)

Si por compatibilidad necesitás offset, también funciona:

```
GET /v1/employees?page=1&pageSize=20
GET /v1/employees?page=2&pageSize=20
```

La respuesta en modo offset incluye:

```json
{
  "pagination": {
    "page": 2,
    "pageSize": 20,
    "total": 159,
    "totalPages": 8,
    "mode": "offset"
  }
}
```

> ⚠️ Offset **no escala** bien con colecciones grandes. Preferí cursor.

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `PAGINATION_CURSOR_INVALID` | `cursor` no es un ObjectId válido | Verificá que estás pasando el `_id` exacto del último item |
| `PAGINATION_USE_CURSOR` | Superaste el umbral de skip con offset | Cambiá a `?cursor=...` |
| No hay `nextCursor` en modo offset | Es normal — `nextCursor` solo aparece en modo cursor | Usá `page`/`total`/`totalPages` en su lugar |
