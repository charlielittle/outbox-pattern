// File: src/components/UserManagement.js
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form,
  Spinner,
  Badge
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUserEdit, FaUserMinus, FaSync } from 'react-icons/fa';
import ApiService from '../services/ApiService';

function UserManagement() {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    preferences: {
      emailNotifications: true,
      pushNotifications: false
    }
  });
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const fetchedUsers = await ApiService.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Form change handler
  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name.includes('.')) {
      // Handle nested properties like preferences.emailNotifications
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      // Handle top-level properties
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const newUser = await ApiService.createUser(formData);
      setUsers([...users, newUser]);
      setShowCreateModal(false);
      toast.success(`User ${newUser.username} created successfully`);
      resetForm();
    } catch (error) {
      toast.error('Failed to create user');
      console.error('Error creating user:', error);
    }
  };

  // Edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await ApiService.updateUser(currentUserId, formData);
      setUsers(users.map(user => 
        user._id === currentUserId ? updatedUser : user
      ));
      setShowEditModal(false);
      toast.success(`User ${updatedUser.username} updated successfully`);
    } catch (error) {
      toast.error('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      await ApiService.deleteUser(currentUserId);
      setUsers(users.filter(user => user._id !== currentUserId));
      setShowDeleteModal(false);
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  // Modal handlers
  const openEditModal = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      preferences: { ...user.preferences }
    });
    setCurrentUserId(user._id);
    setShowEditModal(true);
  };

  const openDeleteModal = (userId) => {
    setCurrentUserId(userId);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      preferences: {
        emailNotifications: true,
        pushNotifications: false
      }
    });
  };

  return (
    <div className="user-management">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2>Users</h2>
          <div>
            <Button 
              variant="outline-primary" 
              className="me-2" 
              onClick={fetchUsers}
            >
              <FaSync /> Refresh
            </Button>
            <Button 
              variant="primary" 
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <FaUserPlus /> Add User
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center p-5">
              <p>No users found. Create a new user to get started.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Notification Preferences</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <Badge bg={user.preferences.emailNotifications ? "success" : "secondary"} className="me-2">
                        Email: {user.preferences.emailNotifications ? "On" : "Off"}
                      </Badge>
                      <Badge bg={user.preferences.pushNotifications ? "success" : "secondary"}>
                        Push: {user.preferences.pushNotifications ? "On" : "Off"}
                      </Badge>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleString()}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        className="me-2"
                        onClick={() => openEditModal(user)}
                      >
                        <FaUserEdit /> Edit
                      </Button>
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => openDeleteModal(user._id)}
                      >
                        <FaUserMinus /> Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Create User Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCreateUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control 
                type="text" 
                name="username"
                value={formData.username} 
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Enable Email Notifications" 
                name="preferences.emailNotifications"
                checked={formData.preferences.emailNotifications}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Enable Push Notifications" 
                name="preferences.pushNotifications"
                checked={formData.preferences.pushNotifications}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Create User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditUser}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control 
                type="text" 
                name="username"
                value={formData.username} 
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Enable Email Notifications" 
                name="preferences.emailNotifications"
                checked={formData.preferences.emailNotifications}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox" 
                label="Enable Push Notifications" 
                name="preferences.pushNotifications"
                checked={formData.preferences.pushNotifications}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update User
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Delete User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this user? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteUser}>
            Delete User
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default UserManagement;
