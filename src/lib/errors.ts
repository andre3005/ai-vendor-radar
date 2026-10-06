interface PgLikeError { code?: string; message?: string }

export function friendlyError(err: unknown): string {
  const e = (err ?? {}) as PgLikeError
  switch (e.code) {
    case '23505': return 'A vendor (or criterion) with this name already exists.'
    case '23514':
      return e.message?.includes('fine_only_for_fines')
        ? 'A fine amount is only allowed for regulatory fines.'
        : 'One of the values is outside the allowed range.'
    case '42501': return "This field can't be changed in the demo."
    case '28000': return 'Wrong PIN.'
  }
  return 'The database is not reachable right now. Try again in a minute.'
}
