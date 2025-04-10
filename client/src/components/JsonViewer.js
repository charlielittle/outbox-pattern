// File: src/components/JsonViewer.js
import React, { useState } from 'react';
import { FaCaretRight, FaCaretDown } from 'react-icons/fa';

// Component for rendering a JSON object or array node
const JsonNode = ({ data, keyName = null, depth = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(depth < 2); // Auto-expand first two levels
  
  // Determine the type of data
  const type = Array.isArray(data) ? 'array' : typeof data;
  
  // Get appropriate color for different data types
  const getValueColor = (type) => {
    switch (type) {
      case 'string': return '#ce9178'; // red-ish
      case 'number': return '#b5cea8'; // green-ish
      case 'boolean': return '#569cd6'; // blue
      case 'null': return '#569cd6'; // blue
      default: return '#d4d4d4'; // light gray
    }
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  // For null values
  if (data === null) {
    return (
      <div style={{ marginLeft: depth * 20, fontFamily: 'monospace' }}>
        {keyName !== null && (
          <span style={{ color: '#9cdcfe' }}>"{keyName}": </span>
        )}
        <span style={{ color: '#569cd6' }}>null</span>
      </div>
    );
  }

  // For primitive values (string, number, boolean)
  if (type !== 'object' && type !== 'array') {
    return (
      <div style={{ marginLeft: depth * 20, fontFamily: 'monospace' }}>
        {keyName !== null && (
          <span style={{ color: '#9cdcfe' }}>"{keyName}": </span>
        )}
        {type === 'string' ? (
          <span style={{ color: getValueColor(type) }}>"{data}"</span>
        ) : (
          <span style={{ color: getValueColor(type) }}>{String(data)}</span>
        )}
      </div>
    );
  }

  // For objects and arrays
  const isEmpty = type === 'array' ? data.length === 0 : Object.keys(data).length === 0;
  
  return (
    <div style={{ marginLeft: depth * 20, fontFamily: 'monospace' }}>
      <div onClick={toggleExpand} style={{ cursor: 'pointer', marginBottom: '2px' }}>
        {!isEmpty && (
          <span style={{ marginRight: '5px' }}>
            {isExpanded ? <FaCaretDown size={14} /> : <FaCaretRight size={14} />}
          </span>
        )}
        {keyName !== null && (
          <span style={{ color: '#9cdcfe' }}>"{keyName}": </span>
        )}
        <span>
          {type === 'array' ? '[' : '{'}
          {isEmpty ? (type === 'array' ? ']' : '}') : (isExpanded ? '' : '...')}
        </span>
        {!isExpanded && <span>{type === 'array' ? ']' : '}'}</span>}
      </div>

      {isExpanded && !isEmpty && (
        <div>
          {type === 'array' ? (
            // Render array items
            data.map((item, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <JsonNode data={item} depth={depth + 1} />
                {index < data.length - 1 && <span style={{ position: 'absolute', left: depth * 20 + 5 }}>,</span>}
              </div>
            ))
          ) : (
            // Render object properties
            Object.entries(data).map(([propKey, propValue], index, array) => (
              <div key={propKey} style={{ position: 'relative' }}>
                <JsonNode data={propValue} keyName={propKey} depth={depth + 1} />
                {index < array.length - 1 && <span style={{ position: 'absolute', left: depth * 20 + 5 }}>,</span>}
              </div>
            ))
          )}
          <div style={{ marginLeft: 0 }}>
            {type === 'array' ? ']' : '}'}
          </div>
        </div>
      )}
    </div>
  );
};

// Main JsonViewer component
const JsonViewer = ({ data }) => {
  return (
    <div 
      className="json-viewer" 
      style={{ 
        backgroundColor: '#1e1e1e', 
        color: '#d4d4d4', 
        padding: '10px', 
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '400px'
      }}
    >
      <JsonNode data={data} depth={0} />
    </div>
  );
};

export default JsonViewer;
