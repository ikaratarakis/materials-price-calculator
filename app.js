// Material Delivery Price Calculator - React Application
// This application manages clients, materials, and calculates delivery prices

const { useState, useEffect } = React;
const { evaluate } = math;

// ============================================================================
// DATA MANAGEMENT - In-memory state with demo data
// ============================================================================

// Initial demo data
const INITIAL_MATERIALS = ['Άμμος', 'Χαλίκι', 'Τσιμέντο'];

const INITIAL_CLIENTS = [
  {
    id: '1',
    name: 'Κατασκευές Αθήνας',
    materials: [
      { type: 'Άμμος', price: 12 },
      { type: 'Χαλίκι', price: 15 },
      { type: 'Τσιμέντο', price: 40 }
    ]
  },
  {
    id: '2',
    name: 'Τοπιογραφική Θεσσαλονίκης',
    materials: [
      { type: 'Άμμος', price: 10 },
      { type: 'Χαλίκι', price: 18 },
      { type: 'Τσιμέντο', price: 45 }
    ]
  }
];

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

function App() {
  // State management using in-memory variables
  const [activeTab, setActiveTab] = useState('calculator');
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);
  const [message, setMessage] = useState(null);

  // Show temporary message to user
  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Client management functions
  const addClient = (clientData) => {
    const newClient = {
      id: Date.now().toString(),
      name: clientData.name,
      materials: materials.map(material => ({
        type: material,
        price: clientData.materials?.find(m => m.type === material)?.price || 0
      }))
    };
    setClients([...clients, newClient]);
    showMessage(`Ο πελάτης "${clientData.name}" προστέθηκε με επιτυχία`);
  };

  const updateClient = (clientId, clientData) => {
    setClients(clients.map(client => 
      client.id === clientId 
        ? { ...client, name: clientData.name, materials: clientData.materials }
        : client
    ));
    showMessage(`Ο πελάτης "${clientData.name}" ενημερώθηκε με επιτυχία`);
  };

  const deleteClient = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    setClients(clients.filter(c => c.id !== clientId));
    showMessage(`Ο πελάτης "${client.name}" διαγράφηκε`, 'info');
  };

  // Material management functions
  const addMaterial = (materialName) => {
    if (materials.includes(materialName)) {
      showMessage('Το υλικό υπάρχει ήδη!', 'error');
      return;
    }
    setMaterials([...materials, materialName]);
    // Add new material to all existing clients with price 0
    setClients(clients.map(client => ({
      ...client,
      materials: [...client.materials, { type: materialName, price: 0 }]
    })));
    showMessage(`Το υλικό "${materialName}" προστέθηκε με επιτυχία`);
  };

  const renameMaterial = (oldName, newName) => {
    if (materials.includes(newName)) {
      showMessage('Το όνομα υλικού υπάρχει ήδη!', 'error');
      return;
    }
    setMaterials(materials.map(m => m === oldName ? newName : m));
    // Update material name in all clients
    setClients(clients.map(client => ({
      ...client,
      materials: client.materials.map(m => 
        m.type === oldName ? { ...m, type: newName } : m
      )
    })));
    showMessage(`Το υλικό μετονομάστηκε από "${oldName}" σε "${newName}"`);
  };

  const deleteMaterial = (materialName) => {
    setMaterials(materials.filter(m => m !== materialName));
    // Remove material from all clients
    setClients(clients.map(client => ({
      ...client,
      materials: client.materials.filter(m => m.type !== materialName)
    })));
    showMessage(`Το υλικό "${materialName}" διαγράφηκε`, 'info');
  };

  return React.createElement('div', { className: 'app-container' },
    // Header
    React.createElement('header', { className: 'app-header' },
      React.createElement('h1', null, 'Υπολογιστής Τιμών Παράδοσης Υλικών'),
      React.createElement('p', null, 'Διαχείριση πελατών, υλικών και υπολογισμός κόστους παράδοσης')
    ),

    // Alert Messages
    message && React.createElement('div', { 
      className: `alert alert-${message.type}` 
    }, message.text),

    // Navigation Tabs
    React.createElement('nav', { className: 'nav-tabs' },
      React.createElement('button', {
        className: `nav-tab ${activeTab === 'calculator' ? 'active' : ''}`,
        onClick: () => setActiveTab('calculator')
      }, 'Υπολογιστής'),
      React.createElement('button', {
        className: `nav-tab ${activeTab === 'clients' ? 'active' : ''}`,
        onClick: () => setActiveTab('clients')
      }, 'Πελάτες'),
      React.createElement('button', {
        className: `nav-tab ${activeTab === 'materials' ? 'active' : ''}`,
        onClick: () => setActiveTab('materials')
      }, 'Υλικά')
    ),

    // Tab Content
    activeTab === 'calculator' && React.createElement(CalculatorView, { 
      clients, 
      materials 
    }),
    activeTab === 'clients' && React.createElement(ClientsView, { 
      clients, 
      materials,
      onAddClient: addClient,
      onUpdateClient: updateClient,
      onDeleteClient: deleteClient
    }),
    activeTab === 'materials' && React.createElement(MaterialsView, { 
      materials,
      onAddMaterial: addMaterial,
      onRenameMaterial: renameMaterial,
      onDeleteMaterial: deleteMaterial
    })
  );
}

// ============================================================================
// CALCULATOR VIEW COMPONENT - MULTI-CLIENT SUPPORT
// ============================================================================

function CalculatorView({ clients, materials }) {
  // Multi-client calculator state
  // Array of selected client IDs
  const [selectedClients, setSelectedClients] = useState([]);
  // Tonnage inputs per client: { clientId: { materialType: expression } }
  const [tonnageInputs, setTonnageInputs] = useState({});
  // Calculated values per client: { clientId: { materialType: value } }
  const [calculatedValues, setCalculatedValues] = useState({});
  // Errors per client: { clientId: { materialType: error } }
  const [errors, setErrors] = useState({});
  // Modal state for adding clients
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Show success message temporarily
  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Add a client to the calculator
  const addClient = (clientId) => {
    if (selectedClients.includes(clientId)) {
      alert('Ο πελάτης έχει ήδη προστεθεί!');
      return;
    }
    const client = clients.find(c => c.id === clientId);
    setSelectedClients([...selectedClients, clientId]);
    showSuccess(`Ο πελάτης "${client.name}" προστέθηκε στον υπολογισμό`);
    setShowAddClientModal(false);
  };

  // Remove a client from the calculator
  const removeClient = (clientId) => {
    setSelectedClients(selectedClients.filter(id => id !== clientId));
    // Clean up state for removed client
    const newTonnageInputs = { ...tonnageInputs };
    const newCalculatedValues = { ...calculatedValues };
    const newErrors = { ...errors };
    delete newTonnageInputs[clientId];
    delete newCalculatedValues[clientId];
    delete newErrors[clientId];
    setTonnageInputs(newTonnageInputs);
    setCalculatedValues(newCalculatedValues);
    setErrors(newErrors);
  };

  // Handle tonnage expression input for a specific client and material
  const handleTonnageChange = (clientId, materialType, expression) => {
    // Update input
    setTonnageInputs({
      ...tonnageInputs,
      [clientId]: {
        ...(tonnageInputs[clientId] || {}),
        [materialType]: expression
      }
    });

    // Try to evaluate the expression
    if (expression.trim() === '') {
      setCalculatedValues({
        ...calculatedValues,
        [clientId]: {
          ...(calculatedValues[clientId] || {}),
          [materialType]: 0
        }
      });
      setErrors({
        ...errors,
        [clientId]: {
          ...(errors[clientId] || {}),
          [materialType]: null
        }
      });
      return;
    }

    try {
      const result = evaluate(expression);
      if (typeof result === 'number' && !isNaN(result)) {
        setCalculatedValues({
          ...calculatedValues,
          [clientId]: {
            ...(calculatedValues[clientId] || {}),
            [materialType]: result
          }
        });
        setErrors({
          ...errors,
          [clientId]: {
            ...(errors[clientId] || {}),
            [materialType]: null
          }
        });
      } else {
        setErrors({
          ...errors,
          [clientId]: {
            ...(errors[clientId] || {}),
            [materialType]: 'Invalid expression'
          }
        });
      }
    } catch (error) {
      setErrors({
        ...errors,
        [clientId]: {
          ...(errors[clientId] || {}),
          [materialType]: 'Μη έγκυρη μαθηματική έκφραση'
        }
      });
    }
  };

  // Clear all calculations and clients
  const clearCalculations = () => {
    setSelectedClients([]);
    setTonnageInputs({});
    setCalculatedValues({});
    setErrors({});
    showSuccess('Όλοι οι υπολογισμοί εκκαθαρίστηκαν');
  };

  // Calculate subtotal for a specific client
  const calculateClientSubtotal = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return 0;
    
    return client.materials.reduce((total, material) => {
      const tonnage = calculatedValues[clientId]?.[material.type] || 0;
      return total + (tonnage * material.price);
    }, 0);
  };

  // Calculate grand total across all clients
  const calculateGrandTotal = () => {
    return selectedClients.reduce((total, clientId) => {
      return total + calculateClientSubtotal(clientId);
    }, 0);
  };

  // Get all breakdown rows for the table
  const getBreakdownRows = () => {
    const rows = [];
    selectedClients.forEach(clientId => {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;
      
      client.materials.forEach(material => {
        const tonnage = calculatedValues[clientId]?.[material.type] || 0;
        if (tonnage > 0) {
          rows.push({
            clientId,
            clientName: client.name,
            materialType: material.type,
            tonnage,
            pricePerTon: material.price,
            subtotal: tonnage * material.price
          });
        }
      });
    });
    return rows;
  };

  const grandTotal = calculateGrandTotal();
  const breakdownRows = getBreakdownRows();
  const availableClients = clients.filter(c => !selectedClients.includes(c.id));

  return React.createElement('div', { className: 'calculator-container' },
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Υπολογιστής Τιμών'),
      
      // Success Message
      successMessage && React.createElement('div', { className: 'alert alert-success' }, successMessage),
      
      // Add Client Button
      React.createElement('div', { style: { marginBottom: '24px' } },
        React.createElement('button', {
          className: 'btn btn-primary',
          onClick: () => setShowAddClientModal(true)
        }, '+ Προσθήκη Πελάτη')
      ),

      // Client Cards - one for each selected client
      selectedClients.length > 0 && React.createElement('div', { className: 'client-cards-container' },
        selectedClients.map(clientId => {
          const client = clients.find(c => c.id === clientId);
          if (!client) return null;
          
          return React.createElement(ClientCard, {
            key: clientId,
            client,
            tonnageInputs: tonnageInputs[clientId] || {},
            calculatedValues: calculatedValues[clientId] || {},
            errors: errors[clientId] || {},
            onTonnageChange: (materialType, expression) => handleTonnageChange(clientId, materialType, expression),
            onRemove: () => removeClient(clientId),
            subtotal: calculateClientSubtotal(clientId)
          });
        })
      ),

      // Breakdown Table - shows all clients and materials
      breakdownRows.length > 0 && React.createElement('div', { style: { marginTop: '32px' } },
        React.createElement('h3', null, 'Αναλυτική Κατανομή'),
        React.createElement('table', { className: 'results-table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, 'Πελάτης'),
              React.createElement('th', null, 'Υλικό'),
              React.createElement('th', { className: 'text-right' }, 'Ποσότητα'),
              React.createElement('th', { className: 'text-right' }, 'Τιμή/Τόνο'),
              React.createElement('th', { className: 'text-right' }, 'Υποσύνολο')
            )
          ),
          React.createElement('tbody', null,
            breakdownRows.map((row, index) => 
              React.createElement('tr', { key: `${row.clientId}-${row.materialType}` },
                React.createElement('td', null, row.clientName),
                React.createElement('td', null, row.materialType),
                React.createElement('td', { className: 'text-right' }, row.tonnage.toFixed(2)),
                React.createElement('td', { className: 'text-right' }, `€${row.pricePerTon.toFixed(2)}`),
                React.createElement('td', { className: 'text-right' }, `€${row.subtotal.toFixed(2)}`)
              )
            ),
            // Client subtotals
            selectedClients.map(clientId => {
              const client = clients.find(c => c.id === clientId);
              const subtotal = calculateClientSubtotal(clientId);
              if (subtotal === 0) return null;
              return React.createElement('tr', { 
                key: `subtotal-${clientId}`,
                className: 'client-subtotal-row'
              },
                React.createElement('td', { colSpan: 4, style: { fontWeight: 'bold', textAlign: 'right' } },
                  `Υποσύνολο ${client.name}:`
                ),
                React.createElement('td', { className: 'text-right', style: { fontWeight: 'bold' } },
                  `€${subtotal.toFixed(2)}`
                )
              );
            })
          )
        ),

        // Grand Total
        React.createElement('div', { className: 'grand-total' },
          React.createElement('div', { className: 'grand-total-label' }, 'ΓΕΝΙΚΟ ΣΥΝΟΛΟ'),
          React.createElement('div', { className: 'grand-total-amount' }, `€${grandTotal.toFixed(2)}`)
        ),

        // Clear Button
        React.createElement('button', {
          className: 'btn btn-secondary',
          onClick: clearCalculations
        }, 'Εκκαθάριση')
      ),

      // Empty State - no clients added
      selectedClients.length === 0 && React.createElement('div', { className: 'empty-state' },
        React.createElement('p', null, 'Δεν υπάρχουν πελάτες. Κάντε κλικ στο "Προσθήκη Πελάτη" για να ξεκινήσετε')
      )
    ),

    // Add Client Modal
    showAddClientModal && React.createElement(AddClientModal, {
      clients: availableClients,
      onSelect: addClient,
      onCancel: () => setShowAddClientModal(false)
    })
  );
}

// ============================================================================
// CLIENT CARD COMPONENT - Individual client calculation card
// ============================================================================

function ClientCard({ client, tonnageInputs, calculatedValues, errors, onTonnageChange, onRemove, subtotal }) {
  return React.createElement('div', { className: 'client-calculation-card' },
    // Card Header
    React.createElement('div', { className: 'client-card-header' },
      React.createElement('h3', null, client.name),
      React.createElement('button', {
        className: 'btn btn-danger btn-small',
        onClick: onRemove
      }, 'Αφαίρεση Πελάτη')
    ),

    // Material Inputs
    React.createElement('div', { className: 'material-inputs' },
      client.materials.map(material =>
        React.createElement('div', { key: material.type, className: 'material-input-item' },
          React.createElement('div', { className: 'material-input-header' },
            React.createElement('span', { className: 'material-input-name' }, material.type),
            React.createElement('span', { className: 'material-input-price' }, 
              `€${material.price.toFixed(2)} ανά τόνο`
            )
          ),
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Μηνιαίος Όγκος (τόνοι) - υποστηρίζει εκφράσεις όπως "50 + 30 * 2"'),
            React.createElement('input', {
              type: 'text',
              className: 'form-input',
              placeholder: 'π.χ. 100 ή 50 + 30',
              value: tonnageInputs[material.type] || '',
              onChange: (e) => onTonnageChange(material.type, e.target.value)
            }),
            (calculatedValues[material.type] !== undefined && !errors[material.type]) &&
              React.createElement('div', { className: 'calculated-value success-text' },
                `Υπολογισμένη Ποσότητα: ${calculatedValues[material.type].toFixed(2)} τόνοι → Υποσύνολο: €${(calculatedValues[material.type] * material.price).toFixed(2)}`
              ),
            errors[material.type] &&
              React.createElement('div', { className: 'calculated-value error-text' },
                errors[material.type]
              )
          )
        )
      )
    ),

    // Card Subtotal
    subtotal > 0 && React.createElement('div', { className: 'client-card-subtotal' },
      React.createElement('span', null, 'Υποσύνολο Πελάτη:'),
      React.createElement('span', { className: 'subtotal-amount' }, `€${subtotal.toFixed(2)}`)
    )
  );
}

// ============================================================================
// ADD CLIENT MODAL COMPONENT - Modal for selecting a client to add
// ============================================================================

function AddClientModal({ clients, onSelect, onCancel }) {
  return React.createElement('div', { className: 'modal-overlay', onClick: onCancel },
    React.createElement('div', { 
      className: 'modal',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h2', null, 'Επιλογή Πελάτη')
      ),

      clients.length === 0 ? 
        React.createElement('div', { className: 'empty-state' },
          React.createElement('p', null, 'Όλοι οι πελάτες έχουν ήδη προστεθεί!')
        ) :
        React.createElement('div', { className: 'client-select-list' },
          clients.sort((a, b) => a.name.localeCompare(b.name)).map(client =>
            React.createElement('button', {
              key: client.id,
              className: 'client-select-item',
              onClick: () => onSelect(client.id)
            }, client.name)
          )
        ),

      React.createElement('div', { className: 'modal-actions' },
        React.createElement('button', {
          className: 'btn btn-outline',
          onClick: onCancel
        }, 'Ακύρωση')
      )
    )
  );
}

// ============================================================================
// CLIENTS VIEW COMPONENT
// ============================================================================

function ClientsView({ clients, materials, onAddClient, onUpdateClient, onDeleteClient }) {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const handleAddClick = () => {
    setEditingClient(null);
    setShowModal(true);
  };

  const handleEditClick = (client) => {
    setEditingClient(client);
    setShowModal(true);
  };

  const handleDeleteClick = (clientId) => {
    if (confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτόν τον πελάτη;')) {
      onDeleteClient(clientId);
    }
  };

  const handleSaveClient = (clientData) => {
    if (editingClient) {
      onUpdateClient(editingClient.id, clientData);
    } else {
      onAddClient(clientData);
    }
    setShowModal(false);
  };

  const sortedClients = [...clients].sort((a, b) => a.name.localeCompare(b.name));

  return React.createElement('div', null,
    React.createElement('div', { className: 'card' },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
        React.createElement('h2', null, 'Διαχείριση Πελατών'),
        React.createElement('button', {
          className: 'btn btn-primary',
          onClick: handleAddClick
        }, '+ Προσθήκη Νέου Πελάτη')
      ),

      // Client List
      sortedClients.length === 0 ? 
        React.createElement('div', { className: 'empty-state' },
          React.createElement('p', null, 'Δεν βρέθηκαν πελάτες. Προσθέστε τον πρώτο σας πελάτη!')
        ) :
        React.createElement('div', { className: 'client-list' },
          sortedClients.map(client =>
            React.createElement('div', { key: client.id, className: 'client-item' },
              React.createElement('div', { className: 'client-header' },
                React.createElement('h3', null, client.name),
                React.createElement('div', { className: 'client-actions' },
                  React.createElement('button', {
                    className: 'btn btn-outline btn-small',
                    onClick: () => handleEditClick(client)
                  }, 'Επεξεργασία'),
                  React.createElement('button', {
                    className: 'btn btn-danger btn-small',
                    onClick: () => handleDeleteClick(client.id)
                  }, 'Διαγραφή')
                )
              ),
              React.createElement('div', { className: 'material-list' },
                client.materials.map(material =>
                  React.createElement('div', { key: material.type, className: 'material-item' },
                    React.createElement('span', { className: 'material-name' }, material.type),
                    React.createElement('span', { className: 'material-price' }, `€${material.price.toFixed(2)}/τόνο`)
                  )
                )
              )
            )
          )
        )
    ),

    // Client Form Modal
    showModal && React.createElement(ClientFormModal, {
      client: editingClient,
      materials,
      onSave: handleSaveClient,
      onCancel: () => setShowModal(false)
    })
  );
}

// ============================================================================
// CLIENT FORM MODAL COMPONENT
// ============================================================================

function ClientFormModal({ client, materials, onSave, onCancel }) {
  const [name, setName] = useState(client?.name || '');
  const [prices, setPrices] = useState(() => {
    const initialPrices = {};
    materials.forEach(material => {
      const existing = client?.materials.find(m => m.type === material);
      initialPrices[material] = existing?.price || 0;
    });
    return initialPrices;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Το όνομα πελάτη είναι υποχρεωτικό!');
      return;
    }

    const clientData = {
      name: name.trim(),
      materials: materials.map(material => ({
        type: material,
        price: parseFloat(prices[material]) || 0
      }))
    };

    onSave(clientData);
  };

  const handlePriceChange = (material, value) => {
    setPrices({
      ...prices,
      [material]: value
    });
  };

  return React.createElement('div', { className: 'modal-overlay', onClick: onCancel },
    React.createElement('div', { 
      className: 'modal',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h2', null, client ? 'Επεξεργασία Πελάτη' : 'Προσθήκη Νέου Πελάτη')
      ),

      React.createElement('form', { onSubmit: handleSubmit },
        // Client Name
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Όνομα Πελάτη *'),
          React.createElement('input', {
            type: 'text',
            className: 'form-input',
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: 'Εισάγετε όνομα πελάτη',
            required: true
          })
        ),

        // Material Prices
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Τιμές Υλικών (€/τόνο)'),
          React.createElement('div', { className: 'price-inputs' },
            materials.map(material =>
              React.createElement('div', { key: material, className: 'price-input-row' },
                React.createElement('div', null,
                  React.createElement('label', { className: 'form-label' }, material)
                ),
                React.createElement('div', null,
                  React.createElement('input', {
                    type: 'number',
                    className: 'form-input',
                    value: prices[material],
                    onChange: (e) => handlePriceChange(material, e.target.value),
                    min: '0',
                    step: '0.01',
                    placeholder: '0.00'
                  })
                )
              )
            )
          )
        ),

        // Actions
        React.createElement('div', { className: 'modal-actions' },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-outline',
            onClick: onCancel
          }, 'Ακύρωση'),
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary'
          }, client ? 'Ενημέρωση Πελάτη' : 'Προσθήκη Πελάτη')
        )
      )
    )
  );
}

// ============================================================================
// MATERIALS VIEW COMPONENT
// ============================================================================

function MaterialsView({ materials, onAddMaterial, onRenameMaterial, onDeleteMaterial }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renamingMaterial, setRenamingMaterial] = useState(null);

  const handleAddClick = () => {
    setShowAddModal(true);
  };

  const handleRenameClick = (material) => {
    setRenamingMaterial(material);
    setShowRenameModal(true);
  };

  const handleDeleteClick = (material) => {
    if (confirm(`Είστε σίγουροι ότι θέλετε να διαγράψετε το "${material}"; Αυτό θα το αφαιρέσει από όλους τους πελάτες.`)) {
      onDeleteMaterial(material);
    }
  };

  return React.createElement('div', null,
    React.createElement('div', { className: 'card' },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' } },
        React.createElement('h2', null, 'Διαχείριση Τύπων Υλικών'),
        React.createElement('button', {
          className: 'btn btn-primary',
          onClick: handleAddClick
        }, '+ Προσθήκη Υλικού')
      ),

      // Material List
      materials.length === 0 ?
        React.createElement('div', { className: 'empty-state' },
          React.createElement('p', null, 'Δεν προστέθηκαν υλικά. Προσθέστε τον πρώτο τύπο υλικού!')
        ) :
        React.createElement('div', { className: 'material-type-list' },
          materials.map(material =>
            React.createElement('div', { key: material, className: 'material-type-item' },
              React.createElement('span', { className: 'material-type-name' }, material),
              React.createElement('div', { className: 'material-type-actions' },
                React.createElement('button', {
                  className: 'btn btn-outline btn-small',
                  onClick: () => handleRenameClick(material)
                }, 'Μετονομασία'),
                React.createElement('button', {
                  className: 'btn btn-danger btn-small',
                  onClick: () => handleDeleteClick(material)
                }, 'Διαγραφή')
              )
            )
          )
        )
    ),

    // Add Material Modal
    showAddModal && React.createElement(AddMaterialModal, {
      onSave: (name) => {
        onAddMaterial(name);
        setShowAddModal(false);
      },
      onCancel: () => setShowAddModal(false)
    }),

    // Rename Material Modal
    showRenameModal && React.createElement(RenameMaterialModal, {
      material: renamingMaterial,
      onSave: (newName) => {
        onRenameMaterial(renamingMaterial, newName);
        setShowRenameModal(false);
      },
      onCancel: () => setShowRenameModal(false)
    })
  );
}

// ============================================================================
// ADD MATERIAL MODAL COMPONENT
// ============================================================================

function AddMaterialModal({ onSave, onCancel }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Το όνομα υλικού είναι υποχρεωτικό!');
      return;
    }
    onSave(name.trim());
  };

  return React.createElement('div', { className: 'modal-overlay', onClick: onCancel },
    React.createElement('div', { 
      className: 'modal',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h2', null, 'Προσθήκη Νέου Υλικού')
      ),

      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Όνομα Υλικού *'),
          React.createElement('input', {
            type: 'text',
            className: 'form-input',
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: 'π.χ. Ασβεστολιθος, Τούβλα, κ.λπ.',
            required: true,
            autoFocus: true
          })
        ),

        React.createElement('div', { className: 'modal-actions' },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-outline',
            onClick: onCancel
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary'
          }, 'Προσθήκη Υλικού')
        )
      )
    )
  );
}

// ============================================================================
// RENAME MATERIAL MODAL COMPONENT
// ============================================================================

function RenameMaterialModal({ material, onSave, onCancel }) {
  const [name, setName] = useState(material);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Το όνομα υλικού είναι υποχρεωτικό!');
      return;
    }
    if (name.trim() === material) {
      onCancel();
      return;
    }
    onSave(name.trim());
  };

  return React.createElement('div', { className: 'modal-overlay', onClick: onCancel },
    React.createElement('div', { 
      className: 'modal',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h2', null, 'Μετονομασία Υλικού')
      ),

      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'form-group' },
          React.createElement('label', { className: 'form-label' }, 'Material Name *'),
          React.createElement('input', {
            type: 'text',
            className: 'form-input',
            value: name,
            onChange: (e) => setName(e.target.value),
            placeholder: 'Εισάγετε νέο όνομα',
            required: true,
            autoFocus: true
          })
        ),

        React.createElement('div', { className: 'modal-actions' },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-outline',
            onClick: onCancel
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary'
          }, 'Μετονομασία Υλικού')
        )
      )
    )
  );
}

// ============================================================================
// RENDER APPLICATION
// ============================================================================

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));