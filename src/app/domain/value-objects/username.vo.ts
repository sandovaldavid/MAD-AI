export class Username {
    private constructor(public readonly value: string) {}
    /**
     * Creates a Username value object after validating and normalizing the input.
     * - Only allows alphanumeric and underscores, 3-32 chars
     * - Normalizes to lowercase and trims spaces
     * @param raw Raw username string
     * @throws Error if the username is invalid
     */
    static create(raw: string): Username {
        if (!raw || typeof raw !== 'string') throw new Error('Username is required');
        const normalized = raw.trim().toLowerCase();
        if (normalized.length < 3 || normalized.length > 32) throw new Error('Username must be 3-32 characters');
        if (!/^\w+$/.test(normalized)) throw new Error('Username must be alphanumeric or underscore');
        return new Username(normalized);
    }
}
