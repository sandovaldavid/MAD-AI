export class RoleName {
    private constructor(public readonly value: string) {}
    /**
     * Creates a RoleName value object after validating and normalizing the input.
     * - Only allows letters, spaces, hyphens, 3-50 chars
     * - Normalizes to capitalized and trims spaces
     * @param raw Raw role name string
     * @throws Error if the role name is invalid
     */
    static create(raw: string): RoleName {
        if (!raw || typeof raw !== 'string') throw new Error('Role name is required');
        const normalized = raw.trim();
        if (normalized.length < 3 || normalized.length > 50)
            throw new Error('Role name must be 3-50 characters');
        if (!/^[A-Za-z\s\-]+$/.test(normalized))
            throw new Error('Role name must contain only letters, spaces, or hyphens');
        // Capitalize first letter
        const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
        return new RoleName(capitalized);
    }
}
