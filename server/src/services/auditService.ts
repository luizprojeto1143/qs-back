import prisma from '../prisma';

export interface AuditLogDetails {
    [key: string]: any;
}

export const logAction = async (
    userId: string | null | undefined,
    action: string,
    resource: string | null | undefined,
    details: AuditLogDetails | null = null,
    companyId: string | null | undefined = undefined,
    ipAddress: string | null | undefined = undefined,
    userAgent: string | null | undefined = undefined
) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: userId || undefined,
                action,
                resource: resource || undefined,
                details: details || undefined,
                companyId: companyId || undefined,
                ipAddress: ipAddress || undefined,
                userAgent: userAgent || undefined
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // We don't want to crash the request if logging fails, but we should know about it.
    }
};

export const ACTIONS = {
    LOGIN: 'LOGIN',
    LOGIN_FAIL: 'LOGIN_FAIL',
    LOGOUT: 'LOGOUT',
    CREATE_USER: 'CREATE_USER',
    UPDATE_USER: 'UPDATE_USER',
    DELETE_USER: 'DELETE_USER',
    CREATE_COMPANY: 'CREATE_COMPANY',
    UPDATE_COMPANY: 'UPDATE_COMPANY',
    DELETE_COMPANY: 'DELETE_COMPANY',
    setup2FA: 'SETUP_2FA',
    enable2FA: 'ENABLE_2FA',
    disable2FA: 'DISABLE_2FA',
};
