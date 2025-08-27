export enum EmailDomainBlacklist {
  EXAMPLE_SPAM = 'spamdomain.com',
  EXAMPLE_FAKE = 'fakedomain.com',
  EXAMPLE_TEMP = 'tempmail.com',
  EXAMPLE_DISPOSABLE = 'disposablemail.com',
  EXAMPLE_TEST = 'testmail.com',
}

export enum EmailMaxLength {
  VALUE = 254,
}

export enum EmailProvider {
  GMAIL = 'gmail.com',
  YAHOO = 'yahoo.com',
  OUTLOOK = 'outlook.com',
  HOTMAIL = 'hotmail.com',
  ICLOUD = 'icloud.com',
  AOL = 'aol.com',
  PROTONMAIL = 'protonmail.com',
  YANDEX = 'yandex.com',
}

export const EMAIL_VALIDATION_REGEX =
  /^(?:[a-zA-Z0-9_'^&/+-]+(?:\.[a-zA-Z0-9_'^&/+-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

export enum EmailValidationRule {
  REQUIRED = 'Email address is required',
  MAX_LENGTH = 'Email cannot exceed 254 characters',
  NO_WHITESPACE = 'Email cannot contain whitespace characters',
  VALID_FORMAT = 'Email must be in valid format (user@domain.com)',
  VALID_DOMAIN = 'Email must contain a valid domain part',
}
