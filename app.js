// Material Delivery Price Calculator - React Application
// This application manages clients, materials, and calculates delivery prices

const { useState, useEffect } = React;

// Simple math expression evaluator (replaces math.js)
const evaluate = (expression) => {
  try {
    // Security: only allow numbers, operators, spaces, and parentheses
    if (!/^[0-9+\-*\/().\s]+$/.test(expression)) {
      throw new Error('Invalid characters in expression');
    }
    // Use Function constructor for safe evaluation
    return new Function('return ' + expression)();
  } catch (e) {
    throw new Error('Invalid mathematical expression');
  }
};

// ============================================================================
// DATA MANAGEMENT - In-memory state with demo data
// ============================================================================

// Initial demo data
const INITIAL_MATERIALS = ['Άμμος', 'Χαλίκι', 'Τσιμέντο'];

// Demo shipment days data
const INITIAL_SHIPMENT_DAYS = [
  {
    id: 'day-001',
    date: '2025-11-22',
    clients: [
      {
        clientId: '1',
        clientName: 'Κατασκευές Αθήνας',
        materials: [
          { type: 'Άμμος', quantity: 50, price: 12, subtotal: 600 },
          { type: 'Χαλίκι', quantity: 30, price: 15, subtotal: 450 }
        ],
        clientTotal: 1050
      },
      {
        clientId: '2',
        clientName: 'Τοπιογραφική Θεσσαλονίκης',
        materials: [
          { type: 'Άμμος', quantity: 40, price: 10, subtotal: 400 }
        ],
        clientTotal: 400
      }
    ],
    dayTotal: 1450
  },
  {
    id: 'day-002',
    date: '2025-11-23',
    clients: [
      {
        clientId: '1',
        clientName: 'Κατασκευές Αθήνας',
        materials: [
          { type: 'Τσιμέντο', quantity: 25, price: 40, subtotal: 1000 }
        ],
        clientTotal: 1000
      }
    ],
    dayTotal: 1000
  },
  {
    id: 'day-003',
    date: '2025-11-24',
    clients: [
      {
        clientId: '1',
        clientName: 'Κατασκευές Αθήνας',
        materials: [
          { type: 'Άμμος', quantity: 60, price: 12, subtotal: 720 },
          { type: 'Χαλίκι', quantity: 20, price: 15, subtotal: 300 }
        ],
        clientTotal: 1020
      },
      {
        clientId: '2',
        clientName: 'Τοπιογραφική Θεσσαλονίκης',
        materials: [
          { type: 'Τσιμέντο', quantity: 15, price: 45, subtotal: 675 }
        ],
        clientTotal: 675
      }
    ],
    dayTotal: 1695
  }
];

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
  const [activeTab, setActiveTab] = useState('shipments');
  const [clients, setClients] = useState(INITIAL_CLIENTS);
  const [materials, setMaterials] = useState(INITIAL_MATERIALS);
  const [shipmentDays, setShipmentDays] = useState(INITIAL_SHIPMENT_DAYS);
  const [monthlyCalculations, setMonthlyCalculations] = useState([]);
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

  // Shipment day management functions
  const addShipmentDay = (shipmentData) => {
    const newDay = {
      id: `day-${Date.now()}`,
      date: shipmentData.date,
      clients: shipmentData.clients,
      dayTotal: shipmentData.clients.reduce((sum, c) => sum + c.clientTotal, 0)
    };
    setShipmentDays([...shipmentDays, newDay]);
    showMessage('Η ημέρα αποθηκεύτηκε με επιτυχία');
  };

  const updateShipmentDay = (dayId, shipmentData) => {
    setShipmentDays(shipmentDays.map(day =>
      day.id === dayId
        ? {
            ...day,
            date: shipmentData.date,
            clients: shipmentData.clients,
            dayTotal: shipmentData.clients.reduce((sum, c) => sum + c.clientTotal, 0)
          }
        : day
    ));
    showMessage('Η ημέρα ενημερώθηκε με επιτυχία');
  };

  const deleteShipmentDay = (dayId) => {
    setShipmentDays(shipmentDays.filter(d => d.id !== dayId));
    showMessage('Η ημέρα διαγράφηκε', 'info');
  };

  // Monthly calculation management
  const saveMonthlyCalculation = (calcData) => {
    const newCalc = {
      id: `monthly-${Date.now()}`,
      month: calcData.month,
      year: calcData.year,
      description: calcData.description,
      clients: calcData.clients,
      total: calcData.total,
      savedDate: new Date().toISOString()
    };
    setMonthlyCalculations([...monthlyCalculations, newCalc]);
    showMessage(`Ο υπολογισμός αποθηκεύτηκε για ${calcData.month} ${calcData.year}`);
  };

  const deleteMonthlyCalculation = (calcId) => {
    setMonthlyCalculations(monthlyCalculations.filter(c => c.id !== calcId));
    showMessage('Ο μηνιαίος υπολογισμός διαγράφηκε', 'info');
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
        className: `nav-tab ${activeTab === 'shipments' ? 'active' : ''}`,
        onClick: () => setActiveTab('shipments')
      }, 'ΗΜΕΡΗΣΙΕΣ ΑΠΟΣΤΟΛΕΣ'),
      React.createElement('button', {
        className: `nav-tab ${activeTab === 'history' ? 'active' : ''}`,
        onClick: () => setActiveTab('history')
      }, 'ΙΣΤΟΡΙΚΟ'),
      React.createElement('button', {
        className: `nav-tab ${activeTab === 'clients' ? 'active' : ''}`,
        onClick: () => setActiveTab('clients')
      }, 'ΠΕΛΑΤΕΣ'),
      React.createElement('button', {
        className: `nav-tab ${activeTab === 'materials' ? 'active' : ''}`,
        onClick: () => setActiveTab('materials')
      }, 'ΥΛΙΚΑ'),
      React.createElement('button', {
        className: `nav-tab ${activeTab === 'calculator' ? 'active' : ''}`,
        onClick: () => setActiveTab('calculator')
      }, 'ΥΠΟΛΟΓΙΣΤΗΣ')
    ),

    // Tab Content
    activeTab === 'shipments' && React.createElement(ShipmentsView, {
      clients,
      materials,
      shipmentDays,
      onAddShipmentDay: addShipmentDay
    }),
    activeTab === 'history' && React.createElement(HistoryView, {
      shipmentDays,
      monthlyCalculations,
      onUpdateShipmentDay: updateShipmentDay,
      onDeleteShipmentDay: deleteShipmentDay,
      onDeleteMonthlyCalc: deleteMonthlyCalculation
    }),
    activeTab === 'calculator' && React.createElement(CalculatorView, { 
      clients, 
      materials,
      onSaveMonthly: saveMonthlyCalculation
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
// MOBILE-OPTIMIZED CALENDAR COMPONENT
// ============================================================================

function MobileCalendar({ selectedDate, onDateSelect }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));
  
  const monthNames = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  const dayAbbrev = ['Κ', 'Δ', 'Τ', 'Τ', 'Π', 'Π', 'Σ'];
  
  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };
  
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, isEmpty: true });
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === new Date().toISOString().split('T')[0];
      const isSelected = dateStr === selectedDate;
      
      days.push({
        day,
        date: dateStr,
        isToday,
        isSelected,
        isEmpty: false
      });
    }
    
    return days;
  };
  
  const days = getDaysInMonth();
  const monthYear = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
  
  return React.createElement('div', { className: 'calendar-container' },
    React.createElement('div', { className: 'calendar-header' },
      React.createElement('button', {
        className: 'calendar-nav-btn',
        onClick: goToPreviousMonth,
        'aria-label': 'Προηγούμενος μήνας'
      }, '◀'),
      React.createElement('div', { className: 'calendar-month-year' }, monthYear),
      React.createElement('button', {
        className: 'calendar-nav-btn',
        onClick: goToNextMonth,
        'aria-label': 'Επόμενος μήνας'
      }, '▶')
    ),
    
    React.createElement('div', { className: 'calendar-weekdays' },
      dayAbbrev.map((day, i) => 
        React.createElement('div', { key: i, className: 'calendar-weekday' }, day)
      )
    ),
    
    React.createElement('div', { className: 'calendar-days' },
      days.map((dayObj, i) => {
        if (dayObj.isEmpty) {
          return React.createElement('div', { key: `empty-${i}`, className: 'calendar-day empty' });
        }
        
        const classNames = ['calendar-day'];
        if (dayObj.isToday) classNames.push('today');
        if (dayObj.isSelected) classNames.push('selected');
        
        return React.createElement('button', {
          key: dayObj.date,
          className: classNames.join(' '),
          onClick: () => onDateSelect(dayObj.date),
          'aria-label': `Επιλογή ${dayObj.day}`
        }, dayObj.day);
      })
    ),
    
    // Fallback text input
    React.createElement('div', { className: 'form-group', style: { marginTop: '20px' } },
      React.createElement('label', { className: 'form-label' }, 'Ή εισάγετε ημερομηνία:'),
      React.createElement('input', {
        type: 'date',
        className: 'form-input',
        value: selectedDate,
        onChange: (e) => onDateSelect(e.target.value),
        style: { fontSize: '18px' }
      })
    )
  );
}

// ============================================================================
// SHIPMENTS VIEW COMPONENT - Daily shipments entry
// ============================================================================

function ShipmentsView({ clients, materials, shipmentDays, onAddShipmentDay }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [calculatedValues, setCalculatedValues] = useState({});
  const [errors, setErrors] = useState({});
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const addClient = (clientId) => {
    if (selectedClients.includes(clientId)) {
      alert('Ο πελάτης έχει ήδη προστεθεί!');
      return;
    }
    const client = clients.find(c => c.id === clientId);
    setSelectedClients([...selectedClients, clientId]);
    showSuccess(`Ο πελάτης "${client.name}" προστέθηκε`);
    setShowAddClientModal(false);
  };

  const removeClient = (clientId) => {
    setSelectedClients(selectedClients.filter(id => id !== clientId));
    const newQuantities = { ...quantities };
    const newCalculatedValues = { ...calculatedValues };
    const newErrors = { ...errors };
    delete newQuantities[clientId];
    delete newCalculatedValues[clientId];
    delete newErrors[clientId];
    setQuantities(newQuantities);
    setCalculatedValues(newCalculatedValues);
    setErrors(newErrors);
  };

  const handleQuantityChange = (clientId, materialType, expression) => {
    setQuantities({
      ...quantities,
      [clientId]: {
        ...(quantities[clientId] || {}),
        [materialType]: expression
      }
    });

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
            [materialType]: 'Μη έγκυρη έκφραση'
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

  const handleSaveDay = () => {
    if (selectedClients.length === 0) {
      alert('Προσθέστε τουλάχιστον έναν πελάτη!');
      return;
    }

    const dayData = {
      date: selectedDate,
      clients: selectedClients.map(clientId => {
        const client = clients.find(c => c.id === clientId);
        const clientMaterials = [];
        let clientTotal = 0;

        client.materials.forEach(material => {
          const quantity = calculatedValues[clientId]?.[material.type] || 0;
          if (quantity > 0) {
            const subtotal = quantity * material.price;
            clientMaterials.push({
              type: material.type,
              quantity,
              price: material.price,
              subtotal
            });
            clientTotal += subtotal;
          }
        });

        return {
          clientId: client.id,
          clientName: client.name,
          materials: clientMaterials,
          clientTotal
        };
      }).filter(c => c.materials.length > 0)
    };

    if (dayData.clients.length === 0) {
      alert('Εισάγετε τουλάχιστον μια ποσότητα!');
      return;
    }

    onAddShipmentDay(dayData);
    
    // Clear form
    setSelectedClients([]);
    setQuantities({});
    setCalculatedValues({});
    setErrors({});
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const recentDays = [...shipmentDays].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const availableClients = clients.filter(c => !selectedClients.includes(c.id));

  return React.createElement('div', { className: 'calculator-container' },
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Ημερήσιες Αποστολές'),
      
      successMessage && React.createElement('div', { className: 'alert alert-success' }, successMessage),
      
      // Mobile-Optimized Calendar
      React.createElement(MobileCalendar, {
        selectedDate,
        onDateSelect: setSelectedDate
      }),

      // Add Client Button
      React.createElement('div', { style: { marginBottom: '24px' } },
        React.createElement('button', {
          className: 'btn btn-primary',
          onClick: () => setShowAddClientModal(true),
          style: { fontSize: '18px', minHeight: '54px' }
        }, 'Προσθήκη Πελάτη')
      ),

      // Client Cards
      selectedClients.length > 0 && React.createElement('div', { className: 'client-cards-container' },
        selectedClients.map(clientId => {
          const client = clients.find(c => c.id === clientId);
          if (!client) return null;
          
          return React.createElement(ShipmentClientCard, {
            key: clientId,
            client,
            quantities: quantities[clientId] || {},
            calculatedValues: calculatedValues[clientId] || {},
            errors: errors[clientId] || {},
            onQuantityChange: (materialType, expression) => handleQuantityChange(clientId, materialType, expression),
            onRemove: () => removeClient(clientId)
          });
        })
      ),

      // Save Button
      selectedClients.length > 0 && React.createElement('div', { style: { marginTop: '24px', textAlign: 'center' } },
        React.createElement('button', {
          className: 'btn btn-primary',
          onClick: handleSaveDay,
          style: { fontSize: '20px', minHeight: '60px', padding: '16px 48px' }
        }, 'Αποθήκευση Ημέρας')
      ),

      // Empty State
      selectedClients.length === 0 && React.createElement('div', { className: 'empty-state' },
        React.createElement('p', null, 'Κάντε κλικ στο "Προσθήκη Πελάτη" για να ξεκινήσετε την καταγραφή')
      )
    ),

    // Recent Days Preview
    recentDays.length > 0 && React.createElement('div', { className: 'card', style: { marginTop: '32px' } },
      React.createElement('h3', null, 'Πρόσφατες Ημέρες'),
      React.createElement('div', { style: { display: 'grid', gap: '16px' } },
        recentDays.map(day =>
          React.createElement('div', {
            key: day.id,
            style: {
              padding: '20px',
              backgroundColor: '#F8F8F8',
              borderRadius: '8px',
              border: '2px solid #E0E0E0'
            }
          },
            React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
              React.createElement('div', null,
                React.createElement('div', { style: { fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' } },
                  new Date(day.date).toLocaleDateString('el-GR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                ),
                React.createElement('div', { style: { fontSize: '16px', color: '#666' } },
                  `${day.clients.length} Πελάτ${day.clients.length === 1 ? 'ης' : 'ες'}: ${day.clients.map(c => c.clientName).join(', ')}`
                )
              ),
              React.createElement('div', { style: { fontSize: '22px', fontWeight: 'bold', color: '#1976D2' } },
                `€${day.dayTotal.toFixed(2)}`
              )
            )
          )
        )
      )
    ),

    // Add Client Modal
    showAddClientModal && React.createElement(AddClientModal, {
      clients: availableClients,
      onSelect: addClient,
      onCancel: () => setShowAddClientModal(false)
    }),

    // Save to Month Modal
    showSaveMonthModal && React.createElement(SaveMonthModal, {
      selectedClients,
      clients,
      calculatedValues,
      grandTotal,
      onSave: (monthData) => {
        const clientsData = selectedClients.map(clientId => {
          const client = clients.find(c => c.id === clientId);
          return {
            clientId,
            clientName: client.name,
            materials: client.materials.map(m => ({
              type: m.type,
              quantity: calculatedValues[clientId]?.[m.type] || 0,
              price: m.price
            })).filter(m => m.quantity > 0)
          };
        }).filter(c => c.materials.length > 0);

        onSaveMonthly({
          month: monthData.month,
          year: monthData.year,
          description: monthData.description,
          clients: clientsData,
          total: grandTotal
        });
        setShowSaveMonthModal(false);
      },
      onCancel: () => setShowSaveMonthModal(false)
    })
  );
}

// ============================================================================
// SHIPMENT CLIENT CARD COMPONENT
// ============================================================================

function ShipmentClientCard({ client, quantities, calculatedValues, errors, onQuantityChange, onRemove }) {
  return React.createElement('div', { className: 'client-calculation-card' },
    React.createElement('div', { className: 'client-card-header' },
      React.createElement('h3', null, client.name),
      React.createElement('button', {
        className: 'btn btn-danger btn-small',
        onClick: onRemove
      }, 'Αφαίρεση Πελάτη')
    ),

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
            React.createElement('label', { className: 'form-label' }, 'Ποσότητα (τόνοι)'),
            React.createElement('input', {
              type: 'text',
              className: 'form-input',
              placeholder: 'π.χ. 50 + 30 * 2',
              value: quantities[material.type] || '',
              onChange: (e) => onQuantityChange(material.type, e.target.value),
              style: { fontSize: '18px' }
            }),
            (calculatedValues[material.type] !== undefined && !errors[material.type]) &&
              React.createElement('div', { className: 'calculated-value success-text' },
                `Ποσότητα: ${calculatedValues[material.type].toFixed(2)} τόνοι | Υποσύνολο: €${(calculatedValues[material.type] * material.price).toFixed(2)}`
              ),
            errors[material.type] &&
              React.createElement('div', { className: 'calculated-value error-text' },
                errors[material.type]
              )
          )
        )
      )
    )
  );
}

// ============================================================================
// HISTORY VIEW COMPONENT - Shows saved days with filters and statistics
// ============================================================================

function HistoryView({ shipmentDays, monthlyCalculations, onUpdateShipmentDay, onDeleteShipmentDay, onDeleteMonthlyCalc }) {
  const [viewFilter, setViewFilter] = useState('all');
  const [selectedDayForEdit, setSelectedDayForEdit] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [expandedDay, setExpandedDay] = useState(null);

  // Filter days by period
  const getFilteredDays = () => {
    const now = new Date();
    const sortedDays = [...shipmentDays].sort((a, b) => new Date(b.date) - new Date(a.date));

    if (viewFilter === 'all') return sortedDays;

    return sortedDays.filter(day => {
      const dayDate = new Date(day.date);
      
      if (viewFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return dayDate >= weekAgo;
      }
      
      if (viewFilter === 'month') {
        return dayDate.getMonth() === now.getMonth() && dayDate.getFullYear() === now.getFullYear();
      }
      
      if (viewFilter === 'year') {
        return dayDate.getFullYear() === now.getFullYear();
      }
      
      return true;
    });
  };

  // Calculate statistics for filtered days
  const calculateStats = () => {
    const filtered = getFilteredDays();
    
    const stats = {
      totalShipments: filtered.length,
      totalRevenue: filtered.reduce((sum, day) => sum + day.dayTotal, 0),
      avgDaily: 0,
      byClient: {},
      byMaterial: {}
    };

    if (filtered.length > 0) {
      stats.avgDaily = stats.totalRevenue / filtered.length;
    }

    // Calculate by client
    filtered.forEach(day => {
      day.clients.forEach(client => {
        if (!stats.byClient[client.clientName]) {
          stats.byClient[client.clientName] = 0;
        }
        stats.byClient[client.clientName] += client.clientTotal;
      });
    });

    // Calculate by material
    filtered.forEach(day => {
      day.clients.forEach(client => {
        client.materials.forEach(material => {
          if (!stats.byMaterial[material.type]) {
            stats.byMaterial[material.type] = { tonnage: 0, revenue: 0 };
          }
          stats.byMaterial[material.type].tonnage += material.quantity;
          stats.byMaterial[material.type].revenue += material.subtotal;
        });
      });
    });

    return stats;
  };

  const handleDelete = (dayId) => {
    onDeleteShipmentDay(dayId);
    setShowDeleteConfirm(null);
  };

  const handleExportCSV = () => {
    const filtered = getFilteredDays();
    
    // Add UTF-8 BOM for proper Greek character encoding in Excel
    let csv = '\uFEFF';
    csv += 'Ημερομηνία,Πελάτης,Υλικό,Ποσότητα,Τιμή/Τόνο,Υποσύνολο,Ημερήσιο Σύνολο\n';
    
    filtered.forEach(day => {
      day.clients.forEach((client, clientIndex) => {
        client.materials.forEach((material, materialIndex) => {
          const isFirstRow = clientIndex === 0 && materialIndex === 0;
          csv += `${new Date(day.date).toLocaleDateString('el-GR')},`;
          csv += `${client.clientName},`;
          csv += `${material.type},`;
          csv += `${material.quantity},`;
          csv += `${material.price},`;
          csv += `${material.subtotal},`;
          csv += isFirstRow ? `${day.dayTotal}` : '';
          csv += '\n';
        });
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shipments_${new Date().toISOString().split('T')[0]}_UTF8.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredDays = getFilteredDays();
  const stats = calculateStats();

  return React.createElement('div', { className: 'calculator-container' },
    React.createElement('div', { className: 'card' },
      React.createElement('h2', null, 'Ιστορικό Αποστολών'),

      // Filters
      React.createElement('div', { style: { marginBottom: '32px' } },
        React.createElement('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' } },
          React.createElement('button', {
            className: `btn ${viewFilter === 'all' ? 'btn-primary' : 'btn-outline'}`,
            onClick: () => setViewFilter('all'),
            style: { fontSize: '16px' }
          }, 'Όλες'),
          React.createElement('button', {
            className: `btn ${viewFilter === 'week' ? 'btn-primary' : 'btn-outline'}`,
            onClick: () => setViewFilter('week'),
            style: { fontSize: '16px' }
          }, 'Εβδομάδα'),
          React.createElement('button', {
            className: `btn ${viewFilter === 'month' ? 'btn-primary' : 'btn-outline'}`,
            onClick: () => setViewFilter('month'),
            style: { fontSize: '16px' }
          }, 'Μήνας'),
          React.createElement('button', {
            className: `btn ${viewFilter === 'year' ? 'btn-primary' : 'btn-outline'}`,
            onClick: () => setViewFilter('year'),
            style: { fontSize: '16px' }
          }, 'Έτος'),
          React.createElement('button', {
            className: 'btn btn-secondary',
            onClick: handleExportCSV,
            style: { fontSize: '16px', marginLeft: 'auto' }
          }, 'Εξαγωγή σε CSV')
        )
      ),

      // Statistics Section
      filteredDays.length > 0 && React.createElement('div', { 
        style: { 
          backgroundColor: '#E3F2FD',
          padding: '24px',
          borderRadius: '10px',
          marginBottom: '32px',
          border: '2px solid #1976D2'
        }
      },
        React.createElement('h3', { style: { marginBottom: '20px', fontSize: '22px' } }, 'Στατιστικά'),
        React.createElement('div', { style: { display: 'grid', gap: '16px' } },
          React.createElement('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' } },
            React.createElement('div', { style: { padding: '16px', backgroundColor: 'white', borderRadius: '8px' } },
              React.createElement('div', { style: { fontSize: '14px', color: '#666', marginBottom: '4px' } }, 'Συνολικές Αποστολές'),
              React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#1976D2' } }, stats.totalShipments)
            ),
            React.createElement('div', { style: { padding: '16px', backgroundColor: 'white', borderRadius: '8px' } },
              React.createElement('div', { style: { fontSize: '14px', color: '#666', marginBottom: '4px' } }, 'Συνολική Είσπραξη'),
              React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#2E7D32' } }, `€${stats.totalRevenue.toFixed(2)}`)
            ),
            React.createElement('div', { style: { padding: '16px', backgroundColor: 'white', borderRadius: '8px' } },
              React.createElement('div', { style: { fontSize: '14px', color: '#666', marginBottom: '4px' } }, 'Μέσος Όρος Ημέρας'),
              React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#F57C00' } }, `€${stats.avgDaily.toFixed(2)}`)
            )
          ),

          // By Client
          Object.keys(stats.byClient).length > 0 && React.createElement('div', { style: { marginTop: '16px' } },
            React.createElement('h4', { style: { fontSize: '18px', marginBottom: '12px' } }, 'Ανάλυση ανά Πελάτη'),
            React.createElement('div', { style: { display: 'grid', gap: '8px' } },
              Object.entries(stats.byClient).map(([clientName, total]) =>
                React.createElement('div', {
                  key: clientName,
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }
                },
                  React.createElement('span', null, clientName),
                  React.createElement('span', { style: { fontWeight: 'bold' } }, `€${total.toFixed(2)}`)
                )
              )
            )
          ),

          // By Material
          Object.keys(stats.byMaterial).length > 0 && React.createElement('div', { style: { marginTop: '16px' } },
            React.createElement('h4', { style: { fontSize: '18px', marginBottom: '12px' } }, 'Ανάλυση ανά Υλικό'),
            React.createElement('div', { style: { display: 'grid', gap: '8px' } },
              Object.entries(stats.byMaterial).map(([materialType, data]) =>
                React.createElement('div', {
                  key: materialType,
                  style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }
                },
                  React.createElement('span', null, materialType),
                  React.createElement('div', { style: { display: 'flex', gap: '24px' } },
                    React.createElement('span', null, `${data.tonnage.toFixed(2)} τόνοι`),
                    React.createElement('span', { style: { fontWeight: 'bold' } }, `€${data.revenue.toFixed(2)}`)
                  )
                )
              )
            )
          )
        )
      ),

      // Monthly Calculations Section
      monthlyCalculations && monthlyCalculations.length > 0 && React.createElement('div', { className: 'monthly-calculations-section' },
        React.createElement('h3', { style: { marginBottom: '20px', fontSize: '22px' } }, 'Μηνιαίοι Υπολογισμοί'),
        React.createElement('div', { style: { display: 'grid', gap: '16px', marginBottom: '32px' } },
          monthlyCalculations.map(calc =>
            React.createElement('div', {
              key: calc.id,
              className: 'monthly-calc-item'
            },
              React.createElement('div', { className: 'monthly-calc-header' },
                React.createElement('div', null,
                  React.createElement('div', { className: 'monthly-calc-title' },
                    `${calc.month} ${calc.year}`
                  ),
                  calc.description && React.createElement('div', { style: { fontSize: '14px', color: '#666', marginTop: '4px' } },
                    calc.description
                  ),
                  React.createElement('div', { style: { fontSize: '14px', color: '#666', marginTop: '4px' } },
                    `Αποθηκεύτηκε: ${new Date(calc.savedDate).toLocaleDateString('el-GR')}`
                  )
                ),
                React.createElement('div', { className: 'monthly-calc-amount' },
                  `€${calc.total.toFixed(2)}`
                )
              ),
              React.createElement('button', {
                className: 'btn btn-danger btn-small',
                onClick: () => {
                  if (confirm('Διαγραφή αυτού του μηνιαίου υπολογισμού;')) {
                    onDeleteMonthlyCalc(calc.id);
                  }
                },
                style: { marginTop: '12px' }
              }, 'Διαγραφή')
            )
          )
        )
      ),

      // Days List
      React.createElement('h3', { style: { marginBottom: '20px', fontSize: '22px' } }, 'Καταγεγραμμένες Ημέρες'),
      
      filteredDays.length === 0 ?
        React.createElement('div', { className: 'empty-state' },
          React.createElement('p', null, 'Δεν υπάρχουν καταγεγραμμένες ημέρες για την επιλεγμένη περίοδο')
        ) :
        React.createElement('div', { style: { display: 'grid', gap: '16px' } },
          filteredDays.map(day =>
            React.createElement('div', {
              key: day.id,
              style: {
                padding: '24px',
                backgroundColor: 'white',
                border: '2px solid #E0E0E0',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
              }
            },
              React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' } },
                React.createElement('div', null,
                  React.createElement('div', { style: { fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' } },
                    new Date(day.date).toLocaleDateString('el-GR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                  ),
                  React.createElement('div', { style: { fontSize: '16px', color: '#666' } },
                    `${day.clients.length} Πελάτ${day.clients.length === 1 ? 'ης' : 'ες'}`
                  )
                ),
                React.createElement('div', { style: { fontSize: '24px', fontWeight: 'bold', color: '#1976D2' } },
                  `€${day.dayTotal.toFixed(2)}`
                )
              ),

              React.createElement('div', { style: { display: 'flex', gap: '12px', flexWrap: 'wrap' } },
                React.createElement('button', {
                  className: 'btn btn-outline btn-small',
                  onClick: () => setExpandedDay(expandedDay === day.id ? null : day.id)
                }, expandedDay === day.id ? 'Απόκρυψη Λεπτομερειών' : 'Λεπτομέρειες'),
                React.createElement('button', {
                  className: 'btn btn-danger btn-small',
                  onClick: () => setShowDeleteConfirm(day.id)
                }, 'Διαγραφή')
              ),

              // Expanded Details
              expandedDay === day.id && React.createElement('div', { style: { marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #E0E0E0' } },
                day.clients.map(client =>
                  React.createElement('div', { key: client.clientId, style: { marginBottom: '20px' } },
                    React.createElement('h4', { style: { fontSize: '18px', fontWeight: 'bold', marginBottom: '12px', color: '#1976D2' } },
                      client.clientName
                    ),
                    React.createElement('table', { className: 'results-table' },
                      React.createElement('thead', null,
                        React.createElement('tr', null,
                          React.createElement('th', null, 'Υλικό'),
                          React.createElement('th', { className: 'text-right' }, 'Ποσότητα'),
                          React.createElement('th', { className: 'text-right' }, 'Τιμή/Τόνο'),
                          React.createElement('th', { className: 'text-right' }, 'Υποσύνολο')
                        )
                      ),
                      React.createElement('tbody', null,
                        client.materials.map(material =>
                          React.createElement('tr', { key: material.type },
                            React.createElement('td', null, material.type),
                            React.createElement('td', { className: 'text-right' }, material.quantity.toFixed(2)),
                            React.createElement('td', { className: 'text-right' }, `€${material.price.toFixed(2)}`),
                            React.createElement('td', { className: 'text-right' }, `€${material.subtotal.toFixed(2)}`)
                          )
                        ),
                        React.createElement('tr', { className: 'client-subtotal-row' },
                          React.createElement('td', { colSpan: 3, style: { textAlign: 'right', fontWeight: 'bold' } }, 'Σύνολο Πελάτη:'),
                          React.createElement('td', { className: 'text-right', style: { fontWeight: 'bold' } }, `€${client.clientTotal.toFixed(2)}`)
                        )
                      )
                    )
                  )
                )
              )
            )
          )
        )
    ),

    // Delete Confirmation Modal
    showDeleteConfirm && React.createElement('div', { className: 'modal-overlay', onClick: () => setShowDeleteConfirm(null) },
      React.createElement('div', { 
        className: 'modal',
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('div', { className: 'modal-header' },
          React.createElement('h2', null, 'Επιβεβαίωση Διαγραφής')
        ),
        React.createElement('p', { style: { fontSize: '18px', marginBottom: '24px' } },
          'Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ημέρα;'
        ),
        React.createElement('div', { className: 'modal-actions' },
          React.createElement('button', {
            className: 'btn btn-outline',
            onClick: () => setShowDeleteConfirm(null)
          }, 'Όχι'),
          React.createElement('button', {
            className: 'btn btn-danger',
            onClick: () => handleDelete(showDeleteConfirm)
          }, 'Ναι')
        )
      )
    )
  );
}

// ============================================================================
// CALCULATOR VIEW COMPONENT - MULTI-CLIENT SUPPORT
// ============================================================================

function CalculatorView({ clients, materials, onSaveMonthly }) {
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
  const [showSaveMonthModal, setShowSaveMonthModal] = useState(false);
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
          onClick: () => setShowAddClientModal(true),
          style: { fontSize: '18px', minHeight: '54px' }
        }, '➕ Προσθήκη Πελάτη')
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
          React.createElement('div', { className: 'grand-total-label' }, '💵 ΓΕΝΙΚΟ ΣΥΝΟΛΟ'),
          React.createElement('div', { className: 'grand-total-amount' }, `€${grandTotal.toFixed(2)}`)
        ),

        // Save to Month Section
        React.createElement('div', { className: 'save-month-section' },
          React.createElement('button', {
            className: 'btn btn-primary save-month-btn',
            onClick: () => setShowSaveMonthModal(true)
          }, '💾 Αποθήκευση Υπολογισμού')
        ),

        // Clear Button
        React.createElement('button', {
          className: 'btn btn-secondary',
          onClick: clearCalculations,
          style: { fontSize: '18px', minHeight: '54px' }
        }, '🧹 Εκκαθάριση')
      ),

      // Empty State - no clients added
      selectedClients.length === 0 && React.createElement('div', { className: 'empty-state' },
        React.createElement('p', null, '👆 Κάντε κλικ στο "Προσθήκη Πελάτη" για να ξεκινήσετε τους υπολογισμούς')
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
      }, '❌ Αφαίρεση Πελάτη')
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
            React.createElement('label', { className: 'form-label' }, 'Μηνιαίος Όγκος (τόνοι)'),
            React.createElement('input', {
              type: 'text',
              className: 'form-input',
              placeholder: 'π.χ. 50 + 30 * 2',
              value: tonnageInputs[material.type] || '',
              onChange: (e) => onTonnageChange(material.type, e.target.value),
              style: { fontSize: '18px' }
            }),
            (calculatedValues[material.type] !== undefined && !errors[material.type]) &&
              React.createElement('div', { className: 'calculated-value success-text' },
                `✅ Ποσότητα: ${calculatedValues[material.type].toFixed(2)} τόνοι | Υποσύνολο: €${(calculatedValues[material.type] * material.price).toFixed(2)}`
              ),
            errors[material.type] &&
              React.createElement('div', { className: 'calculated-value error-text' },
                `❌ ${errors[material.type]}`
              )
          )
        )
      )
    ),

    // Card Subtotal
    subtotal > 0 && React.createElement('div', { className: 'client-card-subtotal' },
      React.createElement('span', null, '💰 Υποσύνολο Πελάτη:'),
      React.createElement('span', { className: 'subtotal-amount' }, `€${subtotal.toFixed(2)}`)
    )
  );
}

// ============================================================================
// SAVE TO MONTH MODAL COMPONENT
// ============================================================================

function SaveMonthModal({ selectedClients, clients, calculatedValues, grandTotal, onSave, onCancel }) {
  const currentYear = new Date().getFullYear();
  const months = ['Ιανουάριος', 'Φεβρουάριος', 'Μάρτιος', 'Απρίλιος', 'Μάιος', 'Ιούνιος',
    'Ιούλιος', 'Αύγουστος', 'Σεπτέμβριος', 'Οκτώβριος', 'Νοέμβριος', 'Δεκέμβριος'];
  
  const [selectedMonth, setSelectedMonth] = useState(months[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedClients.length === 0) {
      alert('Δεν υπάρχουν υπολογισμοί για αποθήκευση!');
      return;
    }
    onSave({
      month: selectedMonth,
      year: selectedYear,
      description: description.trim()
    });
  };

  const years = [currentYear - 1, currentYear, currentYear + 1];

  return React.createElement('div', { className: 'modal-overlay', onClick: onCancel },
    React.createElement('div', { 
      className: 'modal',
      onClick: (e) => e.stopPropagation()
    },
      React.createElement('div', { className: 'modal-header' },
        React.createElement('h2', null, 'Αποθήκευση Υπολογισμού')
      ),

      React.createElement('form', { onSubmit: handleSubmit },
        React.createElement('div', { className: 'month-selector-grid' },
          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Μήνας'),
            React.createElement('select', {
              className: 'form-select',
              value: selectedMonth,
              onChange: (e) => setSelectedMonth(e.target.value)
            },
              months.map(month =>
                React.createElement('option', { key: month, value: month }, month)
              )
            )
          ),

          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Έτος'),
            React.createElement('select', {
              className: 'form-select',
              value: selectedYear,
              onChange: (e) => setSelectedYear(parseInt(e.target.value))
            },
              years.map(year =>
                React.createElement('option', { key: year, value: year }, year)
              )
            )
          ),

          React.createElement('div', { className: 'form-group' },
            React.createElement('label', { className: 'form-label' }, 'Περιγραφή (προαιρετική)'),
            React.createElement('input', {
              type: 'text',
              className: 'form-input',
              value: description,
              onChange: (e) => setDescription(e.target.value),
              placeholder: 'π.χ. Εβδομαδιαία παράδοση'
            })
          )
        ),

        React.createElement('div', { style: { padding: '16px', backgroundColor: '#E8F5E9', borderRadius: '8px', marginBottom: '20px' } },
          React.createElement('div', { style: { fontSize: '16px', marginBottom: '8px' } },
            `Πελάτες: ${selectedClients.length}`
          ),
          React.createElement('div', { style: { fontSize: '20px', fontWeight: 'bold', color: '#2E7D32' } },
            `Σύνολο: €${grandTotal.toFixed(2)}`
          )
        ),

        React.createElement('div', { className: 'modal-actions' },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-outline',
            onClick: onCancel
          }, 'Ακύρωση'),
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary'
          }, 'Αποθήκευση')
        )
      )
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
          React.createElement('p', null, '✅ Όλοι οι πελάτες έχουν ήδη προστεθεί!')
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
          onClick: handleAddClick,
          style: { fontSize: '18px', minHeight: '54px' }
        }, '➕ Προσθήκη Νέου Πελάτη')
      ),

      // Client List
      sortedClients.length === 0 ? 
        React.createElement('div', { className: 'empty-state' },
          React.createElement('p', null, '👆 Προσθέστε τον πρώτο σας πελάτη κάνοντας κλικ πάνω!')
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
                  }, '✏️ Επεξεργασία'),
                  React.createElement('button', {
                    className: 'btn btn-danger btn-small',
                    onClick: () => handleDeleteClick(client.id)
                  }, '🗑️ Διαγραφή')
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
          onClick: handleAddClick,
          style: { fontSize: '18px', minHeight: '54px' }
        }, '➕ Προσθήκη Υλικού')
      ),

      // Material List
      materials.length === 0 ?
        React.createElement('div', { className: 'empty-state' },
          React.createElement('p', null, '👆 Προσθέστε τον πρώτο τύπο υλικού κάνοντας κλικ πάνω!')
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