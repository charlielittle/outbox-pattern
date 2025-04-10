// Finally, let's implement the main application file

// index.js
const express = require('express');
const { connectMongoDB } = require('./config/mongodb');
const userService = require('./services/userService');
const notificationProcessor = require('./processors/notificationProcessor');

const mongoose = require('mongoose');
const User = require('./models/user');
const Outbox = require('./models/outbox');
const Notification = require('./models/notification');

const app = express();
app.use(express.json());


// API routes
// System status endpoint
app.get('/api/status', (req, res) => {
    const status = {
        api: true,
        mongodb: mongoose.connection.readyState === 1, // 1 = connected
        processor: notificationProcessor.isProcessing !== undefined ?
            notificationProcessor.isProcessing : true // Default to true if not defined
    };
    res.json(status);
});

// Get all users endpoint
app.get('/api/users', async (req, res) => {
    try {
        console.log( 'Get all users' );
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// Outbox endpoints
app.get('/api/outbox', async (req, res) => {
    try {
        console.log( 'Get all outbox events' );
        // Get latest 20 outbox events, sorted by creation date (newest first)
        const outboxEvents = await Outbox.find()
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(outboxEvents);
    } catch (error) {
        console.error('Error fetching outbox events:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/outbox/:id', async (req, res) => {
    try {
        console.log( 'Get outbox event by ID' );
        const outboxEvent = await Outbox.findById(req.params.id);
        if (!outboxEvent) {
            return res.status(404).json({ error: 'Outbox event not found' });
        }
        res.json(outboxEvent);
    } catch (error) {
        console.error('Error fetching outbox event:', error);
        res.status(500).json({ error: error.message });
    }
});

// Notification endpoints
app.get('/api/notifications', async (req, res) => {
    try {
        console.log( 'Get last 20 notifications' );
        // Get latest 20 notifications, sorted by creation date (newest first)
        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/notifications/:id', async (req, res) => {
    try {
        console.log( `Get notification by ID ${req.params.id}` );
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(notification);
    } catch (error) {
        console.error('Error fetching notification:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        console.log( 'Create user' );
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(400).json({ error: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        console.log( `Update user ${req.params.id}` );
        const user = await userService.updateUser(req.params.id, req.body);
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        console.log( `Delete user ${req.params.id}` );
        const result = await userService.deleteUser(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(400).json({ error: error.message });
    }
});

// Start the application
const PORT = process.env.PORT || 3000;

async function startApp() {
    // Connect to MongoDB
    const connection = await connectMongoDB();

    // Start notification processor
    await notificationProcessor.startProcessing();

    // Start Express server
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Shutting down application...');
        await notificationProcessor.stop();
        await connection.close();
        process.exit(0);
    });
}

startApp().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
