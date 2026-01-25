export class InvalidIdError extends Error {
  statusCode = 400;
  code = 'INVALID_ID';
  constructor() {
    super('Invalid ID parameter');
  }
}

export function parseId(value: string | string[]): number {
  const str = Array.isArray(value) ? value[0] : value;
  const id = parseInt(str, 10);
  if (isNaN(id) || id <= 0) {
    throw new InvalidIdError();
  }
  return id;
}
