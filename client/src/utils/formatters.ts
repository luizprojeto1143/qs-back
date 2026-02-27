export const formatShift = (shift: string | undefined | null) => {
    if (!shift) return 'Sem Turno';
    const map: Record<string, string> = {
        '1_TURNO': '1º Turno',
        '2_TURNO': '2º Turno',
        '3_TURNO': '3º Turno',
        'ESCALA_12X36': 'Escala 12x36',
        'MANHA': '1º Turno', // Fallback for old data if any
        'TARDE': '2º Turno', // Fallback for old data if any
        'NOITE': '3º Turno'  // Fallback for old data if any
    };
    return map[shift] || shift;
};
