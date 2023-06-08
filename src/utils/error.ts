// eslint-disable-next-line import/prefer-default-export
export function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}
