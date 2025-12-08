import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- DEBUGGING LIBRAS AVAILABILITY ---');

    // 1. Check Server Time
    const timeZone = 'America/Sao_Paulo';
    const now = new Date();

    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'long' });
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    });

    const currentDayKey = dayFormatter.format(now).toLowerCase();
    const timeString = timeFormatter.format(now);
    const [currentHour, currentMinute] = timeString.split(':').map(Number);
    const currentTimeValue = currentHour * 60 + currentMinute;

    console.log(`Server Time (UTC): ${now.toISOString()}`);
    console.log(`Detected Brazil Time: ${timeString} (${currentDayKey})`);
    console.log(`Current Time Value (minutes): ${currentTimeValue}`);
    console.log('-------------------------------------------');

    // 2. Check Companies
    const companies = await prisma.company.findMany({
        select: { id: true, name: true, librasAvailability: true }
    });

    console.log(`Found ${companies.length} companies.`);

    for (const company of companies) {
        console.log(`\nCompany: ${company.name} (${company.id})`);

        if (!company.librasAvailability) {
            console.log('  -> No settings configured (librasAvailability is null)');
            continue;
        }

        try {
            const settings = JSON.parse(company.librasAvailability);
            // console.log('  -> Settings:', JSON.stringify(settings, null, 2));

            const daySettings = settings[currentDayKey];
            if (!daySettings) {
                console.log(`  -> No settings for today (${currentDayKey})`);
                continue;
            }

            if (!daySettings.active) {
                console.log(`  -> Today (${currentDayKey}) is set to INACTIVE`);
                continue;
            }

            console.log(`  -> Today is ACTIVE. Checking slots...`);
            let isAvailable = false;

            for (const slot of daySettings.slots) {
                const [startHour, startMinute] = slot.start.split(':').map(Number);
                const [endHour, endMinute] = slot.end.split(':').map(Number);

                const startTimeValue = startHour * 60 + startMinute;
                const endTimeValue = endHour * 60 + endMinute;

                console.log(`     Slot: ${slot.start} (${startTimeValue}) - ${slot.end} (${endTimeValue}) vs Current: ${currentTimeValue}`);

                if (currentTimeValue >= startTimeValue && currentTimeValue <= endTimeValue) {
                    isAvailable = true;
                    console.log('     MATCH! This slot is active.');
                }
            }

            console.log(`  => FINAL STATUS: ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}`);

        } catch (e) {
            console.error('  -> Error parsing JSON:', e);
        }
    }
}

debug()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
