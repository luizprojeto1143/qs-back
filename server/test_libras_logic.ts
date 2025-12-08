const DAYS_MAP: { [key: number]: string } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
};

const check = (mockDateStr: string, settings: any) => {
    console.log(`\n--- Testing with Mock Date: ${mockDateStr} ---`);
    const now = new Date(mockDateStr);

    // Logic from controller
    const timeZone = 'America/Sao_Paulo';
    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' });
    const currentDayKey = dayFormatter.format(now).toLowerCase();

    console.log(`Detected Day: ${currentDayKey}`);

    const daySettings = settings[currentDayKey];
    if (!daySettings || !daySettings.active) {
        console.log('Result: Not Available (Day not active)');
        return;
    }

    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });

    const timeString = timeFormatter.format(now);
    console.log(`Detected Time: ${timeString}`);

    const [currentHour, currentMinute] = timeString.split(':').map(Number);
    const currentTimeValue = currentHour * 60 + currentMinute;

    const isAvailable = daySettings.slots.some((slot: any) => {
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);

        const startTimeValue = startHour * 60 + startMinute;
        const endTimeValue = endHour * 60 + endMinute;

        return currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
    });

    console.log(`Result: ${isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}`);
};

const mockSettings = {
    monday: { active: true, slots: [{ start: '08:00', end: '18:00' }] },
    tuesday: { active: true, slots: [{ start: '08:00', end: '18:00' }] }
};

// Test Cases
// 1. Monday 10:00 AM (Should be Available)
check('2025-12-08T13:00:00Z', mockSettings); // 10:00 AM Brazil is 13:00 UTC

// 2. Monday 20:00 PM (Should be Unavailable)
check('2025-12-08T23:00:00Z', mockSettings); // 20:00 PM Brazil is 23:00 UTC

// 3. Sunday (Should be Unavailable)
check('2025-12-07T15:00:00Z', mockSettings); // Sunday
