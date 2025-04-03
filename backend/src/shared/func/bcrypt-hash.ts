import { hashSync } from 'bcrypt';

export const bcryptHash = (text: string): string => hashSync(text, 10);
