import { NextResponse } from 'next/server';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/**
 * Return safe error responses without leaking PostgreSQL internals
 * (SQL text, constraint names, column/table details, etc.).
 */
export function sendError(err: unknown) {
  console.error(err);
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const anyErr = err as any;
  const isDbError =
    typeof anyErr?.code === 'string' &&
    Boolean(anyErr?.severity || anyErr?.routine || anyErr?.detail || anyErr?.constraint);

  return NextResponse.json(
    {
      error: isDbError
        ? 'Internal server error.'
        : anyErr?.message || 'Internal server error.',
    },
    { status: 500 }
  );
}

export function parsePositiveInt(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}
