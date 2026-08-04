import React, { useState } from 'react';
import DynamicOrgTree from './DynamicOrgTree';

/**
 * Demo Implementation of Dynamic Org Tree
 * Shows how to use the component with JSON data structure
 */

const OrgTreeDemo = () => {
  // Sample data structure - easily extensible
  const [orgData, setOrgData] = useState({
    root: {
      id: 'root-1',
      name: 'ព្រះមហាវីរៈ សុខា',
      role: 'ព្រះចៅអធិការវត្ត',
      image: 'images/hero.png',
      phone: '012 345 678',
      carrier: 'Cellcard',
      facebook: 'https://facebook.com',
      telegram: 'https://t.me',
      verified: true
    },
    deputies: [
      {
        id: 'deputy-1',
        name: 'ព្រះគ្រូ សុវណ្ណធម៌',
        role: 'ព្រះគ្រូសូត្រស្តាំ',
        image: 'images/ceremony.png',
        phone: '011 888 999',
        carrier: 'Cellcard',
        facebook: 'https://facebook.com',
        telegram: 'https://t.me',
        verified: true,
        officers: [
          {
            id: 'officer-1-1',
            name: 'ព្រះ វិន័យធម៌',
            role: 'ព្រះវិន័យធម៌',
            image: 'images/meditation.png',
            phone: '097 111 222',
            carrier: 'Metfone',
            facebook: 'https://facebook.com'
          },
          {
            id: 'officer-1-2',
            name: 'ព្រះ សភាលិកធម៌',
            role: 'ព្រះលេខា',
            image: 'images/buddha.png',
            phone: '010 333 444',
            carrier: 'Smart',
            telegram: 'https://t.me'
          },
          {
            id: 'officer-1-3',
            name: 'ព្រះ ភត្តទេសក៍',
            role: 'ព្រះភត្តទេសក៍',
            image: 'logo.png',
            phone: '012 555 666',
            carrier: 'Cellcard'
          }
        ]
      },
      {
        id: 'deputy-2',
        name: 'ព្រះគ្រូ ធម្មធរ',
        role: 'ព្រះគ្រូសូត្រឆ្វេង',
        image: 'images/community.png',
        phone: '015 777 888',
        carrier: 'Smart',
        facebook: 'https://facebook.com',
        telegram: 'https://t.me',
        verified: true,
        officers: [
          {
            id: 'officer-2-1',
            name: 'ព្រះ សីលធម៌',
            role: 'ព្រះវិន័យធម៌',
            image: 'images/garden.png',
            phone: '098 111 222',
            carrier: 'Smart',
            facebook: 'https://facebook.com'
          },
          {
            id: 'officer-2-2',
            name: 'ព្រះ បញ្ញាធម៌',
            role: 'ព្រះលេខា',
            image: 'images/hero.png',
            phone: '031 333 444',
            carrier: 'Metfone'
          },
          {
            id: 'officer-2-3',
            name: 'ព្រះ សមាធិធម៌',
            role: 'ព្រះភត្តទេសក៍',
            image: 'logo.png',
            phone: '016 555 666',
            carrier: 'Smart',
            telegram: 'https://t.me'
          }
        ]
      }
    ]
  });

  // Handle node deletion - demonstrates automatic recalculation
  const handleNodeDelete = (nodeId) => {
    const confirmDelete = window.confirm('តើអ្នកប្រាកដទេថាចង់លុបសមាជិកនេះ?');
    
    if (!confirmDelete) return;

    setOrgData(prevData => {
      const newData = { ...prevData };

      // Check if it's root
      if (newData.root?.id === nodeId) {
        alert('មិនអាចលុបថ្នាក់ដឹកនាំបានទេ!');
        return prevData;
      }

      // Check if it's a deputy
      const deputyIndex = newData.deputies?.findIndex(d => d.id === nodeId);
      if (deputyIndex !== -1) {
        newData.deputies.splice(deputyIndex, 1);
        return newData;
      }

      // Check if it's an officer
      if (newData.deputies) {
        newData.deputies = newData.deputies.map(deputy => {
          if (deputy.officers) {
            return {
              ...deputy,
              officers: deputy.officers.filter(o => o.id !== nodeId)
            };
          }
          return deputy;
        });
      }

      return newData;
    });
  };

  // Add node function (example)
  const handleAddOfficer = (deputyId) => {
    const newOfficer = {
      id: `officer-${Date.now()}`,
      name: 'ព្រះ សមាជិកថ្មី',
      role: 'មន្ត្រីថ្មី',
      image: 'logo.png',
      phone: '012 000 000',
      carrier: 'Cellcard'
    };

    setOrgData(prevData => {
      const newData = { ...prevData };
      const deputy = newData.deputies?.find(d => d.id === deputyId);
      
      if (deputy) {
        if (!deputy.officers) {
          deputy.officers = [];
        }
        deputy.officers.push(newOfficer);
      }

      return newData;
    });
  };

  // Export data function
  const handleExportData = () => {
    const dataStr = JSON.stringify(orgData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'org-tree-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Reset data function
  const handleResetData = () => {
    window.location.reload();
  };

  return (
    <div className="org-tree-demo">
      {/* Control Panel */}
      <div style={{
        background: '#1a3a5c',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8rem' }}>
          🏛️ រចនាសម្ព័ន្ធគ្រប់គ្រងវត្តខេមវ័ន
        </h1>
        <p style={{ margin: '0 0 15px 0', color: '#cbd5e1' }}>
          Dynamic Organizational Hierarchy Tree - Auto-realigning & Responsive
        </p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleAddOfficer('deputy-1')}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            ➕ Add Officer (Deputy 1)
          </button>
          
          <button
            onClick={() => handleAddOfficer('deputy-2')}
            style={{
              background: '#10b981',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            ➕ Add Officer (Deputy 2)
          </button>
          
          <button
            onClick={handleExportData}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            💾 Export JSON
          </button>
          
          <button
            onClick={handleResetData}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            🔄 Reset
          </button>
        </div>

        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          fontSize: '0.85rem'
        }}>
          💡 <strong>Features:</strong> Click ✕ to delete nodes • Tree auto-realigns • Smooth animations • Responsive design
        </div>
      </div>

      {/* Org Tree Component */}
      <DynamicOrgTree 
        data={orgData} 
        onNodeDelete={handleNodeDelete}
      />

      {/* Stats Panel */}
      <div style={{
        background: '#f8fafc',
        padding: '30px',
        textAlign: 'center',
        marginTop: '40px',
        borderRadius: '12px'
      }}>
        <h3 style={{ color: '#1a3a5c', marginBottom: '15px' }}>📊 Tree Statistics</h3>
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ padding: '15px 25px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#d4a843' }}>
              {orgData.root ? 1 : 0}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Root Leader</div>
          </div>
          
          <div style={{ padding: '15px 25px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {orgData.deputies?.length || 0}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Deputies</div>
          </div>
          
          <div style={{ padding: '15px 25px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {orgData.deputies?.reduce((sum, d) => sum + (d.officers?.length || 0), 0) || 0}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Officers</div>
          </div>
          
          <div style={{ padding: '15px 25px', background: 'white', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {(orgData.root ? 1 : 0) + 
               (orgData.deputies?.length || 0) + 
               (orgData.deputies?.reduce((sum, d) => sum + (d.officers?.length || 0), 0) || 0)}
            </div>
            <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Total Members</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgTreeDemo;
