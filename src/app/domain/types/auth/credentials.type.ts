import { Identifier } from './Identifier.type';

export interface Credentials {
    identifier: Identifier;
    password: string;
    rememberMe?: boolean;
}
