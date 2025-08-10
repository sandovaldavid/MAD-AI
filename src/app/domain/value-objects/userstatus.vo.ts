export class UserStatusVO {
    private constructor(public readonly value: string) {}
    static allowed = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING', 'UNKNOWN'];
    /**
     * Creates a UserStatus value object after validating the input.
     * @param raw Raw status string
     * @throws Error if the status is invalid
     */
    static create(raw: string): UserStatusVO {
        if (!raw || typeof raw !== 'string') throw new Error('User status is required');
        const normalized = raw.trim().toUpperCase();
        if (!UserStatusVO.allowed.includes(normalized)) throw new Error('Invalid user status');
        return new UserStatusVO(normalized);
    }
}
