/**
 * Dynamic Organizational Tree - Vanilla JavaScript Implementation
 * No dependencies required - works with pure HTML/CSS/JS
 * 
 * Usage:
 * const tree = new DynamicOrgTree('container-id', orgData, options);
 */

class DynamicOrgTree {
  constructor(containerId, data, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    this.data = data;
    this.options = {
      enableDelete: options.enableDelete !== false,
      onNodeDelete: options.onNodeDelete || null,
      onNodeClick: options.onNodeClick || null,
      ...options
    };

    this.nodeRefs = new Map();
    this.dimensions = new Map();
    
    this.init();
  }

  init() {
    this.container.innerHTML = '';
    this.container.className = 'dynamic-org-tree-container';
    
    // Create SVG layer
    this.svgLayer = this.createSVGLayer();
    this.container.appendChild(this.svgLayer);

    // Create tree structure
    this.treeStructure = document.createElement('div');
    this.treeStructure.className = 'tree-structure';
    this.container.appendChild(this.treeStructure);

    this.render();
    
    // Calculate dimensions after render
    requestAnimationFrame(() => {
      this.calculateDimensions();
      this.renderConnectors();
    });

    // Recalculate on window resize
    this.resizeObserver = new ResizeObserver(() => {
      this.calculateDimensions();
      this.renderConnectors();
    });
    this.resizeObserver.observe(this.container);
  }

  createSVGLayer() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'connectors-svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';

    // Add gradient definitions
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Vertical gradient
    const gradV = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradV.setAttribute('id', 'goldGradientV');
    gradV.setAttribute('x1', '0%');
    gradV.setAttribute('y1', '0%');
    gradV.setAttribute('x2', '0%');
    gradV.setAttribute('y2', '100%');
    gradV.innerHTML = `
      <stop offset="0%" stop-color="#d4a843" />
      <stop offset="50%" stop-color="#c49530" />
      <stop offset="100%" stop-color="#b88429" />
    `;
    defs.appendChild(gradV);

    // Horizontal gradient
    const gradH = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradH.setAttribute('id', 'goldGradientH');
    gradH.setAttribute('x1', '0%');
    gradH.setAttribute('y1', '0%');
    gradH.setAttribute('x2', '100%');
    gradH.setAttribute('y2', '0%');
    gradH.innerHTML = `
      <stop offset="0%" stop-color="transparent" />
      <stop offset="5%" stop-color="#b88429" />
      <stop offset="20%" stop-color="#c49530" />
      <stop offset="50%" stop-color="#d4a843" />
      <stop offset="80%" stop-color="#c49530" />
      <stop offset="95%" stop-color="#b88429" />
      <stop offset="100%" stop-color="transparent" />
    `;
    defs.appendChild(gradH);

    svg.appendChild(defs);
    return svg;
  }

  render() {
    this.treeStructure.innerHTML = '';
    this.nodeRefs.clear();

    // Render root level
    if (this.data.root) {
      const rootLevel = document.createElement('div');
      rootLevel.className = 'tree-level level-root';
      rootLevel.appendChild(this.createNodeElement(this.data.root));
      this.treeStructure.appendChild(rootLevel);
    }

    // Render deputies level
    if (this.data.deputies && this.data.deputies.length > 0) {
      const deputiesLevel = document.createElement('div');
      deputiesLevel.className = 'tree-level level-deputies';

      this.data.deputies.forEach(deputy => {
        const deputyBranch = document.createElement('div');
        deputyBranch.className = 'deputy-branch';
        
        deputyBranch.appendChild(this.createNodeElement(deputy));

        // Add officers under deputy
        if (deputy.officers && deputy.officers.length > 0) {
          const officersGroup = document.createElement('div');
          officersGroup.className = 'officers-group';
          
          deputy.officers.forEach(officer => {
            officersGroup.appendChild(this.createNodeElement(officer));
          });
          
          deputyBranch.appendChild(officersGroup);
        }

        deputiesLevel.appendChild(deputyBranch);
      });

      this.treeStructure.appendChild(deputiesLevel);
    }
  }

  createNodeElement(node) {
    const nodeWrapper = document.createElement('div');
    nodeWrapper.className = 'org-tree-node';
    nodeWrapper.setAttribute('data-node-id', node.id);

    const nodeCard = document.createElement('div');
    nodeCard.className = 'node-card';

    // Avatar
    const avatarWrapper = document.createElement('div');
    avatarWrapper.className = 'node-avatar-wrapper';

    const avatarFrame = document.createElement('div');
    avatarFrame.className = 'node-avatar-frame';

    const img = document.createElement('img');
    img.src = node.image || 'logo.png';
    img.alt = node.name;
    img.onerror = () => { img.src = 'logo.png'; };
    avatarFrame.appendChild(img);
    avatarWrapper.appendChild(avatarFrame);

    // Verified badge
    if (node.verified) {
      const verifiedBadge = document.createElement('div');
      verifiedBadge.className = 'node-verified-badge';
      verifiedBadge.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      `;
      avatarWrapper.appendChild(verifiedBadge);
    }

    nodeCard.appendChild(avatarWrapper);

    // Name
    const name = document.createElement('h3');
    name.className = 'node-name';
    name.textContent = node.name;
    nodeCard.appendChild(name);

    // Role badge
    const roleBadge = document.createElement('div');
    roleBadge.className = 'node-role-badge';
    roleBadge.textContent = node.role;
    nodeCard.appendChild(roleBadge);

    // Contact info
    if (node.phone) {
      const contact = document.createElement('div');
      contact.className = 'node-contact';
      
      const icon = document.createElement('span');
      icon.className = 'contact-icon';
      icon.textContent = '📞';
      contact.appendChild(icon);

      const number = document.createElement('span');
      number.className = 'contact-number';
      number.textContent = node.phone;
      contact.appendChild(number);

      if (node.carrier) {
        const carrier = document.createElement('span');
        carrier.className = `carrier-badge carrier-${node.carrier.toLowerCase()}`;
        carrier.textContent = node.carrier;
        contact.appendChild(carrier);
      }

      nodeCard.appendChild(contact);
    }

    // Social links
    if (node.facebook || node.telegram) {
      const socials = document.createElement('div');
      socials.className = 'node-socials';

      if (node.facebook) {
        const fb = document.createElement('a');
        fb.href = node.facebook;
        fb.target = '_blank';
        fb.rel = 'noopener noreferrer';
        fb.className = 'social-link';
        fb.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        `;
        socials.appendChild(fb);
      }

      if (node.telegram) {
        const tg = document.createElement('a');
        tg.href = node.telegram;
        tg.target = '_blank';
        tg.rel = 'noopener noreferrer';
        tg.className = 'social-link';
        tg.innerHTML = `
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.795-.169.724-.436.966-.693.989-.56.051-.985-.371-1.528-.727-.849-.556-1.329-.901-2.154-1.444-.954-.628-.336-.973.208-1.538.142-.148 2.613-2.396 2.661-2.602.006-.026.012-.124-.047-.176-.058-.052-.144-.034-.207-.02-.089.02-1.503.956-4.244 2.808-.402.276-.766.411-1.093.404-.36-.008-1.052-.204-1.567-.372-.632-.206-1.134-.316-1.09-.667.023-.183.273-.37.75-.56 2.936-1.278 4.896-2.122 5.88-2.532 2.798-1.164 3.38-1.366 3.76-1.372.083-.001.27.02.39.119.102.083.131.196.143.276.014.092.029.297.017.46z"/>
          </svg>
        `;
        socials.appendChild(tg);
      }

      nodeCard.appendChild(socials);
    }

    // Delete button
    if (this.options.enableDelete) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'node-delete-btn';
      deleteBtn.textContent = '✕';
      deleteBtn.setAttribute('aria-label', 'Delete node');
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.handleDelete(node.id);
      };
      nodeCard.appendChild(deleteBtn);
    }

    // Click handler
    if (this.options.onNodeClick) {
      nodeCard.style.cursor = 'pointer';
      nodeCard.onclick = () => this.options.onNodeClick(node);
    }

    nodeWrapper.appendChild(nodeCard);
    this.nodeRefs.set(node.id, nodeWrapper);
    
    return nodeWrapper;
  }

  calculateDimensions() {
    this.dimensions.clear();
    const containerRect = this.container.getBoundingClientRect();

    this.nodeRefs.forEach((nodeEl, id) => {
      const rect = nodeEl.getBoundingClientRect();
      this.dimensions.set(id, {
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        centerX: rect.left - containerRect.left + rect.width / 2,
        centerY: rect.top - containerRect.top + rect.height / 2
      });
    });
  }

  renderConnectors() {
    // Clear existing connectors
    const existingConnectors = this.svgLayer.querySelectorAll(':not(defs)');
    existingConnectors.forEach(el => el.remove());

    if (this.dimensions.size === 0) return;

    // Set SVG height
    const maxY = Math.max(...Array.from(this.dimensions.values()).map(d => d.y + d.height));
    this.svgLayer.setAttribute('height', maxY + 100);

    // Draw connections
    if (this.data.root && this.dimensions.has(this.data.root.id)) {
      const deputyIds = (this.data.deputies || []).map(d => d.id);
      this.drawConnection(this.data.root.id, deputyIds, 'root-deputies');

      // Draw deputy to officers connections
      (this.data.deputies || []).forEach((deputy, idx) => {
        if (deputy.officers && deputy.officers.length > 0) {
          const officerIds = deputy.officers.map(o => o.id);
          this.drawConnection(deputy.id, officerIds, `deputy-${idx}-officers`);
        }
      });
    }
  }

  drawConnection(parentId, childrenIds, connectorId) {
    const parent = this.dimensions.get(parentId);
    if (!parent) return;

    const children = childrenIds
      .map(id => this.dimensions.get(id))
      .filter(Boolean);

    if (children.length === 0) return;

    const parentBottom = parent.centerY + parent.height / 2;
    const verticalLineHeight = 40;
    const horizontalY = parentBottom + verticalLineHeight;

    // Vertical line from parent
    this.createSVGLine(
      parent.centerX, parentBottom,
      parent.centerX, horizontalY,
      'connector-line connector-vertical'
    );

    // Junction node
    this.createSVGCircle(parent.centerX, horizontalY, 5, 'connector-node');

    if (children.length > 1) {
      const leftMost = Math.min(...children.map(c => c.centerX));
      const rightMost = Math.max(...children.map(c => c.centerX));

      // Horizontal bar
      this.createSVGLine(
        leftMost, horizontalY,
        rightMost, horizontalY,
        'connector-line connector-horizontal'
      );
    }

    // Vertical lines to children
    children.forEach(child => {
      this.createSVGLine(
        child.centerX, horizontalY,
        child.centerX, child.centerY - child.height / 2,
        'connector-line connector-vertical'
      );
      this.createSVGCircle(child.centerX, horizontalY, 5, 'connector-node');
    });
  }

  createSVGLine(x1, y1, x2, y2, className) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', className);
    line.setAttribute('stroke-width', '3');
    this.svgLayer.appendChild(line);
  }

  createSVGCircle(cx, cy, r, className) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('class', className);
    this.svgLayer.appendChild(circle);
  }

  handleDelete(nodeId) {
    if (this.options.onNodeDelete) {
      this.options.onNodeDelete(nodeId);
    } else {
      // Default delete behavior
      this.deleteNode(nodeId);
    }
  }

  deleteNode(nodeId) {
    // Don't allow deleting root
    if (this.data.root && this.data.root.id === nodeId) {
      alert('Cannot delete root node!');
      return;
    }

    // Check if it's a deputy
    const deputyIndex = (this.data.deputies || []).findIndex(d => d.id === nodeId);
    if (deputyIndex !== -1) {
      this.data.deputies.splice(deputyIndex, 1);
      this.refresh();
      return;
    }

    // Check if it's an officer
    if (this.data.deputies) {
      for (let deputy of this.data.deputies) {
        if (deputy.officers) {
          const officerIndex = deputy.officers.findIndex(o => o.id === nodeId);
          if (officerIndex !== -1) {
            deputy.officers.splice(officerIndex, 1);
            this.refresh();
            return;
          }
        }
      }
    }
  }

  refresh() {
    this.render();
    requestAnimationFrame(() => {
      this.calculateDimensions();
      this.renderConnectors();
    });
  }

  updateData(newData) {
    this.data = newData;
    this.refresh();
  }

  destroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.container.innerHTML = '';
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DynamicOrgTree;
}
