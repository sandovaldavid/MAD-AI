export class FirstName {
    private constructor(public readonly value: string) {}
    /**
     * Creates a FirstName value object after validating and normalizing the input.
     * - Only allows letters, spaces, hyphens, 1-50 chars
     * - Normalizes to capitalized and trims spaces
     * @param raw Raw first name string
     * @throws Error if the first name is invalid
     */
    static create(raw: string): FirstName {
        if (!raw || typeof raw !== 'string') throw new Error('First name is required');
        const normalized = raw.trim();
        if (normalized.length < 1 || normalized.length > 50) throw new Error('First name must be 1-50 characters');
        if (!/^[A-Za-z\s\-]+$/.test(normalized)) throw new Error('First name must contain only letters, spaces, or hyphens');
        // Capitalize first letter
        const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
        return new FirstName(capitalized);
    }
}
