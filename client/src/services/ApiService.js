// File: src/services/ApiService.js
import axios from 'axios';

// Base API URL
const API_BASE_URL = '/api';

// API Service for communicating with the backend
class ApiService {
  // System status
  async getSystemStatus() {
    try {
      const response = await axios.get(`${API_BASE_URL}/status`);
      return response.data;
    } catch (error) {
      console.error('Error getting system status:', error);
      return { api: false, mongodb: false, processor: false };
    }
  }

  // User operations
  async getUsers() {
    const response = await axios.get(`${API_BASE_URL}/users`);
    return response.data;
  }

  async createUser(userData) {
    const response = await axios.post(`${API_BASE_URL}/users`, userData);
    return response.data;
  }

  async updateUser(userId, userData) {
    const response = await axios.put(`${API_BASE_URL}/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId) {
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`);
    return response.data;
  }

  // Outbox operations
  async getOutboxEvents() {
    const response = await axios.get(`${API_BASE_URL}/outbox`);
    return response.data;
  }

  async getOutboxEvent(eventId) {
    const response = await axios.get(`${API_BASE_URL}/outbox/${eventId}`);
    return response.data;
  }

  // Notification operations
  async getNotifications() {
    const response = await axios.get(`${API_BASE_URL}/notifications`);
    return response.data;
  }

  async getNotification(notificationId) {
    const response = await axios.get(`${API_BASE_URL}/notifications/${notificationId}`);
    return response.data;
  }
}

const apiService = new ApiService();
export default apiService;
