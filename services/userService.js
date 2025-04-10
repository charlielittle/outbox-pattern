// Now, let's implement the service for user operations with transactional outbox

// services/userService.js
const mongoose = require('mongoose');
const User = require('../models/user');
const Outbox = require('../models/outbox');

class UserService {
  /**
   * Create a new user with transactional outbox pattern
   */
  async createUser(userData) {
    // Start a MongoDB session for the transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create user within the transaction
      const user = new User(userData);
      await user.save({ session });

      // Create outbox event for user creation notification
      const outboxEvent = new Outbox({
        eventType: 'user.created',
        aggregateType: 'User',
        aggregateId: user._id,
        payload: {
          userId: user._id,
          username: user.username,
          email: user.email
        }
      });
      await outboxEvent.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return user;
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Update user with transactional outbox pattern
   */
  async updateUser(userId, updateData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update user within transaction
      const user = await User.findByIdAndUpdate(
        userId, 
        updateData, 
        { new: true, session }
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Create outbox event for user update notification
      const outboxEvent = new Outbox({
        eventType: 'user.updated',
        aggregateType: 'User',
        aggregateId: user._id,
        payload: {
          userId: user._id,
          username: user.username,
          updatedFields: Object.keys(updateData)
        }
      });
      await outboxEvent.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return user;
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Delete user with transactional outbox pattern
   */
  async deleteUser(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find user first to include in outbox
      const user = await User.findById(userId).session(session);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Delete user
      await User.deleteOne({ _id: userId }).session(session);

      // Create outbox event for user deletion
      const outboxEvent = new Outbox({
        eventType: 'user.deleted',
        aggregateType: 'User',
        aggregateId: user._id,
        payload: {
          userId: user._id,
          username: user.username,
          email: user.email
        }
      });
      await outboxEvent.save({ session });

      // Commit the transaction
      await session.commitTransaction();
      session.endSession();

      return { success: true, deletedUser: user };
    } catch (error) {
      // Abort the transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new UserService();
