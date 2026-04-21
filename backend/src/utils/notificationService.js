const { Expo } = require('expo-server-sdk');
const axios = require('axios');
const prisma = require('../prisma');

const expo = new Expo();

/**
 * Send a notification across multiple channels (Push, WhatsApp, In-app)
 * @param {Object} options
 * @param {string} options.userId - The ID of the recipient user
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body
 * @param {string} options.type - Notification type (Booking, System, Promo)
 * @param {Object} [options.metadata] - Extra data (e.g. { bookingId: "..." })
 * @param {Object} [options.channels] - { push: true, whatsapp: true, inApp: true }
 * @param {Object} [options.whatsappTemplate] - { name: "...", components: { ... } }
 */
const sendNotification = async ({
    userId,
    title,
    body,
    type = 'System',
    metadata = {},
    channels = { push: true, whatsapp: true, inApp: true },
    whatsappTemplate = null
}) => {

    // 1. In-app Notification (Database)
    if (channels.inApp) {
        try {
            await prisma.notification.create({
                data: {
                    userId,
                    title,
                    body,
                    type,
                    metadata: metadata ? JSON.stringify(metadata) : null
                }
            });
        } catch (error) {
            console.error(`[NotificationService] Error creating in-app record:`, error.message);
        }
    }

    // 2. Push Notification (Expo)
    if (channels.push) {
        try {
            const userTokens = await prisma.pushToken.findMany({
                where: { userId }
            });

            if (userTokens.length > 0) {
                const messages = [];
                for (let pushToken of userTokens) {
                    if (!Expo.isExpoPushToken(pushToken.token)) {
                        console.error(`Push token ${pushToken.token} is not a valid Expo push token`);
                        continue;
                    }

                    messages.push({
                        to: pushToken.token,
                        sound: 'default',
                        title,
                        body,
                        data: metadata,
                    });
                }

                let chunks = expo.chunkPushNotifications(messages);
                for (let chunk of chunks) {
                    try {
                        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    } catch (error) {
                        console.error(`[NotificationService] Error sending push chunk:`, error);
                    }
                }
            } else {
            }
        } catch (error) {
            console.error(`[NotificationService] Error in push flow:`, error.message);
        }
    }

    // 3. WhatsApp Notification (MSG91)
    if (channels.whatsapp && whatsappTemplate) {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (user && user.phone) {
                await sendWhatsApp(user.phone, whatsappTemplate);
            } else {
                console.log(`[NotificationService] User ${userId} has no phone for WhatsApp`);
            }
        } catch (error) {
            console.error(`[NotificationService] Error in WhatsApp flow:`, error.message);
        }
    }
};

/**
 * Generic MSG91 WhatsApp sender
 * @param {string} phone - User phone number
 * @param {Object} template - { name: "...", components: { ... } }
 */
const sendWhatsApp = async (phone, template) => {
    const numericPhone = phone.toString().replace(/\D/g, '');
    const cleanPhone = numericPhone.length === 10 ? `91${numericPhone}` : numericPhone;

    const authkey = process.env.MSG91_AUTH_KEY;
    const whatsapp_number = process.env.MSG91_WHATSAPP_NUMBER;

    if (!authkey || !whatsapp_number) {
        console.warn(`[NotificationService] MSG91 credentials missing. Skipping WhatsApp.`);
        return false;
    }

    const url = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/';

    const payload = {
        integrated_number: whatsapp_number,
        content_type: 'template',
        payload: {
            type: 'template',
            template: {
                name: template.name,
                language: {
                    code: 'en',
                    policy: 'deterministic'
                },
                to_and_components: [
                    {
                        to: [cleanPhone],
                        components: template.components || {}
                    }
                ]
            }
        }
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'authkey': authkey,
                'Content-Type': 'application/json'
            }
        });
        console.log(`[NotificationService] MSG91 WhatsApp sent to ${cleanPhone}:`, response.data.status);
        return true;
    } catch (err) {
        console.error('[NotificationService] MSG91 WhatsApp Error:', err?.response?.data || err.message);
        return false;
    }
};

module.exports = {
    sendNotification,
    sendWhatsApp
};
