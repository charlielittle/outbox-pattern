// File: src/components/NotificationMonitor.js
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Spinner,
  Row, 
  Col,
  Badge,
  Accordion
} from 'react-bootstrap';
import { toast } from 'react-toastify';
import { FaSync, FaExclamationTriangle, FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import JsonViewer from './JsonViewer';
import ApiService from '../services/ApiService';

function NotificationMonitor() {
  // State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Load notifications on component mount and refreshCount change
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchNotifications();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const fetchedNotifications = await ApiService.getNotifications();
      setNotifications(fetchedNotifications);
    } catch (error) {
      toast.error('Failed to fetch notifications');
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'queued': return 'secondary';
      case 'sent': return 'primary';
      case 'delivered': return 'success';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'email':
        return <FaEnvelope />;
      default:
        return <FaEnvelope />;
    }
  };

  return (
    <div className="notification-monitor">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2>Notifications</h2>
          <Button 
            variant="outline-primary" 
            onClick={() => setRefreshCount(refreshCount + 1)}
            disabled={loading}
          >
            <FaSync /> Refresh
          </Button>
        </Card.Header>
        <Card.Body>
          {loading && notifications.length === 0 ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center p-5">
              <p>No notifications found. Create a user to generate notifications.</p>
            </div>
          ) : (
            <Row xs={1} md={2} className="g-4">
              {notifications.map(notification => (
                <Col key={notification._id}>
                  <Card className="event-card">
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5>
                          {getNotificationIcon(notification.type)} {notification.type.toUpperCase()} Notification
                        </h5>
                        <Badge 
                          bg={getStatusBadgeVariant(notification.status)} 
                          className="notification-badge"
                        >
                          {notification.status}
                        </Badge>
                      </div>
                      <small className="text-muted">{notification._id}</small>
                    </Card.Header>
                    <Card.Body>
                      <Accordion defaultActiveKey="0">
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>Notification Details</Accordion.Header>
                          <Accordion.Body>
                            <div className="mb-2">
                              <strong>User ID:</strong> {notification.userId}
                            </div>
                            <div className="mb-2">
                              <strong>Created At:</strong> {formatDate(notification.createdAt)}
                            </div>
                            <div className="mb-2">
                              <strong>Sent At:</strong> {formatDate(notification.sentAt)}
                            </div>
                            <div className="mb-2">
                              <strong>Delivered At:</strong> {formatDate(notification.deliveredAt)}
                            </div>
                            <div className="mb-2">
                              <strong>Subject:</strong> {notification.content.subject}
                            </div>
                            <div className="mb-2">
                              <strong>Body:</strong> {notification.content.body}
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                        {notification.content.data && (
                          <Accordion.Item eventKey="1">
                            <Accordion.Header>Additional Data</Accordion.Header>
                            <Accordion.Body>
                              <div className="json-view-container">
                                <JsonViewer 
                                  src={notification.content.data} 
                                  theme="monokai" 
                                  name={false} 
                                  collapsed={false} 
                                  displayDataTypes={false}
                                  displayObjectSize={false}
                                />
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        )}
                      </Accordion>
                      
                      <div className="mt-3 text-center">
                        {notification.status === 'delivered' ? (
                          <div className="text-success">
                            <FaCheckCircle /> Successfully delivered
                          </div>
                        ) : notification.status === 'failed' ? (
                          <div className="text-danger">
                            <FaExclamationTriangle /> Delivery failed
                          </div>
                        ) : notification.status === 'sent' ? (
                          <div className="text-primary">
                            <FaEnvelope /> Notification sent
                          </div>
                        ) : (
                          <div className="text-secondary">
                            <FaEnvelope /> Waiting to be sent
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default NotificationMonitor;
