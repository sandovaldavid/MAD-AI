export class ISODateTime {
    private constructor(public readonly value: string) {}

    /**
     * Creates an ISODateTime value object after validating and normalizing the input.
     * - Uses a stricter ISO 8601 regex
     * - Checks with Date.parse for validity
     * - Normalizes the value (trims spaces)
     * @param raw Raw datetime string
     * @returns ISODateTime instance or undefined if input is empty
     * @throws Error if the datetime is invalid
     */
    static create(raw?: string | null): ISODateTime | undefined {
        if (!raw) return undefined;
        const normalized = raw.trim();
        // ISO 8601 regex (YYYY-MM-DDTHH:mm:ss(.sss)?(Z|±hh:mm)?)
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?(Z|[+-]\d{2}:\d{2})?$/;
        if (!isoRegex.test(normalized)) throw new Error('Invalid ISO 8601 datetime format');
        // Check if valid date
        const timestamp = Date.parse(normalized);
        if (isNaN(timestamp)) throw new Error('Invalid ISO datetime value');
        return new ISODateTime(normalized);
    }
}
