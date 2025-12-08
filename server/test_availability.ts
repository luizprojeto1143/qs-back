
const timeZone = 'America/Sao_Paulo';
const now = new Date();

const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' });
const currentDayKey = dayFormatter.format(now).toLowerCase();

const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false
});

const timeString = timeFormatter.format(now);
const [currentHour, currentMinute] = timeString.split(':').map(Number);
const currentTimeValue = currentHour * 60 + currentMinute;

console.log('--- Debug Availability Logic ---');
console.log('Current ISO Time:', now.toISOString());
console.log('TimeZone:', timeZone);
console.log('Detected Day Key:', currentDayKey);
console.log('Detected Time String:', timeString);
console.log('Current Time Value (minutes):', currentTimeValue);

// Simulate a Monday check
const mockSettings = {
    monday: {
        active: true,
        slots: [{ start: '08:00', end: '18:00' }]
    }
};

console.log('Mock Settings for Monday:', JSON.stringify(mockSettings.monday));

if (currentDayKey === 'monday') {
    const daySettings = mockSettings['monday'];
    const isAvailable = daySettings.slots.some(slot => {
        const [startHour, startMinute] = slot.start.split(':').map(Number);
        const [endHour, endMinute] = slot.end.split(':').map(Number);
        const startTimeValue = startHour * 60 + startMinute;
        const endTimeValue = endHour * 60 + endMinute;

        console.log(`Checking slot: ${slot.start} (${startTimeValue}) - ${slot.end} (${endTimeValue}) against ${currentTimeValue}`);
        return currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue;
    });
    console.log('Is Available:', isAvailable);
} else {
    console.log('Not Monday, skipping slot check.');
}
