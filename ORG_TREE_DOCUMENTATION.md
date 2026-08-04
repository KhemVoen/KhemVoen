# Dynamic Organizational Hierarchy Tree Component

## 📋 Overview

A fully responsive, auto-aligning organizational hierarchy tree component with seamless SVG connecting lines. Built with both React and Vanilla JavaScript implementations.

## ✨ Key Features

### 1. **Dynamic Auto-Alignment**
- Automatically recalculates spacing when nodes are added/removed
- Maintains perfect visual balance and symmetry
- No gaps, broken lines, or overlapping elements
- Smooth transitions during reflow

### 2. **Seamless SVG Connectors**
- Continuous, unbroken horizontal and vertical lines
- Golden gradient styling with depth effects
- Animated flowing gold effect
- Pulsing junction nodes
- Auto-adjusting width and branch positions

### 3. **Rich Node Components**
- Circular avatar with gold border accents
- Primary name/title display
- Role badge with gradient styling
- Contact information with carrier badges
- Social media links
- Verified badge for special members
- Delete button (optional, admin mode)

### 4. **Responsive Design**
- Desktop: Full animations and effects
- Tablet: Optimized spacing
- Mobile: Simplified view, performance-optimized
- Horizontal scroll support for small screens

### 5. **Performance Optimized**
- CSS animations with hardware acceleration
- Disabled animations on mobile
- Efficient DOM updates
- ResizeObserver for smart recalculation

---

## 🚀 Quick Start

### React Implementation

```jsx
import DynamicOrgTree from './DynamicOrgTree';
import './DynamicOrgTree.css';

function App() {
  const orgData = {
    root: { id: 'r1', name: 'CEO', role: 'Chief', image: 'ceo.jpg' },
    deputies: [
      {
        id: 'd1',
        name: 'VP Sales',
        role: 'Vice President',
        image: 'vp1.jpg',
        officers: [
          { id: 'o1', name: 'Manager 1', role: 'Sales Manager', image: 'm1.jpg' }
        ]
      }
    ]
  };

  const handleDelete = (nodeId) => {
    console.log('Delete:', nodeId);
  };

  return (
    <DynamicOrgTree 
      data={orgData} 
      onNodeDelete={handleDelete}
    />
  );
}
```

### Vanilla JavaScript Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="DynamicOrgTree.css">
</head>
<body>
  <div id="orgTreeContainer"></div>
  
  <script src="DynamicOrgTree.js"></script>
  <script>
    const orgData = { /* your data */ };
    
    const tree = new DynamicOrgTree('orgTreeContainer', orgData, {
      enableDelete: true,
      onNodeDelete: (id) => console.log('Deleted:', id),
      onNodeClick: (node) => console.log('Clicked:', node)
    });
  </script>
</body>
</html>
```

---

## 📊 Data Structure

### JSON Format

```json
{
  "root": {
    "id": "root-1",
    "name": "John Doe",
    "role": "Chief Executive",
    "image": "path/to/image.jpg",
    "phone": "012 345 678",
    "carrier": "Cellcard",
    "facebook": "https://facebook.com/...",
    "telegram": "https://t.me/...",
    "verified": true
  },
  "deputies": [
    {
      "id": "deputy-1",
      "name": "Jane Smith",
      "role": "Vice President",
      "image": "path/to/image.jpg",
      "phone": "011 222 333",
      "carrier": "Smart",
      "verified": true,
      "officers": [
        {
          "id": "officer-1-1",
          "name": "Bob Johnson",
          "role": "Manager",
          "image": "path/to/image.jpg",
          "phone": "010 444 555",
          "carrier": "Metfone"
        }
      ]
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | ✅ Yes | Unique identifier |
| `name` | string | ✅ Yes | Display name |
| `role` | string | ✅ Yes | Position/role title |
| `image` | string | ❌ No | Avatar image URL |
| `phone` | string | ❌ No | Contact number |
| `carrier` | string | ❌ No | Phone carrier (Cellcard, Smart, Metfone) |
| `facebook` | string | ❌ No | Facebook profile URL |
| `telegram` | string | ❌ No | Telegram profile URL |
| `verified` | boolean | ❌ No | Shows verified badge |
| `officers` | array | ❌ No | Child nodes (deputies only) |

---

## 🎨 Styling & Customization

### CSS Variables

Add to your stylesheet to customize colors:

```css
:root {
  /* Primary Colors */
  --primary-color: #1a3a5c;
  --secondary-color: #2c5282;
  
  /* Gold Accents */
  --gold-light: #d4a843;
  --gold-mid: #c49530;
  --gold-dark: #b88429;
  
  /* Background */
  --bg-cream: #fdf8f0;
  --bg-white: #ffffff;
  
  /* Text */
  --text-primary: #1a3a5c;
  --text-secondary: #64748b;
}
```

### Custom Node Styling

```css
/* Custom avatar size */
.node-avatar-frame {
  width: 120px !important;
  height: 120px !important;
}

/* Custom role badge */
.node-role-badge {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* Custom connector color */
.connector-vertical {
  stroke: #3b82f6 !important;
}
```

---

## 🔧 API Reference

### React Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | object | required | Org tree data structure |
| `onNodeDelete` | function | null | Callback when node deleted |
| `onNodeClick` | function | null | Callback when node clicked |

### Vanilla JS Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableDelete` | boolean | true | Show delete buttons |
| `onNodeDelete` | function | null | Delete callback |
| `onNodeClick` | function | null | Click callback |

### Methods (Vanilla JS)

```javascript
// Update tree data
tree.updateData(newData);

// Refresh render
tree.refresh();

// Delete specific node
tree.deleteNode(nodeId);

// Recalculate dimensions
tree.calculateDimensions();

// Cleanup
tree.destroy();
```

---

## 📱 Responsive Breakpoints

| Screen Size | Behavior |
|-------------|----------|
| > 1400px | Full size, all animations |
| 1024-1400px | Slightly smaller cards |
| 768-1024px | Reduced spacing, all animations |
| 480-768px | Compact view, animations disabled |
| < 480px | Minimal view, static lines |

---

## 🎯 Use Cases

### 1. Temple/Religious Organization
```javascript
const templeData = {
  root: { name: 'Chief Monk', role: 'Abbot' },
  deputies: [
    { name: 'Senior Monk 1', role: 'Right Sotr', officers: [...] },
    { name: 'Senior Monk 2', role: 'Left Sotr', officers: [...] }
  ]
};
```

### 2. Corporate Structure
```javascript
const corpData = {
  root: { name: 'CEO', role: 'Chief Executive Officer' },
  deputies: [
    { name: 'CTO', role: 'Chief Technology Officer', officers: [...] },
    { name: 'CFO', role: 'Chief Financial Officer', officers: [...] }
  ]
};
```

### 3. Educational Institution
```javascript
const schoolData = {
  root: { name: 'Principal', role: 'Head of School' },
  deputies: [
    { name: 'VP Academic', role: 'Vice Principal', officers: [...] },
    { name: 'VP Admin', role: 'Administration', officers: [...] }
  ]
};
```

---

## 🔄 Dynamic Operations

### Adding Nodes

```javascript
// React
setOrgData(prev => {
  const deputy = prev.deputies.find(d => d.id === deputyId);
  deputy.officers.push(newOfficer);
  return { ...prev };
});

// Vanilla JS
orgData.deputies[0].officers.push(newOfficer);
tree.updateData(orgData);
```

### Removing Nodes

```javascript
// React
setOrgData(prev => ({
  ...prev,
  deputies: prev.deputies.filter(d => d.id !== nodeId)
}));

// Vanilla JS
tree.deleteNode(nodeId);
```

### Updating Nodes

```javascript
// React
setOrgData(prev => {
  const deputy = prev.deputies.find(d => d.id === deputyId);
  deputy.name = 'New Name';
  return { ...prev };
});

// Vanilla JS
orgData.deputies[0].name = 'New Name';
tree.updateData(orgData);
```

---

## 🎭 Animations

### Entrance Animations
- Tree levels fade in sequentially
- Staggered timing: 0.2s → 0.4s → 0.6s → 0.8s → 1.0s
- Combines opacity, translateY, and scale

### Connector Animations
- **Flow Gold**: Horizontal bars shimmer (8s loop)
- **Pulse Glow**: Nodes pulse (3s cycle)
- **Scale Effect**: 100% → 110% → 100%

### Hover Animations
- Cards lift 6px on hover
- Shadow expands and adds gold glow
- 0.35s cubic-bezier transition

### Disable Animations

```css
/* In your stylesheet */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}

/* On mobile (automatic) */
@media (max-width: 768px) {
  .connector-horizontal { animation: none; }
  .connector-node { animation: none; }
}
```

---

## 🐛 Troubleshooting

### Lines Not Appearing

**Problem**: SVG connectors not visible

**Solution**:
- Ensure CSS is loaded
- Check browser console for errors
- Verify `getBoundingClientRect()` support
- Call `tree.refresh()` after DOM updates

### Misaligned Connections

**Problem**: Lines don't connect properly

**Solution**:
```javascript
// Force recalculation
setTimeout(() => {
  tree.calculateDimensions();
  tree.renderConnectors();
}, 100);
```

### Performance Issues

**Problem**: Laggy animations on mobile

**Solution**:
- Animations auto-disable on < 768px
- Use `will-change: transform` on nodes
- Reduce number of nodes (< 20 total)

### Images Not Loading

**Problem**: Avatar images show broken

**Solution**:
```javascript
// Set fallback in data
node.image = node.image || 'default-avatar.png';

// Or use CSS
.node-avatar-frame img {
  object-fit: cover;
  background: #f0f0f0;
}
```

---

## 🔒 Security Considerations

### XSS Prevention

```javascript
// Sanitize user input
const sanitize = (str) => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

node.name = sanitize(userInput);
```

### URL Validation

```javascript
// Validate social links
const isValidUrl = (url) => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

if (isValidUrl(node.facebook)) {
  // Use the URL
}
```

---

## 📦 File Structure

```
├── DynamicOrgTree.jsx          # React component
├── DynamicOrgTree.js           # Vanilla JS class
├── DynamicOrgTree.css          # Styles
├── OrgTreeDemo.jsx             # React demo
├── org-tree-demo.html          # HTML demo
└── ORG_TREE_DOCUMENTATION.md   # This file
```

---

## 🌐 Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Mobile Safari | 14+ | ✅ Full |
| Chrome Mobile | 90+ | ✅ Full |

**Required Features:**
- CSS Grid & Flexbox
- SVG 2.0
- ResizeObserver API
- CSS Custom Properties
- ES6+ JavaScript

---

## 📝 License

MIT License - Feel free to use in personal and commercial projects.

---

## 🤝 Contributing

### Reporting Issues
- Provide sample data structure
- Include browser/device info
- Screenshot if visual bug

### Feature Requests
- Describe use case
- Provide example mockup
- Explain expected behavior

---

## 📞 Support

- **Documentation**: This file
- **Demo**: `org-tree-demo.html`
- **Examples**: `OrgTreeDemo.jsx`

---

## 🎓 Advanced Tips

### Performance Optimization

```javascript
// Debounce resize events
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

window.addEventListener('resize', debounce(() => {
  tree.refresh();
}, 250));
```

### Lazy Loading Images

```javascript
const img = document.createElement('img');
img.loading = 'lazy';
img.src = node.image;
```

### Print Optimization

```css
@media print {
  .dynamic-org-tree-wrapper {
    background: white;
  }
  
  .node-delete-btn {
    display: none !important;
  }
  
  * {
    animation: none !important;
  }
}
```

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Author**: Senior Frontend Developer  
**Status**: ✅ Production Ready
