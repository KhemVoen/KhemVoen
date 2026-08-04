import React, { useState, useEffect, useRef } from 'react';
import './DynamicOrgTree.css';

/**
 * Dynamic Organizational Hierarchy Tree Component
 * Features:
 * - Auto-alignment and spacing recalculation
 * - Seamless SVG connecting lines
 * - Responsive design
 * - JSON-driven structure
 */

const DynamicOrgTree = ({ data, onNodeDelete }) => {
  const [treeData, setTreeData] = useState(data);
  const [dimensions, setDimensions] = useState({});
  const containerRef = useRef(null);
  const nodeRefs = useRef({});

  // Recalculate dimensions when tree data changes
  useEffect(() => {
    calculateDimensions();
  }, [treeData]);

  const calculateDimensions = () => {
    const newDimensions = {};
    Object.keys(nodeRefs.current).forEach(key => {
      const node = nodeRefs.current[key];
      if (node) {
        const rect = node.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();
        newDimensions[key] = {
          x: rect.left - (containerRect?.left || 0),
          y: rect.top - (containerRect?.top || 0),
          width: rect.width,
          height: rect.height,
          centerX: rect.left - (containerRect?.left || 0) + rect.width / 2,
          centerY: rect.top - (containerRect?.top || 0) + rect.height / 2
        };
      }
    });
    setDimensions(newDimensions);
  };

  const handleDelete = (nodeId) => {
    if (onNodeDelete) {
      onNodeDelete(nodeId);
    }
  };

  const renderNode = (node) => {
    if (!node) return null;

    return (
      <div
        key={node.id}
        ref={el => nodeRefs.current[node.id] = el}
        className="org-tree-node"
        data-node-id={node.id}
      >
        <div className="node-card">
          {/* Avatar/Logo */}
          <div className="node-avatar-wrapper">
            <div className="node-avatar-frame">
              <img 
                src={node.image || 'logo.png'} 
                alt={node.name}
                onError={(e) => e.target.src = 'logo.png'}
              />
            </div>
            {node.verified && (
              <div className="node-verified-badge">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
              </div>
            )}
          </div>

          {/* Primary Name/Title */}
          <h3 className="node-name">{node.name}</h3>

          {/* Role Badge */}
          <div className="node-role-badge">
            {node.role}
          </div>

          {/* Phone/Contact Info */}
          {node.phone && (
            <div className="node-contact">
              <span className="contact-icon">📞</span>
              <span className="contact-number">{node.phone}</span>
              {node.carrier && (
                <span className={`carrier-badge carrier-${node.carrier.toLowerCase()}`}>
                  {node.carrier}
                </span>
              )}
            </div>
          )}

          {/* Social Links */}
          {(node.facebook || node.telegram) && (
            <div className="node-socials">
              {node.facebook && (
                <a href={node.facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              {node.telegram && (
                <a href={node.telegram} target="_blank" rel="noopener noreferrer" className="social-link">
                  <svg viewBox="0 0 24 24" width="16" height="16">
                    <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.795-.169.724-.436.966-.693.989-.56.051-.985-.371-1.528-.727-.849-.556-1.329-.901-2.154-1.444-.954-.628-.336-.973.208-1.538.142-.148 2.613-2.396 2.661-2.602.006-.026.012-.124-.047-.176-.058-.052-.144-.034-.207-.02-.089.02-1.503.956-4.244 2.808-.402.276-.766.411-1.093.404-.36-.008-1.052-.204-1.567-.372-.632-.206-1.134-.316-1.09-.667.023-.183.273-.37.75-.56 2.936-1.278 4.896-2.122 5.88-2.532 2.798-1.164 3.38-1.366 3.76-1.372.083-.001.27.02.39.119.102.083.131.196.143.276.014.092.029.297.017.46z"/>
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Delete Button (for demo/admin) */}
          {onNodeDelete && (
            <button 
              className="node-delete-btn"
              onClick={() => handleDelete(node.id)}
              aria-label="Delete node"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderConnectors = () => {
    if (!containerRef.current || Object.keys(dimensions).length === 0) {
      return null;
    }

    const connectors = [];

    // Function to draw connection between parent and children
    const drawConnection = (parentId, childrenIds, connectorId) => {
      const parent = dimensions[parentId];
      if (!parent) return;

      const visibleChildren = childrenIds
        .map(id => dimensions[id])
        .filter(Boolean);

      if (visibleChildren.length === 0) return;

      // Calculate positions
      const parentBottom = parent.centerY + parent.height / 2;
      const childrenTop = Math.min(...visibleChildren.map(c => c.centerY - c.height / 2));
      
      const leftMostChild = Math.min(...visibleChildren.map(c => c.centerX));
      const rightMostChild = Math.max(...visibleChildren.map(c => c.centerX));

      const verticalLineHeight = 40;
      const horizontalY = parentBottom + verticalLineHeight;

      // Vertical line from parent down
      connectors.push(
        <line
          key={`${connectorId}-v-main`}
          x1={parent.centerX}
          y1={parentBottom}
          x2={parent.centerX}
          y2={horizontalY}
          className="connector-line connector-vertical"
          strokeWidth="3"
        />
      );

      // Node at junction
      connectors.push(
        <circle
          key={`${connectorId}-node-main`}
          cx={parent.centerX}
          cy={horizontalY}
          r="5"
          className="connector-node"
        />
      );

      // Horizontal bar connecting all children
      if (visibleChildren.length > 1) {
        connectors.push(
          <line
            key={`${connectorId}-h-bar`}
            x1={leftMostChild}
            y1={horizontalY}
            x2={rightMostChild}
            y2={horizontalY}
            className="connector-line connector-horizontal"
            strokeWidth="3"
          />
        );
      }

      // Vertical lines down to each child
      visibleChildren.forEach((child, idx) => {
        connectors.push(
          <line
            key={`${connectorId}-v-child-${idx}`}
            x1={child.centerX}
            y1={horizontalY}
            x2={child.centerX}
            y2={child.centerY - child.height / 2}
            className="connector-line connector-vertical"
            strokeWidth="3"
          />
        );

        // Node at child junction
        connectors.push(
          <circle
            key={`${connectorId}-node-child-${idx}`}
            cx={child.centerX}
            cy={horizontalY}
            r="5"
            className="connector-node"
          />
        );
      });
    };

    // Draw connections based on tree structure
    if (treeData.root && dimensions[treeData.root.id]) {
      const deputyIds = treeData.deputies?.map(d => d.id) || [];
      drawConnection(treeData.root.id, deputyIds, 'root-deputies');

      // Draw connections for each deputy to their officers
      treeData.deputies?.forEach((deputy, dIdx) => {
        if (deputy.officers && deputy.officers.length > 0) {
          const officerIds = deputy.officers.map(o => o.id);
          drawConnection(deputy.id, officerIds, `deputy-${dIdx}-officers`);
        }
      });
    }

    return connectors;
  };

  const getContainerHeight = () => {
    if (Object.keys(dimensions).length === 0) return 'auto';
    const maxY = Math.max(...Object.values(dimensions).map(d => d.y + d.height));
    return maxY + 100;
  };

  return (
    <div className="dynamic-org-tree-wrapper">
      <div 
        className="dynamic-org-tree-container" 
        ref={containerRef}
        style={{ minHeight: getContainerHeight() }}
      >
        {/* SVG Layer for Connectors */}
        <svg className="connectors-svg" style={{ height: getContainerHeight() }}>
          <defs>
            <linearGradient id="goldGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d4a843" />
              <stop offset="50%" stopColor="#c49530" />
              <stop offset="100%" stopColor="#b88429" />
            </linearGradient>
            <linearGradient id="goldGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="5%" stopColor="#b88429" />
              <stop offset="20%" stopColor="#c49530" />
              <stop offset="50%" stopColor="#d4a843" />
              <stop offset="80%" stopColor="#c49530" />
              <stop offset="95%" stopColor="#b88429" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          {renderConnectors()}
        </svg>

        {/* Tree Levels */}
        <div className="tree-structure">
          {/* Root Level */}
          {treeData.root && (
            <div className="tree-level level-root">
              {renderNode(treeData.root)}
            </div>
          )}

          {/* Deputies Level */}
          {treeData.deputies && treeData.deputies.length > 0 && (
            <div className="tree-level level-deputies">
              {treeData.deputies.map(deputy => (
                <div key={deputy.id} className="deputy-branch">
                  {renderNode(deputy)}
                  
                  {/* Officers under this deputy */}
                  {deputy.officers && deputy.officers.length > 0 && (
                    <div className="officers-group">
                      {deputy.officers.map(officer => renderNode(officer))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicOrgTree;
