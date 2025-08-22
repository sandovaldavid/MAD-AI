import { ValidationError } from '@domain/errors/validation-error.entity';
import { ValidationErrorCode } from '@domain/errors/validation-error-code.enum';

/**
 * LastName Value Object
 *
 * Represents a validated last name according to international naming conventions.
 * Ensures proper formatting, cultural sensitivity, and provides domain-specific
 * behavior for surname operations in personal identification systems.
 *
 * **Domain Rules:**
 * - Must be between 1 and 50 characters in length
 * - Can only contain letters, spaces, apostrophes, and hyphens
 * - Automatically formatted with proper capitalization
 * - Trims leading and trailing whitespace
 * - Supports international characters (Unicode letters)
 *
 * **Business Rules:**
 * - Used for personal identification and formal communication
 * - Must be appropriate for legal and professional contexts
 * - Should respect cultural and genealogical naming conventions
 * - Part of user's formal identity in the system
 * - Used for generating full names and formal addresses
 *
 * **Cultural Considerations:**
 * - Supports compound surnames with hyphens (Smith-Jones)
 * - Supports names with apostrophes (O'Connor, D'Angelo)
 * - Supports multiple words (Van Der Berg, De La Cruz)
 * - Handles prefixes and particles (von, de, du, van, etc.)
 * - Supports international characters (González, Müller, Østrøm)
 *
 * @example
 * ```typescript
 * // Valid last name creation
 * const lastName = LastName.create('smith');
 * console.log(lastName.value); // 'Smith'
 * console.log(lastName.getInitial()); // 'S'
 * console.log(lastName.isCompound()); // false
 *
 * // Compound surnames
 * const compoundName = LastName.create('smith-jones');
 * console.log(compoundName.value); // 'Smith-Jones'
 * console.log(compoundName.isCompound()); // true
 *
 * // Names with particles
 * const particleName = LastName.create('van der berg');
 * console.log(particleName.value); // 'Van Der Berg'
 * console.log(particleName.hasParticle()); // true
 *
 * // International names
 * const internationalName = LastName.create('gonzález');
 * console.log(internationalName.value); // 'González'
 * console.log(internationalName.hasAccents()); // true
 *
 * // Invalid last name throws ValidationError
 * try {
 *   LastName.create('Smith123'); // Contains numbers
 * } catch (error) {
 *   console.log(error.message); // 'Last name must contain only letters, spaces, apostrophes, or hyphens'
 * }
 * ```
 *
 * @see {@link https://en.wikipedia.org/wiki/Surname | Surname Conventions}
 * @see {@link https://en.wikipedia.org/wiki/Nobiliary_particle | Nobiliary Particles}
 */
export class LastName {
    private constructor(public readonly value: string) {}

    /**
     * Creates a validated LastName value object from a raw string.
     *
     * Performs comprehensive validation and normalization:
     * - Trims whitespace and applies proper capitalization
     * - Validates length constraints (1-50 characters)
     * - Ensures only valid characters (letters, spaces, apostrophes, hyphens)
     * - Handles international characters and naming conventions
     * - Applies title case formatting with special handling for particles
     *
     * @param raw - The raw last name string to validate
     * @returns A validated and formatted LastName instance
     * @throws {ValidationError} When validation fails, containing all validation errors
     *
     * @example
     * ```typescript
     * // Successful creation with normalization
     * const lastName = LastName.create('  smith  ');
     * console.log(lastName.value); // 'Smith'
     *
     * // Compound surname formatting
     * const compound = LastName.create('smith-jones');
     * console.log(compound.value); // 'Smith-Jones'
     *
     * // Names with particles (special formatting)
     * const particle = LastName.create('van der berg');
     * console.log(particle.value); // 'van der Berg'
     *
     * // Multiple words formatting
     * const multiWord = LastName.create('de la cruz');
     * console.log(multiWord.value); // 'de la Cruz'
     *
     * // Validation error for invalid characters
     * try {
     *   LastName.create('Smith123');
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_FORMAT_INVALID
     * }
     *
     * // Validation error for length
     * try {
     *   LastName.create('a'.repeat(51)); // Too long
     * } catch (error) {
     *   console.log(error.errors[0].code); // ValidationErrorCode.FIELD_TOO_LONG
     * }
     * ```
     */
    static create(raw: string): LastName {
        const errors: Array<{
            field: string;
            value: unknown;
            message: string;
            code?: ValidationErrorCode;
        }> = [];

        if (!raw || typeof raw !== 'string') {
            errors.push({
                field: 'lastName',
                value: raw,
                message: 'Last name is required',
                code: ValidationErrorCode.REQUIRED_FIELD_MISSING,
            });
        }

        if (typeof raw === 'string') {
            const normalized = raw.trim();

            if (normalized.length < 1) {
                errors.push({
                    field: 'lastName',
                    value: normalized,
                    message: 'Last name must not be empty',
                    code: ValidationErrorCode.FIELD_TOO_SHORT,
                });
            }

            if (normalized.length > LastNameSpecs.MAX_LENGTH) {
                errors.push({
                    field: 'lastName',
                    value: normalized,
                    message: `Last name must be at most ${LastNameSpecs.MAX_LENGTH} characters`,
                    code: ValidationErrorCode.FIELD_TOO_LONG,
                });
            }

            // Enhanced pattern to support international characters
            if (normalized.length > 0 && !LastNameSpecs.VALIDATION_REGEX.test(normalized)) {
                errors.push({
                    field: 'lastName',
                    value: normalized,
                    message: 'Last name must contain only letters, spaces, apostrophes, or hyphens',
                    code: ValidationErrorCode.FIELD_FORMAT_INVALID,
                });
            }
        }

        if (errors.length) {
            throw ValidationError.createFromFields(errors);
        }

        // Apply proper formatting with special handling for particles
        const formatted = LastNameUtils.formatSurname(raw.trim());
        return new LastName(formatted);
    }

    /**
     * Checks value equality with another LastName instance.
     *
     * Two LastName instances are considered equal if their formatted values match.
     * Comparison is case-sensitive after normalization.
     *
     * @param other - The other LastName instance to compare
     * @returns True if both last names have the same formatted value
     *
     * @example
     * ```typescript
     * const lastName1 = LastName.create('smith');
     * const lastName2 = LastName.create('SMITH');
     * console.log(lastName1.equals(lastName2)); // true (both formatted as 'Smith')
     *
     * const lastName3 = LastName.create('jones');
     * console.log(lastName1.equals(lastName3)); // false
     * ```
     */
    equals(other: LastName): boolean {
        return this.value === other.value;
    }

    /**
     * Returns the string representation of the last name.
     *
     * @returns The formatted last name string
     *
     * @example
     * ```typescript
     * const lastName = LastName.create('smith');
     * console.log(lastName.toString()); // 'Smith'
     * console.log(`Mr. ${lastName}`); // 'Mr. Smith'
     * ```
     */
    toString(): string {
        return this.value;
    }

    /**
     * Gets the initial from the last name.
     *
     * Returns the first letter of the main surname part, useful for
     * creating monograms or abbreviated display names.
     *
     * @returns The initial as a string
     *
     * @example
     * ```typescript
     * const lastName = LastName.create('Smith');
     * console.log(lastName.getInitial()); // 'S'
     *
     * const compoundName = LastName.create('Smith-Jones');
     * console.log(compoundName.getInitial()); // 'S'
     *
     * const particleName = LastName.create('van der Berg');
     * console.log(particleName.getInitial()); // 'B' (main surname part)
     * ```
     */
    getInitial(): string {
        // For names with particles, get the initial of the main surname
        const mainPart = this.getMainSurnamePart();
        return mainPart.charAt(0).toUpperCase();
    }

    /**
     * Gets the length of the last name.
     *
     * @returns The character count of the last name
     *
     * @example
     * ```typescript
     * const lastName = LastName.create('Smith');
     * console.log(lastName.getLength()); // 5
     * ```
     */
    getLength(): number {
        return this.value.length;
    }

    /**
     * Checks if the last name is compound (contains hyphens or multiple surname parts).
     *
     * @returns True if the name contains hyphens or multiple surname components
     *
     * @example
     * ```typescript
     * const simpleName = LastName.create('Smith');
     * console.log(simpleName.isCompound()); // false
     *
     * const hyphenatedName = LastName.create('Smith-Jones');
     * console.log(hyphenatedName.isCompound()); // true
     *
     * const particleName = LastName.create('van der Berg');
     * console.log(particleName.isCompound()); // true
     * ```
     */
    isCompound(): boolean {
        return /[\s\-]/.test(this.value) || this.hasParticle();
    }

    /**
     * Checks if the last name contains accented characters.
     *
     * Useful for handling international names that may require special
     * processing or display considerations.
     *
     * @returns True if the name contains accented characters
     *
     * @example
     * ```typescript
     * const regularName = LastName.create('Smith');
     * console.log(regularName.hasAccents()); // false
     *
     * const spanishName = LastName.create('González');
     * console.log(spanishName.hasAccents()); // true
     *
     * const germanName = LastName.create('Müller');
     * console.log(germanName.hasAccents()); // true
     * ```
     */
    hasAccents(): boolean {
        return /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(this.value);
    }

    /**
     * Checks if the last name contains an apostrophe.
     *
     * Common in names like O'Connor, D'Angelo, or similar cultural naming patterns.
     *
     * @returns True if the name contains an apostrophe
     *
     * @example
     * ```typescript
     * const regularName = LastName.create('Smith');
     * console.log(regularName.hasApostrophe()); // false
     *
     * const irishName = LastName.create("O'Connor");
     * console.log(irishName.hasApostrophe()); // true
     * ```
     */
    hasApostrophe(): boolean {
        return this.value.includes("'");
    }

    /**
     * Checks if the last name contains a nobiliary particle.
     *
     * Particles are small words that are part of surnames in many cultures
     * (van, de, du, von, etc.). They often indicate geographic or noble origin.
     *
     * @returns True if the name contains a recognized particle
     *
     * @example
     * ```typescript
     * const regularName = LastName.create('Smith');
     * console.log(regularName.hasParticle()); // false
     *
     * const dutchName = LastName.create('van der Berg');
     * console.log(dutchName.hasParticle()); // true
     *
     * const frenchName = LastName.create('de la Cruz');
     * console.log(frenchName.hasParticle()); // true
     * ```
     */
    hasParticle(): boolean {
        const words = this.value.toLowerCase().split(/\s+/);
        return words.some((word) => LastNameSpecs.SURNAME_PARTICLES.includes(word));
    }

    /**
     * Gets the main surname part (excluding particles).
     *
     * Extracts the primary surname component, which is useful for sorting,
     * indexing, or when the main family name is needed without particles.
     *
     * @returns The main surname part without particles
     *
     * @example
     * ```typescript
     * const regularName = LastName.create('Smith');
     * console.log(regularName.getMainSurnamePart()); // 'Smith'
     *
     * const particleName = LastName.create('van der Berg');
     * console.log(particleName.getMainSurnamePart()); // 'Berg'
     *
     * const frenchName = LastName.create('de la Cruz');
     * console.log(frenchName.getMainSurnamePart()); // 'Cruz'
     * ```
     */
    getMainSurnamePart(): string {
        const words = this.value.split(/\s+/);
        const particles = LastNameSpecs.SURNAME_PARTICLES;

        // Find the last word that is not a particle
        for (let i = words.length - 1; i >= 0; i--) {
            if (!particles.includes(words[i].toLowerCase())) {
                return words[i];
            }
        }

        // If all words are particles (unlikely), return the last word
        return words[words.length - 1];
    }

    /**
     * Gets the phonetic representation using Soundex algorithm.
     *
     * Useful for name matching and search functionality where pronunciation
     * matters more than exact spelling.
     *
     * @returns The Soundex code for the main surname part
     *
     * @example
     * ```typescript
     * const name1 = LastName.create('Smith');
     * const name2 = LastName.create('Smyth');
     * console.log(name1.getSoundex()); // 'S530'
     * console.log(name2.getSoundex()); // 'S530'
     * console.log(name1.getSoundex() === name2.getSoundex()); // true (similar pronunciation)
     * ```
     */
    getSoundex(): string {
        return LastNameUtils.generateSoundex(this.getMainSurnamePart());
    }

    /**
     * Gets the surname formatted for sorting purposes.
     *
     * Returns the name in a format suitable for alphabetical sorting,
     * typically with particles moved to the end or excluded.
     *
     * @returns The surname formatted for sorting
     *
     * @example
     * ```typescript
     * const regularName = LastName.create('Smith');
     * console.log(regularName.getSortKey()); // 'Smith'
     *
     * const particleName = LastName.create('van der Berg');
     * console.log(particleName.getSortKey()); // 'Berg, van der'
     *
     * const hyphenatedName = LastName.create('Smith-Jones');
     * console.log(hyphenatedName.getSortKey()); // 'Smith-Jones'
     * ```
     */
    getSortKey(): string {
        if (!this.hasParticle()) {
            return this.value;
        }

        const words = this.value.split(/\s+/);
        const particles: string[] = [];
        const mainParts: string[] = [];

        words.forEach((word) => {
            if (LastNameSpecs.SURNAME_PARTICLES.includes(word.toLowerCase())) {
                particles.push(word);
            } else {
                mainParts.push(word);
            }
        });

        const mainPart = mainParts.join(' ');
        const particlePart = particles.join(' ');

        return particlePart ? `${mainPart}, ${particlePart}` : mainPart;
    }

    /**
     * Creates a formal version of the surname for official documents.
     *
     * Returns the surname in a format appropriate for formal documents,
     * legal papers, or official correspondence.
     *
     * @returns The formal representation of the surname
     *
     * @example
     * ```typescript
     * const lastName = LastName.create('smith-jones');
     * console.log(lastName.getFormalFormat()); // 'SMITH-JONES'
     *
     * const particleName = LastName.create('van der Berg');
     * console.log(particleName.getFormalFormat()); // 'VAN DER BERG'
     * ```
     */
    getFormalFormat(): string {
        return this.value.toUpperCase();
    }

    /**
     * Creates an abbreviated version of the surname.
     *
     * Useful for UI components with limited space or where brevity is preferred.
     *
     * @param maxLength - Maximum length for the abbreviated surname (default: 10)
     * @returns An abbreviated version of the surname
     *
     * @example
     * ```typescript
     * const longName = LastName.create('Schwarzenegger');
     * console.log(longName.getAbbreviated(8)); // 'Schwarz.'
     *
     * const particleName = LastName.create('van der Berg');
     * console.log(particleName.getAbbreviated(10)); // 'v.d. Berg'
     * ```
     */
    getAbbreviated(maxLength: number = 10): string {
        if (this.value.length <= maxLength) {
            return this.value;
        }

        // For names with particles, try to abbreviate particles
        if (this.hasParticle()) {
            const words = this.value.split(/\s+/);
            const result: string[] = [];
            let currentLength = 0;

            for (const word of words) {
                const isParticle = LastNameSpecs.SURNAME_PARTICLES.includes(word.toLowerCase());
                const abbreviated = isParticle && word.length > 1 ? word.charAt(0) + '.' : word;

                if (currentLength + abbreviated.length + (result.length > 0 ? 1 : 0) <= maxLength) {
                    result.push(abbreviated);
                    currentLength += abbreviated.length + (result.length > 1 ? 1 : 0);
                } else {
                    break;
                }
            }

            if (result.length > 0) {
                return result.join(' ');
            }
        }

        // Truncate and add period
        return this.value.substring(0, maxLength - 1) + '.';
    }
}

/**
 * LastName Value Object Specifications
 *
 * Defines the business rules, validation constraints, and behavioral specifications
 * for the LastName value object. Used for testing, documentation, and validation.
 */
export namespace LastNameSpecs {
    /**
     * Maximum allowed length for last names
     */
    export const MAX_LENGTH = 50;

    /**
     * Regular expression for last name validation (letters, spaces, apostrophes, hyphens, international characters)
     */
    export const VALIDATION_REGEX = /^[\p{L}\s'\-]+$/u;

    /**
     * Common surname particles (nobiliary particles) that appear in surnames
     */
    export const SURNAME_PARTICLES: readonly string[] = [
        // Dutch
        'van',
        'van de',
        'van den',
        'van der',
        'de',
        'den',
        'der',
        'te',
        'ten',
        'ter',
        // German
        'von',
        'zu',
        'von und zu',
        'von der',
        'vom',
        'zur',
        // French
        'de',
        'du',
        'des',
        'de la',
        'de le',
        "de l'",
        'de las',
        'de los',
        // Spanish
        'de',
        'del',
        'de la',
        'de las',
        'de los',
        // Italian
        'di',
        'da',
        'del',
        'della',
        'delle',
        'dei',
        'degli',
        // Portuguese
        'da',
        'das',
        'de',
        'do',
        'dos',
        // Irish/Scottish
        "o'",
        'mac',
        'mc',
        // Arabic
        'al',
        'el',
        'ibn',
        'bin',
        'bint',
        // Other
        'y',
        'e',
        'et',
    ];

    /**
     * Validation rules applied during last name creation
     */
    export const VALIDATION_RULES = {
        REQUIRED: 'Last name is required',
        NOT_EMPTY: 'Last name must not be empty',
        MAX_LENGTH: `Last name must be at most ${MAX_LENGTH} characters`,
        VALID_FORMAT: 'Last name must contain only letters, spaces, apostrophes, or hyphens',
        NO_NUMBERS: 'Last name cannot contain numbers',
        NO_SPECIAL_CHARS:
            'Last name cannot contain special characters except apostrophes and hyphens',
    } as const;

    /**
     * Business rules for last name usage in the domain
     */
    export const BUSINESS_RULES = {
        FAMILY_IDENTIFICATION: 'Last name is used for family identification',
        FORMAL_ADDRESS: 'Last name is used in formal communications',
        LEGAL_IDENTITY: 'Last name is part of legal identity',
        CULTURAL_SENSITIVITY: 'Last name handling must respect cultural naming conventions',
        GENEALOGICAL_IMPORTANCE: 'Last name carries genealogical significance',
        SORTING_KEY: 'Last name is primary key for alphabetical sorting',
    } as const;
}

/**
 * LastName utility functions for common operations
 */
export namespace LastNameUtils {
    /**
     * Validates if a string could be a valid last name without creating the value object
     *
     * @param value - The string to validate
     * @returns True if the string appears to be a valid last name format
     */
    export function isValidFormat(value: string): boolean {
        if (typeof value !== 'string' || value.trim().length === 0) {
            return false;
        }

        const normalized = value.trim();

        if (normalized.length > LastNameSpecs.MAX_LENGTH) {
            return false;
        }

        return LastNameSpecs.VALIDATION_REGEX.test(normalized);
    }

    /**
     * Formats a surname string with proper capitalization and particle handling
     *
     * @param value - The surname string to format
     * @returns The formatted surname string
     */
    export function formatSurname(value: string): string {
        if (!value || typeof value !== 'string') {
            return '';
        }

        const words = value.trim().split(/\s+/);

        return words
            .map((word) => {
                const lowercaseWord = word.toLowerCase();

                // Handle particles - keep them lowercase unless at start
                if (LastNameSpecs.SURNAME_PARTICLES.includes(lowercaseWord)) {
                    return lowercaseWord;
                }

                // Handle hyphenated parts
                if (word.includes('-')) {
                    return word
                        .split('-')
                        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
                        .join('-');
                }

                // Regular capitalization
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join(' ');
    }

    /**
     * Generates Soundex code for phonetic matching
     *
     * @param surname - The surname to generate Soundex for
     * @returns The Soundex code
     */
    export function generateSoundex(surname: string): string {
        if (!surname || typeof surname !== 'string') return '';

        const clean = surname.toUpperCase().replace(/[^A-Z]/g, '');
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
     * Extracts the main surname part (excluding particles)
     *
     * @param surname - The full surname
     * @returns The main surname part
     */
    export function extractMainPart(surname: string): string {
        if (!surname || typeof surname !== 'string') return '';

        const words = surname.split(/\s+/);
        const particles = LastNameSpecs.SURNAME_PARTICLES;

        // Find the last word that is not a particle
        for (let i = words.length - 1; i >= 0; i--) {
            if (!particles.includes(words[i].toLowerCase())) {
                return words[i];
            }
        }

        return words[words.length - 1];
    }

    /**
     * Checks if two surnames are phonetically similar
     *
     * @param surname1 - First surname to compare
     * @param surname2 - Second surname to compare
     * @returns True if surnames are phonetically similar
     */
    export function arePhoneticallySimilar(surname1: string, surname2: string): boolean {
        return generateSoundex(surname1) === generateSoundex(surname2);
    }

    /**
     * Creates a sort key for alphabetical ordering
     *
     * @param surname - The surname to create a sort key for
     * @returns A string suitable for alphabetical sorting
     */
    export function createSortKey(surname: string): string {
        if (!surname || typeof surname !== 'string') return '';

        const mainPart = extractMainPart(surname);
        return mainPart.toLowerCase();
    }
}
