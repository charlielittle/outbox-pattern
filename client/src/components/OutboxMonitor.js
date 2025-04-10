// File: src/components/OutboxMonitor.js
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
import { FaSync, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import JsonViewer from './JsonViewer';
import ApiService from '../services/ApiService';

function OutboxMonitor() {
  // State
  const [outboxEvents, setOutboxEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Load outbox events on component mount and refreshCount change
  useEffect(() => {
    fetchOutboxEvents();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchOutboxEvents();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refreshCount]);

  // Fetch outbox events from API
  const fetchOutboxEvents = async () => {
    setLoading(true);
    try {
      const events = await ApiService.getOutboxEvents();
      setOutboxEvents(events);
    } catch (error) {
      toast.error('Failed to fetch outbox events');
      console.error('Error fetching outbox events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get badge variant based on status
  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'processed': return 'success';
      case 'failed': return 'danger';
      default: return 'secondary';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="outbox-monitor">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h2>Outbox Events</h2>
          <Button 
            variant="outline-primary" 
            onClick={() => setRefreshCount(refreshCount + 1)}
            disabled={loading}
          >
            <FaSync /> Refresh
          </Button>
        </Card.Header>
        <Card.Body>
          {loading && outboxEvents.length === 0 ? (
            <div className="text-center p-5">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : outboxEvents.length === 0 ? (
            <div className="text-center p-5">
              <p>No outbox events found. Create a user to generate events.</p>
            </div>
          ) : (
            <Row xs={1} md={2} className="g-4">
              {outboxEvents.map(event => (
                <Col key={event._id}>
                  <Card className="event-card">
                    <Card.Header>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5>{event.eventType}</h5>
                        <Badge 
                          bg={getStatusBadgeVariant(event.status)} 
                          className="notification-badge"
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <small className="text-muted">{event._id}</small>
                    </Card.Header>
                    <Card.Body>
                      <Accordion defaultActiveKey="0">
                        <Accordion.Item eventKey="0">
                          <Accordion.Header>Event Details</Accordion.Header>
                          <Accordion.Body>
                            <div className="mb-3">
                              <strong>Aggregate Type:</strong> {event.aggregateType}
                            </div>
                            <div className="mb-3">
                              <strong>Aggregate ID:</strong> {event.aggregateId}
                            </div>
                            <div className="mb-3">
                              <strong>Created At:</strong> {formatDate(event.createdAt)}
                            </div>
                            <div>
                              <strong>Processed At:</strong> {formatDate(event.processedAt)}
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                        <Accordion.Item eventKey="1">
                          <Accordion.Header>Payload</Accordion.Header>
                          <Accordion.Body>
                            <div className="json-view-container">
                              <JsonViewer 
                                src={event.payload} 
                                theme="monokai" 
                                name={false} 
                                collapsed={false} 
                                displayDataTypes={false}
                                displayObjectSize={false}
                              />
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      </Accordion>
                      
                      <div className="mt-3 text-center">
                        {event.status === 'processed' ? (
                          <div className="text-success">
                            <FaCheckCircle /> Successfully processed
                          </div>
                        ) : event.status === 'failed' ? (
                          <div className="text-danger">
                            <FaExclamationTriangle /> Processing failed
                          </div>
                        ) : null}
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

export default OutboxMonitor;
