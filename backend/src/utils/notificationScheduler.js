const cron = require('node-cron');
const prisma = require('../prisma');
const { sendNotification } = require('./notificationService');

/**
 * Initialize background jobs for notifications
 */
const initNotificationScheduler = () => {
    console.log('--- Initializing Notification Scheduler ---');

    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('[Scheduler] Running notification checks...');
        await sendServiceReminders();
        await sendReviewRequests();
    });

    console.log('[Scheduler] Cron jobs started: Reminders & Review Requests');
};

/**
 * Send reminders to Customer and Partner 1 hour before the service
 */
const sendServiceReminders = async () => {
    try {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        const seventyFiveMinutesLater = new Date(now.getTime() + 75 * 60 * 1000);

        // Find bookings scheduled to start in the next hour (window: 60-75 mins from now)
        const upcomingBookings = await prisma.booking.findMany({
            where: {
                status: 'Confirmed',
                bookingDate: {
                    gte: oneHourLater,
                    lte: seventyFiveMinutesLater
                }
            },
            include: {
                partnerProfile: true,
                customerProfile: true
            }
        });

        for (const booking of upcomingBookings) {
            // Check if reminder already sent
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    type: 'Reminder',
                    metadata: {
                        path: ['bookingId'],
                        equals: booking.id
                    }
                }
            });

            if (existingNotification) continue;

            const timeStr = new Date(booking.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // 1. Notify Customer
            if (booking.customerProfile?.userId) {
                await sendNotification({
                    userId: booking.customerProfile.userId,
                    title: 'Service Reminder',
                    body: `Your service starts in 1 hour at ${timeStr}. Get ready! 💇‍♂️`,
                    type: 'Reminder',
                    metadata: { bookingId: booking.id },
                    whatsappTemplate: {
                        name: 'cust_booking_rem',
                        components: {
                            body_1: { type: 'text', value: timeStr }
                        }
                    }
                });
            }

            // 2. Notify Partner
            if (booking.partnerId) {
                await sendNotification({
                    userId: booking.partnerProfile.userId,
                    title: 'Upcoming Service',
                    body: `Reminder: You have a service starting in 1 hour at ${timeStr}. 🕒`,
                    type: 'Reminder',
                    metadata: { bookingId: booking.id },
                    whatsappTemplate: {
                        name: 'part_booking_rem',
                        components: {
                            body_1: { type: 'text', value: timeStr }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error in sendServiceReminders:', error);
    }
};

/**
 * Send review requests to Customer 1 hour after service completion
 */
const sendReviewRequests = async () => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const seventyFiveMinutesAgo = new Date(now.getTime() - 75 * 60 * 1000);

        // Find bookings completed in the last hour window
        const completedBookings = await prisma.booking.findMany({
            where: {
                status: 'Completed',
                updatedAt: {
                    gte: seventyFiveMinutesAgo,
                    lte: oneHourAgo
                }
            },
            include: {
                customerProfile: true,
                partnerProfile: true
            }
        });

        for (const booking of completedBookings) {
            // Check if review request already sent
            const existingNotification = await prisma.notification.findFirst({
                where: {
                    type: 'ReviewRequest',
                    metadata: {
                        path: ['bookingId'],
                        equals: booking.id
                    }
                }
            });

            if (existingNotification) continue;

            if (booking.customerProfile?.userId) {
                const partnerName = booking.partnerProfile?.basicInfo?.businessName || 'your stylist';
                
                await sendNotification({
                    userId: booking.customerProfile.userId,
                    title: 'How was your experience?',
                    body: `How was your service with ${partnerName}? Rate them now! ⭐`,
                    type: 'ReviewRequest',
                    metadata: { bookingId: booking.id },
                    whatsappTemplate: {
                        name: 'cust_booking_rev',
                        components: {
                            body_1: { type: 'text', value: partnerName }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('[Scheduler] Error in sendReviewRequests:', error);
    }
};

module.exports = { initNotificationScheduler };
