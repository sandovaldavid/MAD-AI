import { UserStatus } from '../enums/user_status.enum';

export class UserStatusVO {
    private constructor(public readonly value: UserStatus) {}

    static allowed: UserStatus[] = Object.values(UserStatus);

    /**
     * Creates a UserStatus value object after validating the input.
     * @param raw Raw status string
     * @throws Error if the status is invalid
     */
    static create(raw: string): UserStatusVO {
        if (!raw || typeof raw !== 'string') throw new Error('User status is required');
        const normalized = raw.trim().toLowerCase();
        const found = UserStatusVO.allowed.find((status) => status === normalized);
        if (!found) throw new Error('Invalid user status');
        return new UserStatusVO(found as UserStatus);
    }
}
