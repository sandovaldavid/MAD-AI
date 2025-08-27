export enum LastnameAllowedChars {
  ALPHA = 'A-Za-z',
  ACCENTED = 'ÁÉÍÓÚáéíóúÑñ',
  HYPHEN = '-',
  SPACE = ' ',
}

export enum LastnameMaxLength {
  VALUE = 50,
}

export const LASTNAME_VALIDATION_REGEX = /^[\p{L}\s'\-]+$/u;

export enum LastnameValidationRule {
  REQUIRED = 'Last name is required',
  NOT_EMPTY = 'Last name must not be empty',
  MAX_LENGTH = 'Last name must be at most 50 characters',
  VALID_FORMAT = 'Last name must contain only letters, spaces, apostrophes, or hyphens',
}
