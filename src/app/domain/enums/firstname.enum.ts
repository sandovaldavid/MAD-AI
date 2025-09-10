export enum FirstnameAllowedChars {
  ALPHA = 'A-Za-z',
  ACCENTED = 'ÁÉÍÓÚáéíóúÑñ',
  HYPHEN = '-',
  SPACE = ' ',
}

export const FIRSTNAME_COMMON_NICKNAMES: Record<string, string[]> = {
  alexander: ['Alex', 'Al', 'Xander'],
  elizabeth: ['Liz', 'Beth', 'Lizzy', 'Betty'],
  christopher: ['Chris', 'Kit'],
  david: ['Dave', 'Davy'],
};

export enum FirstnameMaxLength {
  VALUE = 50,
}

export const FIRSTNAME_VALIDATION_REGEX = /^[\p{L}\s'-]+$/u;

export enum FirstnameValidationRule {
  REQUIRED = 'First name is required',
  NOT_EMPTY = 'First name must not be empty',
  MAX_LENGTH = 'First name must be at most 50 characters',
  VALID_FORMAT = 'First name must contain only letters, spaces, apostrophes, or hyphens',
}
