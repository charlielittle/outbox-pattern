# MongoDB Transactional Outbox Pattern Implementation

This project demonstrates the implementation of the Transactional Outbox Pattern for reliable event publishing in distributed systems using MongoDB, MongoDB Change Streams, and Node.js, with a React-based testing interface.

## What is the Transactional Outbox Pattern?

The Transactional Outbox Pattern is a design pattern used to reliably implement event-driven communication between services in a distributed system while maintaining data consistency. The pattern works by:

1. Storing outgoing messages (events) in a database table (the "outbox") as part of the same transaction that updates the business data
2. Having a separate process that reads from this outbox table and publishes the events to the appropriate destination

This approach ensures that business operations and event publishing are atomic, preventing issues where the business operation succeeds but the event publishing fails.

## Project Structure

This project consists of two main parts:

### 1. Backend Service (Node.js + MongoDB)

- Implements the transactional outbox pattern for user notifications
- Uses MongoDB transactions to ensure atomicity
- Leverages MongoDB Change Streams for real-time event processing
- Provides REST APIs for user management and monitoring

### 2. Frontend Testing UI (React)

- User Management interface for creating, updating, and deleting users
- Outbox Monitor for tracking events in the outbox
- Notification Monitor for tracking notification delivery
- Real-time updates using polling

## Prerequisites

- Node.js (v14+)
- MongoDB (v4.0+) with replica set enabled (required for Change Streams)
- npm or yarn package manager

## Installation

### Setting Up MongoDB as a Replica Set

MongoDB Change Streams require MongoDB to be deployed as a replica set. For local development, you can set up a single-node replica set:

1. Use your MongoDB replica set by adding the URL/credentials to .env:

```
.env:
MONGODB_URI="mongodb://<user>:<password>@<host addresses>/<database>"
```

### Backend Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/mongodb-outbox-pattern.git
cd mongodb-outbox-pattern
```

2. Install dependencies:

```bash
npm install
```

3. Start the backend server:

```bash
npm start
```

The backend should now be running on http://localhost:3000.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd client
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

The React frontend should now be running on http://localhost:3001 and proxying API requests to the backend.

## Usage

### Testing with the React UI

1. Open your browser and navigate to http://localhost:3001
2. Create a new user using the "Add User" button in the User Management tab
3. Watch the Outbox Monitor tab to see the outbox event being created
4. Watch the Notification Monitor tab to see the notification being processed
5. Try updating and deleting users to generate more events

### Testing with curl

You can also test the API endpoints directly using the `curl` command-line utility:

#### 1. Check System Status

```bash
curl http://localhost:3000/api/status
```

Expected response:
```json
{
  "api": true,
  "mongodb": true,
  "processor": true
}
```

#### 2. Create a User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "preferences": {
      "emailNotifications": true,
      "pushNotifications": false
    }
  }'
```

This will return the created user with an ID. Save this ID for future requests:

```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "username": "testuser",
  "email": "test@example.com",
  "preferences": {
    "emailNotifications": true,
    "pushNotifications": false
  },
  "createdAt": "2023-05-15T14:22:30.123Z"
}
```

#### 3. List All Users

```bash
curl http://localhost:3000/api/users
```

#### 4. Update a User

Replace `USER_ID` with the ID from the create response:

```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -d '{
    "email": "updated@example.com",
    "preferences": {
      "emailNotifications": false
    }
  }'
```

#### 5. Check Outbox Events

```bash
curl http://localhost:3000/api/outbox
```

This will show the outbox events generated by your user operations:

```json
[
  {
    "_id": "60d21b4667d0d8992e610c86",
    "eventType": "user.created",
    "aggregateType": "User",
    "aggregateId": "60d21b4667d0d8992e610c85",
    "payload": {
      "userId": "60d21b4667d0d8992e610c85",
      "username": "testuser",
      "email": "test@example.com"
    },
    "status": "processed",
    "createdAt": "2023-05-15T14:22:30.128Z",
    "processedAt": "2023-05-15T14:22:30.350Z"
  },
  {
    "_id": "60d21c1267d0d8992e610c87",
    "eventType": "user.updated",
    "aggregateType": "User",
    "aggregateId": "60d21b4667d0d8992e610c85",
    "payload": {
      "userId": "60d21b4667d0d8992e610c85",
      "username": "testuser",
      "updatedFields": ["email", "preferences"]
    },
    "status": "processed",
    "createdAt": "2023-05-15T14:25:38.456Z",
    "processedAt": "2023-05-15T14:25:38.789Z"
  }
]
```

#### 6. Check Notifications

```bash
curl http://localhost:3000/api/notifications
```

This will show the notifications generated from the outbox events:

```json
[
  {
    "_id": "60d21b4767d0d8992e610c88",
    "userId": "60d21b4667d0d8992e610c85",
    "outboxEventId": "60d21b4667d0d8992e610c86",
    "type": "email",
    "content": {
      "subject": "Welcome to our platform!",
      "body": "Hi testuser, welcome to our platform! We're excited to have you on board."
    },
    "status": "sent",
    "createdAt": "2023-05-15T14:22:30.250Z",
    "sentAt": "2023-05-15T14:22:30.350Z"
  },
  {
    "_id": "60d21c1367d0d8992e610c89",
    "userId": "60d21b4667d0d8992e610c85",
    "outboxEventId": "60d21c1267d0d8992e610c87",
    "type": "email",
    "content": {
      "subject": "Your account was updated",
      "body": "Hi testuser, your account information was updated. The following fields were changed: email, preferences."
    },
    "status": "sent",
    "createdAt": "2023-05-15T14:25:38.623Z",
    "sentAt": "2023-05-15T14:25:38.789Z"
  }
]
```

#### 7. Delete a User

```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID
```

Expected response:

```json
{
  "success": true,
  "deletedUser": {
    "_id": "60d21b4667d0d8992e610c85",
    "username": "testuser",
    "email": "updated@example.com",
    "preferences": {
      "emailNotifications": false,
      "pushNotifications": false
    },
    "createdAt": "2023-05-15T14:22:30.123Z"
  }
}
```

After each operation, you can check the outbox events and notifications to observe the transactional outbox pattern in action.

### API Endpoints

The following API endpoints are available for testing:

- `GET /api/status` - Check system status
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user
- `GET /api/outbox` - Get all outbox events
- `GET /api/outbox/:id` - Get a specific outbox event
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/:id` - Get a specific notification

## Implementation Details

### Transactional Outbox Flow

1. A business operation (e.g., user creation) initiates a MongoDB transaction
2. Within this transaction, both the business data (user) and an outbox event are written
3. The transaction is committed, ensuring both operations succeed or fail together
4. A separate notification processor listens to MongoDB Change Streams for new outbox events
5. When a new event is detected, the processor creates and sends the appropriate notification
6. The outbox event is marked as processed

### Key Components

- **User Service**: Handles business operations with transactional outbox pattern implementation
- **Notification Processor**: Listens to Change Streams and processes events
- **MongoDB Models**:
  - `User`: Stores user information
  - `Outbox`: The transactional outbox table
  - `Notification`: Represents a notification that has been or will be sent

## Benefits of this Approach

1. **Atomicity**: Business operations and event creation are guaranteed to be atomic
2. **Reliability**: Events are never lost, even if the notification service is down
3. **Eventual Consistency**: All events are processed eventually, ensuring data consistency
4. **Decoupling**: Business logic is decoupled from notification processing
5. **Scalability**: The notification processor can be scaled independently

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running as a replica set
- Check if the connection string is correct
- Verify MongoDB port is not blocked by a firewall

### Change Stream Not Detecting Events

- MongoDB must be running as a replica set for Change Streams to work
- Ensure the outbox collection exists
- Check that the Change Stream pipeline is correctly configured

### React App Not Connecting to API

- Verify the proxy setting in `package.json`
- Check browser console for CORS or other errors
- Ensure the backend server is running

## License

MIT

## Acknowledgments

- [MongoDB Documentation](https://docs.mongodb.com/) for Change Streams and Transactions
- [Microservices Patterns](https://microservices.io/patterns/data/transactional-outbox.html) for pattern details