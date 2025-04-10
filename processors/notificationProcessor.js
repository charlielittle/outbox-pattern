// Now let's implement the notification processor that uses change streams

// processors/notificationProcessor.js
const mongoose = require('mongoose');
const Outbox = require('../models/outbox');
const Notification = require('../models/notification');
const User = require('../models/user');

class NotificationProcessor {
    constructor() {
        this.changeStream = null;
        this.isProcessing = false;
    }

    /**
     * Start listening to the outbox collection change stream
     */
    async startProcessing() {
        try {
            // Create a change stream pipeline to watch for new outbox events
            const pipeline = [
                {
                    $match: {
                        'operationType': 'insert',
                        'fullDocument.status': 'pending'
                    }
                }
            ];

            // Get a reference to the outbox collection
            const outboxCollection = mongoose.connection.collection('outboxes');

            // Create the change stream
            this.changeStream = outboxCollection.watch(pipeline, {
                fullDocument: 'updateLookup'
            });

            // Listen for changes
            this.changeStream.on('change', async (change) => {
                try {
                    this.isProcessing = true;
                    // Process the new outbox event
                    await this.processOutboxEvent(change.fullDocument);
                } catch (error) {
                    console.error('Error processing outbox event:', error);
                } finally {
                    this.isProcessing = false;
                }
            });

            console.log('Notification processor started');

            // Also process any pending events that might have been missed
            await this.processPendingEvents();
        } catch (error) {
            console.error('Error starting notification processor:', error);
            throw error;
        }
    }

    /**
     * Process outbox events that are in pending status
     * This helps recover from any failures or missed events
     */
    async processPendingEvents() {
        if (this.isProcessing) return;

        this.isProcessing = true;

        try {
            const pendingEvents = await Outbox.find({
                status: 'pending'
            }).sort({ createdAt: 1 }).limit(100);

            for (const event of pendingEvents) {
                await this.processOutboxEvent(event);
            }
            setTimeout(() => this.processPendingEvents(), 5000);
        } catch (error) {
            console.error('Error processing pending events:', error);
        } finally {
            this.isProcessing = false;
        }

        // Schedule next batch if there might be more events
        if (await Outbox.countDocuments({ status: 'pending' }, { limit: 1 }) > 0) {
            setTimeout(() => this.processPendingEvents(), 5000);
        }
    }

    /**
     * Process a single outbox event
     */
    async processOutboxEvent(event) {
        // Mark event as processing
        await Outbox.findByIdAndUpdate(event._id, {
            status: 'processing'
        });

        try {
            switch (event.eventType) {
                case 'user.created':
                    await this.processUserCreated(event);
                    break;
                case 'user.updated':
                    await this.processUserUpdated(event);
                    break;
                case 'user.deleted':
                    await this.processUserDeleted(event);
                    break;
                default:
                    console.warn(`Unknown event type: ${event.eventType}`);
            }

            // Mark event as processed
            await Outbox.findByIdAndUpdate(event._id, {
                status: 'processed',
                processedAt: new Date()
            });
        } catch (error) {
            console.error(`Error processing event ${event._id}:`, error);

            // Mark event as failed
            await Outbox.findByIdAndUpdate(event._id, {
                status: 'failed'
            });
        }
    }

    /**
     * Process user created event
     */
    async processUserCreated(event) {
        const { userId, username, email } = event.payload;

        // Create welcome email notification
        const notification = new Notification({
            userId,
            outboxEventId: event._id,
            type: 'email',
            content: {
                subject: 'Welcome to our platform!',
                body: `Hi ${username}, welcome to our platform! We're excited to have you on board.`
            }
        });

        await notification.save();

        // In a real application, we would now send the email
        // For demo purposes, we'll simulate sending by updating status
        await this.sendEmailNotification(notification);
    }

    /**
     * Process user updated event
     */
    async processUserUpdated(event) {
        const { userId, username, updatedFields } = event.payload;

        // Get user to check notification preferences
        const user = await User.findById(userId);
        if (!user || !user.preferences.emailNotifications) {
            return;
        }

        // Create update notification
        const notification = new Notification({
            userId,
            outboxEventId: event._id,
            type: 'email',
            content: {
                subject: 'Your account was updated',
                body: `Hi ${username}, your account information was updated. The following fields were changed: ${updatedFields.join(', ')}.`
            }
        });

        await notification.save();

        // Send the notification
        await this.sendEmailNotification(notification);
    }

    /**
     * Process user deleted event
     */
    async processUserDeleted(event) {
        const { userId, username, email } = event.payload;

        // Create deletion confirmation notification
        const notification = new Notification({
            userId,
            outboxEventId: event._id,
            type: 'email',
            content: {
                subject: 'Account Deletion Confirmation',
                body: `Hi ${username}, we're confirming that your account has been deleted as requested.`
            }
        });

        await notification.save();

        // Send the notification
        await this.sendEmailNotification(notification);
    }

    /**
     * Send email notification (simulated)
     */
    async sendEmailNotification(notification) {
        // In a real application, this would connect to an email service
        // For demo purposes, we'll just simulate sending
        console.log(`Sending email: ${notification.content.subject} to user ${notification.userId}`);

        // Simulate some delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Update notification status
        notification.status = 'sent';
        notification.sentAt = new Date();
        await notification.save();
        console.log(`Updated notification: ${JSON.stringify(notification)}`);
        return true;
    }

    /**
     * Stop the notification processor
     */
    async stop() {
        if (this.changeStream) {
            await this.changeStream.close();
            this.changeStream = null;
        }
        console.log('Notification processor stopped');
    }
}

module.exports = new NotificationProcessor();
