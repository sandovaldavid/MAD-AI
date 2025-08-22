import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * FirstName Value Object
 *
 * Represents a validated first name according to international naming conventions.
 * Ensures proper formatting, cultural sensitivity, and provides domain-specific
 * behavior for personal name operations.
 *
 * **Domain Rules:**
 * - Must be between 1 and 50 characters in length
 * - Can only contain letters, spaces, apostrophes, and hyphens
 * - Automatically formatted with proper capitalization
 * - Trims leading and trailing whitespace
 * - Supports international characters (Unicode letters)
 *
 * **Business Rules:**
 * - Used for personal identification and communication
 * - Must be appropriate for legal and professional contexts
 * - Should respect cultural naming conventions
 * - Part of user's personal identity in the system
 * - Used for generating display names and formal addresses
 *
 * **Cultural Considerations:**
 * - Supports compound names with hyphens (Jean-Claude)
 * - Supports names with apostrophes (O'Brien, D'Angelo)
 * - Supports multiple words (Mary Jane)
 * - Handles international characters (José, François, Björn)
 *
 * @example
 * ```typescript
 * // Valid first name creation
 * const firstName = FirstName.create('john');
 * console.log(firstName.value); // 'John'
 * console.log(firstName.getInitials()); // 'J'
 * console.log(firstName.isCompound()); // false
 *
 * // Compound names
 * const compoundName = FirstName.create('jean-claude');
 * console.log(compoundName.value); // 'Jean-Claude'
 * console.log(compoundName.isCompound()); // true
 *
 * // International names
 * const internationalName = FirstName.create('josé');
 * console.log(internationalName.value); // 'José'
 * console.log(internationalName.hasAccents()); // true
 *
 * // Invalid first name throws ValidationError
 * try {
 *   FirstName.create('123John'); // Contains numbers
 * } catch (error) {
 *   console.log(error.message); // 'First name must contain only letters, spaces, apostrophes, or hyphens'
 * }
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/Personal_name | Personal Name Conventions}
 */
export class FirstName {
    private constructor(public readonly value: string) {}

    /**
     * Creates a validated FirstName value object from a raw string.
     *
     * Performs comprehensive validation and normalization:
     * - Trims whitespace and applies proper capitalization
     * - Validates length constraints (1-50 characters)
     * - Ensures only valid characters (letters, spaces, apostrophes, hyphens)
     * - Handles international characters and naming conventions
     * - Applies title case formatting for readability
     *
     * @param raw - The raw first name string to validate
     * @returns A validated and formatted FirstName instance
     * @throws {ValidationError} When validation fails, containing all validation errors
     *
     * @example
     * ```typescript
     * // Successful creation with normalization
     * const firstName = FirstName.create('  john  ');
     * console.log(firstName.value); // 'John'
     *
     * // Compound name formatting
     * const compound = FirstName.create('mary-jane');
     * console.log(compound.value); // 'Mary-Jane'
     *
     * // Multiple words formatting
     * const multiWord = FirstName.create('mary elizabeth');
     * console.log(multiWord.value); // 'Mary Elizabeth'
     *
     * // Validation error for invalid characters
     * try {
     *   FirstName.create('John123');
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_FORMAT_INVALID
     * }
     *
     * // Validation error for length
     * try {
     *   FirstName.create('a'.repeat(51)); // Too long
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_TOO_LONG
     * }
     * ```
     */
    static create(raw: string): FirstName {
        const errors: Array<{
            field: string;
            value: unknown;
            message: string;
            code?: ValidationErrorCode;
        }> = [];

        if (!raw || typeof raw !== 'string') {
            errors.push({
                field: 'firstName',
                value: raw,
                message: 'First name is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (typeof raw === 'string') {
            const normalized = raw.trim();

            if (normalized.length < 1) {
                errors.push({
                    field: 'firstName',
                    value: normalized,
                    message: 'First name must not be empty',
                    code: ValidationErrorCode.FIELD_TOO_SHORT,
                });
            }

            if (normalized.length > FirstNameSpecs.MAX_LENGTH) {
                errors.push({
                    field: 'firstName',
                    value: normalized,
                    message: `First name must be at most ${FirstNameSpecs.MAX_LENGTH} characters`,
                    code: ValidationErrorCode.FIELD_TOO_LONG,
                });
            }

            // Enhanced pattern to support international characters
            if (normalized.length > 0 && !FirstNameSpecs.VALIDATION_REGEX.test(normalized)) {
                errors.push({
                    field: 'firstName',
                    value: normalized,
                    message:
                        'First name must contain only letters, spaces, apostrophes, or hyphens',
                    code: ValidationErrorCode.FIELD_FORMAT_INVALID,
                });
            }
        }

        if (errors.length) {
            throw ValidationError.createFromFields(errors);
        }

        // Apply proper formatting
        const formatted = FirstNameUtils.formatName(raw.trim());
        return new FirstName(formatted);
    }

    /**
     * Checks value equality with another FirstName instance.
     *
     * Two FirstName instances are considered equal if their formatted values match.
     * Comparison is case-sensitive after normalization.
     *
     * @param other - The other FirstName instance to compare
     * @returns True if both first names have the same formatted value
     *
     * @example
     * ```typescript
     * const firstName1 = FirstName.create('john');
     * const firstName2 = FirstName.create('JOHN');
     * console.log(firstName1.equals(firstName2)); // true (both formatted as 'John')
     *
     * const firstName3 = FirstName.create('jane');
     * console.log(firstName1.equals(firstName3)); // false
     * ```
     */
    equals(other: FirstName): boolean {
        return this.value === other.value;
    }

    /**
     * Returns the string representation of the first name.
     *
     * @returns The formatted first name string
     *
     * @example
     * ```typescript
     * const firstName = FirstName.create('john');
     * console.log(firstName.toString()); // 'John'
     * console.log(`Hello ${firstName}`); // 'Hello John'
     * ```
     */
    toString(): string {
        return this.value;
    }

    /**
     * Gets the initials from the first name.
     *
     * Returns the first letter of each word in the name, useful for
     * creating monograms or abbreviated display names.
     *
     * @returns The initials as a string
     *
     * @example
     * ```typescript
     * const firstName = FirstName.create('John');
     * console.log(firstName.getInitials()); // 'J'
     *
     * const compoundName = FirstName.create('Mary Jane');
     * console.log(compoundName.getInitials()); // 'MJ'
     *
     * const hyphenatedName = FirstName.create('Jean-Claude');
     * console.log(hyphenatedName.getInitials()); // 'JC'
     * ```
     */
    getInitials(): string {
        return this.value
            .split(/[\s\-]+/)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }

    /**
     * Gets the length of the first name.
     *
     * @returns The character count of the first name
     *
     * @example
     * ```typescript
     * const firstName = FirstName.create('John');
     * console.log(firstName.getLength()); // 4
     * ```
     */
    getLength(): number {
        return this.value.length;
    }

    /**
     * Checks if the first name is compound (contains hyphens or multiple words).
     *
     * @returns True if the name contains hyphens or spaces
     *
     * @example
     * ```typescript
     * const simpleName = FirstName.create('John');
     * console.log(simpleName.isCompound()); // false
     *
     * const hyphenatedName = FirstName.create('Jean-Claude');
     * console.log(hyphenatedName.isCompound()); // true
     *
     * const multiWordName = FirstName.create('Mary Jane');
     * console.log(multiWordName.isCompound()); // true
     * ```
     */
    isCompound(): boolean {
        return /[\s\-]/.test(this.value);
    }

    /**
     * Checks if the first name contains accented characters.
     *
     * Useful for handling international names that may require special
     * processing or display considerations.
     *
     * @returns True if the name contains accented characters
     *
     * @example
     * ```typescript
     * const regularName = FirstName.create('John');
     * console.log(regularName.hasAccents()); // false
     *
     * const accentedName = FirstName.create('José');
     * console.log(accentedName.hasAccents()); // true
     *
     * const frenchName = FirstName.create('François');
     * console.log(frenchName.hasAccents()); // true
     * ```
     */
    hasAccents(): boolean {
        return /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(this.value);
    }

    /**
     * Checks if the first name contains an apostrophe.
     *
     * Common in names like O'Brien, D'Angelo, or similar cultural naming patterns.
     *
     * @returns True if the name contains an apostrophe
     *
     * @example
     * ```typescript
     * const regularName = FirstName.create('John');
     * console.log(regularName.hasApostrophe()); // false
     *
     * const irishName = FirstName.create("O'Brien");
     * console.log(irishName.hasApostrophe()); // true
     * ```
     */
    hasApostrophe(): boolean {
        return this.value.includes("'");
    }

    /**
     * Gets the phonetic representation using Soundex algorithm.
     *
     * Useful for name matching and search functionality where pronunciation
     * matters more than exact spelling.
     *
     * @returns The Soundex code for the first name
     *
     * @example
     * ```typescript
     * const name1 = FirstName.create('John');
     * const name2 = FirstName.create('Jon');
     * console.log(name1.getSoundex()); // 'J500'
     * console.log(name2.getSoundex()); // 'J500'
     * console.log(name1.getSoundex() === name2.getSoundex()); // true (similar pronunciation)
     * ```
     */
    getSoundex(): string {
        return FirstNameUtils.generateSoundex(this.value);
    }

    /**
     * Creates a shortened version of the name for display purposes.
     *
     * Useful for UI components with limited space or where brevity is preferred.
     *
     * @param maxLength - Maximum length for the shortened name (default: 10)
     * @returns A shortened version of the name
     *
     * @example
     * ```typescript
     * const longName = FirstName.create('Alexander');
     * console.log(longName.getShortened(4)); // 'Alex'
     *
     * const compoundName = FirstName.create('Mary Elizabeth');
     * console.log(compoundName.getShortened(8)); // 'Mary E.'
     * ```
     */
    getShortened(maxLength: number = 10): string {
        if (this.value.length <= maxLength) {
            return this.value;
        }

        // For compound names, try to abbreviate later parts
        if (this.isCompound()) {
            const parts = this.value.split(/[\s\-]+/);
            if (parts.length > 1) {
                const firstPart = parts[0];
                if (firstPart.length <= maxLength - 2) {
                    return `${firstPart} ${parts[1].charAt(0)}.`;
                }
            }
        }

        // Truncate and add ellipsis
        return this.value.substring(0, maxLength - 1) + '…';
    }

    /**
     * Generates common nickname variations for the first name.
     *
     * Useful for search functionality or providing friendly alternatives.
     *
     * @returns Array of common nicknames for the name
     *
     * @example
     * ```typescript
     * const firstName = FirstName.create('Alexander');
     * console.log(firstName.getNicknames()); // ['Alex', 'Al', 'Xander']
     *
     * const firstName2 = FirstName.create('Elizabeth');
     * console.log(firstName2.getNicknames()); // ['Liz', 'Beth', 'Lizzy', 'Betty']
     * ```
     */
    getNicknames(): string[] {
        const name = this.value.toLowerCase();
        return FirstNameSpecs.COMMON_NICKNAMES[name] || [];
    }
}

/**
 * FirstName Value Object Specifications
 *
 * Defines the business rules, validation constraints, and behavioral specifications
 * for the FirstName value object. Used for testing, documentation, and validation.
 */
export namespace FirstNameSpecs {
    /**
     * Maximum allowed length for first names
     */
    export const MAX_LENGTH = 50;

    /**
     * Regular expression for first name validation (letters, spaces, apostrophes, hyphens, international characters)
     */
    export const VALIDATION_REGEX = /^[\p{L}\s'\-]+$/u;

    /**
     * Validation rules applied during first name creation
     */
    export const VALIDATION_RULES = {
        REQUIRED: 'First name is required',
        NOT_EMPTY: 'First name must not be empty',
        MAX_LENGTH: `First name must be at most ${MAX_LENGTH} characters`,
        VALID_FORMAT: 'First name must contain only letters, spaces, apostrophes, or hyphens',
        NO_NUMBERS: 'First name cannot contain numbers',
        NO_SPECIAL_CHARS:
            'First name cannot contain special characters except apostrophes and hyphens',
    } as const;

    /**
     * Business rules for first name usage in the domain
     */
    export const BUSINESS_RULES = {
        PERSONAL_IDENTIFICATION: 'First name is used for personal identification',
        FORMAL_ADDRESS: 'First name is used in formal communications',
        DISPLAY_NAME: 'First name contributes to user display names',
        CULTURAL_SENSITIVITY: 'First name handling must respect cultural naming conventions',
        PROFESSIONAL_CONTEXT: 'First name must be appropriate for professional use',
    } as const;

    /**
     * Common nicknames mapping for popular first names
     */
    export const COMMON_NICKNAMES: Record<string, string[]> = {
        alexander: ['Alex', 'Al', 'Xander'],
        alexandra: ['Alex', 'Lexa', 'Sandra'],
        elizabeth: ['Liz', 'Beth', 'Lizzy', 'Betty'],
        christopher: ['Chris', 'Kit'],
        catherine: ['Cat', 'Kate', 'Cathy'],
        nicholas: ['Nick', 'Nicky'],
        patricia: ['Pat', 'Patty', 'Tricia'],
        michael: ['Mike', 'Mickey'],
        michelle: ['Mich', 'Mickey'],
        william: ['Bill', 'Will', 'Willie'],
        benjamin: ['Ben', 'Benny'],
        jennifer: ['Jen', 'Jenny'],
        jonathan: ['Jon', 'Johnny'],
        stephanie: ['Steph', 'Steffi'],
        matthew: ['Matt', 'Matty'],
        margaret: ['Maggie', 'Peggy', 'Meg'],
        anthony: ['Tony', 'Ant'],
        rebecca: ['Becca', 'Becky'],
        joshua: ['Josh'],
        jessica: ['Jess', 'Jessie'],
    };
}

/**
 * FirstName utility functions for common operations
 */
export namespace FirstNameUtils {
    /**
     * Validates if a string could be a valid first name without creating the value object
     *
     * @param value - The string to validate
     * @returns True if the string appears to be a valid first name format
     */
    export function isValidFormat(value: string): boolean {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return false;
        }

        const normalized = value.trim();

        if (normalized.length > FirstNameSpecs.MAX_LENGTH) {
            return false;
        }

        return FirstNameSpecs.VALIDATION_REGEX.test(normalized);
    }

    /**
     * Formats a name string with proper capitalization
     *
     * @param value - The name string to format
     * @returns The formatted name string
     */
    export function formatName(value: string): string {
        if (!value || typeof value !== 'string') {
            return '';
        }

        return value
            .trim()
            .split(/(\s+|\-+)/)
            .map((part) => {
                if (/^\s|\-$/.test(part)) return part; // Preserve separators
                return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
            })
            .join('');
    }

    /**
     * Generates Soundex code for phonetic matching
     *
     * @param name - The name to generate Soundex for
     * @returns The Soundex code
     */
    export function generateSoundex(name: string): string {
        if (!name || typeof name !== 'string') return '';

        const clean = name.toUpperCase().replace(/[^A-Z]/g, '');
        if (clean.length === 0) return '';

        let soundex = clean.charAt(0);
        const mapping: Record<string, string> = {
            BFPV: '1',
            CGJKQSXZ: '2',
            DT: '3',
            L: '4',
            MN: '5',
            R: '6',
        };

        for (let i = 1; i < clean.length; i++) {
            const char = clean.charAt(i);
            let code = '0';

            for (const [letters, digit] of Object.entries(mapping)) {
                if (letters.includes(char)) {
                    code = digit;
                    break;
                }
            }

            if (code !== '0' && code !== soundex.slice(-1)) {
                soundex += code;
            }
        }

        return (soundex + '0000').substring(0, 4);
    }

    /**
     * Extracts initials from a name
     *
     * @param name - The name to extract initials from
     * @returns The initials string
     */
    export function extractInitials(name: string): string {
        if (!name || typeof name !== 'string') return '';

        return name
            .split(/[\s\-']+/)
            .map((part) => part.charAt(0).toUpperCase())
            .join('');
    }

    /**
     * Checks if two names are phonetically similar
     *
     * @param name1 - First name to compare
     * @param name2 - Second name to compare
     * @returns True if names are phonetically similar
     */
    export function arePhoneticallySimilar(name1: string, name2: string): boolean {
        return generateSoundex(name1) === generateSoundex(name2);
    }
}
