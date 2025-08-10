export class LastName {
    private constructor(public readonly value: string) {}
    /**
     * Creates a LastName value object after validating and normalizing the input.
     * - Only allows letters, spaces, hyphens, 1-50 chars
     * - Normalizes to capitalized and trims spaces
     * @param raw Raw last name string
     * @throws Error if the last name is invalid
     */
    static create(raw: string): LastName {
        if (!raw || typeof raw !== 'string') throw new Error('Last name is required');
        const normalized = raw.trim();
        if (normalized.length < 1 || normalized.length > 50)
            throw new Error('Last name must be 1-50 characters');
        if (!/^[A-Za-z\s\-]+$/.test(normalized))
            throw new Error('Last name must contain only letters, spaces, or hyphens');
        // Capitalize first letter
        const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
        return new LastName(capitalized);
    }
}
