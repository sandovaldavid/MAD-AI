export interface TokenSnapshot {
    accessToken?: string | null;
    accessExp?: number | null;
    refreshToken?: string | null;
}

export interface TokenStorePort {
    read(): TokenSnapshot | null;
    write(snapshot: TokenSnapshot | null): void;
    clear(): void;
}
