export class Email {
    private constructor(public readonly value: string) {}

    /**
     * Creates an Email value object after validating and normalizing the input.
     * - Uses a stricter regex for validation
     * - Normalizes to lowercase and trims spaces
     * - Checks length and forbidden characters
     * @param raw Raw email string
     * @throws Error if the email is invalid
     */
    static create(raw: string): Email {
        if (!raw || typeof raw !== 'string') throw new Error('Email is required');
        const normalized = raw.trim().toLowerCase();
        // RFC 5322 Official Standard regex (simplified for most cases)
        const strictRegex =
            /^(?:[a-zA-Z0-9_'^&\/+-])+(?:\.(?:[a-zA-Z0-9_'^&\/+-]+))*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
        if (normalized.length > 254) throw new Error('Email is too long');
        if (!strictRegex.test(normalized)) throw new Error('Invalid email format');
        // Check for forbidden characters
        if (/\s/.test(normalized)) throw new Error('Email must not contain spaces');
        return new Email(normalized);
    }
}
