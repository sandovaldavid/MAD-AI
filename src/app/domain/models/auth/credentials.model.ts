import { Identifier } from './Identifier.model';

export interface Credentials {
    identifier: Identifier;
    password: string;
    rememberMe?: boolean;
}
