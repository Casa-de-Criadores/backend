import {z} from 'zod';

export const IdParamSchema = z.string().min(1, { message: 'Product ID is required' });
export type IdParam = z.infer<typeof IdParamSchema>;