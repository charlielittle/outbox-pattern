// File: src/App.js
import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab } from 'react-bootstrap';
import { ToastContainer } from 'react-toastify';
import UserManagement from './components/UserManagement';
import OutboxMonitor from './components/OutboxMonitor';
import NotificationMonitor from './components/NotificationMonitor';
import ApiService from './services/ApiService';
import './App.css';

function App() {
  // Track active tab
  const [key, setKey] = useState('users');
  
  // System status
  const [systemStatus, setSystemStatus] = useState({ 
    api: false, 
    mongodb: false, 
    processor: false 
  });

  // Check system status on component mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await ApiService.getSystemStatus();
        setSystemStatus(status);
      } catch (error) {
        console.error('Error checking system status:', error);
        // If we can't connect, assume everything is down
        setSystemStatus({ api: false, mongodb: false, processor: false });
      }
    };
    
    checkStatus();
    // Check status every 10 seconds
    const interval = setInterval(checkStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="App">
      <Container fluid className="pt-3 pb-5">
        <header className="App-header mb-4">
          <h1>Transactional Outbox Pattern Tester</h1>
          <div className="status-indicators">
            <div className={`status-indicator ${systemStatus.api ? 'status-ok' : 'status-error'}`}>
              API: {systemStatus.api ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`status-indicator ${systemStatus.mongodb ? 'status-ok' : 'status-error'}`}>
              MongoDB: {systemStatus.mongodb ? 'Connected' : 'Disconnected'}
            </div>
            <div className={`status-indicator ${systemStatus.processor ? 'status-ok' : 'status-error'}`}>
              Notification Processor: {systemStatus.processor ? 'Running' : 'Stopped'}
            </div>
          </div>
        </header>
        
        <Tabs
          activeKey={key}
          onSelect={(k) => setKey(k)}
          className="mb-4"
        >
          <Tab eventKey="users" title="User Management">
            <UserManagement />
          </Tab>
          <Tab eventKey="outbox" title="Outbox Monitor">
            <OutboxMonitor />
          </Tab>
          <Tab eventKey="notifications" title="Notification Monitor">
            <NotificationMonitor />
          </Tab>
        </Tabs>
      </Container>
      
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;
