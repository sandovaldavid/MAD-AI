export class AccessLevel {
    private constructor(public readonly value: number) {}
    /**
     * Creates an AccessLevel value object after validating the input.
     * - Must be integer between 1 and 5
     * @param raw Raw access level number
     * @throws Error if the access level is invalid
     */
    static create(raw: number): AccessLevel {
        if (typeof raw !== 'number' || !Number.isInteger(raw))
            throw new Error('Access level must be an integer');
        if (raw < 1 || raw > 5) throw new Error('Access level must be between 1 and 5');
        return new AccessLevel(raw);
    }
}
