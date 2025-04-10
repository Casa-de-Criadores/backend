export const USER_ROLES = ['customer', 'brand', 'admin', 'super'] as const;
export type UserRole = typeof USER_ROLES[number];
