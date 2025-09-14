import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';
import { FieldError } from '../errors/field-error.type';

/**
 * Export Format Value Object
 *
 * Represents valid export formats and encapsulates the business rules
 * for what formats are supported in the system. This VO contains the
 * domain knowledge about export capabilities and format validation.
 *
 * **Business Rules:**
 * - Supported formats are determined by business requirements
 * - CSV format is the default for compatibility
 * - PDF format is available for presentation-ready exports
 * - JSON format is available for programmatic consumption
 *
 * **Invariants:**
 * - Format must be one of the supported values
 * - Format values are case-sensitive
 * - Format cannot be null or empty
 *
 * @example
 * ```typescript
 * // Create with validation
 * const csvFormat = ExportFormat.create('csv');
 * const pdfFormat = ExportFormat.create('pdf');
 *
 * // Check supported formats
 * const isSupported = ExportFormat.isSupported('json'); // true
 * const formats = ExportFormat.getSupportedFormats(); // ['csv', 'pdf', 'json']
 *
 * // Default format
 * const defaultFormat = ExportFormat.default(); // csv
 * ```
 *
 * @since 1.0.0
 * @author MAD-AI Development Team
 * @layer Domain
 */
export class ExportFormat {
  private constructor(public readonly value: string) {}

  /**
   * Business rule: Supported export formats based on system capabilities
   * These formats represent the business requirements for data export
   */
  private static readonly SUPPORTED_FORMATS = ['csv', 'pdf', 'json'] as const;

  /**
   * Business rule: Default format for exports when none specified
   */
  private static readonly DEFAULT_FORMAT = 'csv';


  /**
   * Creates a validated ExportFormat value object.
   *
   * @param format - The export format string to validate
   * @returns A validated ExportFormat instance
   * @throws {ValidationError} When format is not supported
   */
  static create(format: string): ExportFormat {
    if (!format || typeof format !== 'string') {
      throw ValidationError.fromMessage(
        'Export format cannot be null or empty',
        'exportFormat',
        ValidationErrorCode.REQUIRED_FIELD_MISSING
      );
    }

    const normalizedFormat = format.trim().toLowerCase();

    if (!this.isSupported(normalizedFormat)) {
      const errors: FieldError[] = [{
        field: 'exportFormat',
        value: format,
        message: `Invalid export format. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`,
        code: ValidationErrorCode.FIELD_FORMAT_INVALID,
      }];

      throw ValidationError.createFromFields(errors, ValidationErrorCode.VALIDATION_ERROR);
    }

    return new ExportFormat(normalizedFormat);
  }

  /**
   * Creates an ExportFormat with the default business format.
   *
   * @returns ExportFormat with default format (CSV)
   */
  static default(): ExportFormat {
    return new ExportFormat(this.DEFAULT_FORMAT);
  }

  /**
   * Checks if a format string is supported by the system.
   * This method encapsulates the business knowledge of supported formats.
   *
   * @param format - The format string to check
   * @returns True if the format is supported
   */
  static isSupported(format: string): boolean {
    if (!format || typeof format !== 'string') {
      return false;
    }

    const normalizedFormat = format.trim().toLowerCase();
    return (this.SUPPORTED_FORMATS as readonly string[]).includes(normalizedFormat);
  }

  /**
   * Gets all supported export formats.
   * This provides access to the business rules about available formats.
   *
   * @returns Array of supported format strings
   */
  static getSupportedFormats(): readonly string[] {
    return [...this.SUPPORTED_FORMATS];
  }

  /**
   * Checks if this format is the default format.
   *
   * @returns True if this is the default export format
   */
  isDefault(): boolean {
    return this.value === ExportFormat.DEFAULT_FORMAT;
  }

  /**
   * Checks if this format supports binary data.
   * This represents business knowledge about format capabilities.
   *
   * @returns True if format supports binary data (PDF)
   */
  supportsBinaryData(): boolean {
    return this.value === 'pdf';
  }

  /**
   * Checks if this format is human-readable.
   * This represents business knowledge about format characteristics.
   *
   * @returns True if format is human-readable (CSV, JSON)
   */
  isHumanReadable(): boolean {
    return this.value === 'csv' || this.value === 'json';
  }

  /**
   * Gets the MIME type for this export format.
   * This provides technical mapping based on business format choice.
   *
   * @returns MIME type string for the format
   */
  getMimeType(): string {
    switch (this.value) {
      case 'csv':
        return 'text/csv';
      case 'pdf':
        return 'application/pdf';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Gets the file extension for this export format.
   *
   * @returns File extension with dot prefix
   */
  getFileExtension(): string {
    return `.${this.value}`;
  }

  /**
   * Checks value equality with another ExportFormat.
   *
   * @param other - The other ExportFormat to compare
   * @returns True if both have the same format value
   */
  equals(other: ExportFormat): boolean {
    return this.value === other.value;
  }

  /**
   * Returns the string representation of the export format.
   *
   * @returns The format value as string
   */
  toString(): string {
    return this.value;
  }
}