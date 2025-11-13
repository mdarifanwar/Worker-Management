import React, { useState, useEffect } from 'react';
import { workersAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { Plus, Trash2, X, History, RotateCcw, Search } from 'lucide-react';

const WorkerForm = ({ workerId, onSuccess, onCancel, editMode = false }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ itemName: '', wageRate: '', piecesCompleted: '', totalWage: 0 }],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [historicalItems, setHistoricalItems] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    fetchWorkerHistory();
  }, [workerId, editMode]);

  const fetchWorkerHistory = async () => {
    try {
      const response = await workersAPI.getById(workerId);
      const worker = response.data;
      if (editMode) {
        setFormData(prev => ({
          ...prev,
          name: worker.name || '',
          phone: worker.phone || '',
          email: worker.email || '',
          address: worker.address || ''
        }));
        return;
      }
      if (worker.phone) {
        setFormData(prev => ({ ...prev, phone: worker.phone }));
      }
      if (worker.workHistory && worker.workHistory.length > 0) {
        const allItems = {};
        worker.workHistory.forEach(work => {
          work.items.forEach(item => {
            if (item.itemName && item.wageRate) {
              if (!allItems[item.itemName] || allItems[item.itemName] < item.wageRate) {
                allItems[item.itemName] = item.wageRate;
              }
            }
          });
        });

        const historicalItemsList = Object.keys(allItems).map(name => ({
          name,
          rate: allItems[name]
        })).sort((a, b) => a.name.localeCompare(b.name));

        setHistoricalItems(historicalItemsList);

        // Auto-fill with last work record items
        const lastRecord = worker.workHistory
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        if (lastRecord.items && lastRecord.items.length > 0) {
          const autoFilledItems = lastRecord.items.map(item => ({
            itemName: item.itemName,
            wageRate: item.wageRate,
            piecesCompleted: '',
            totalWage: 0
          }));
          
          setFormData(prev => ({
            ...prev,
            items: autoFilledItems
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching worker history:', error);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    
    if (field === 'wageRate' || field === 'piecesCompleted') {
      const rate = parseFloat(updatedItems[index].wageRate) || 0;
      const pieces = parseInt(updatedItems[index].piecesCompleted) || 0;
      updatedItems[index].totalWage = rate * pieces;
    }
    
    setFormData({ ...formData, items: updatedItems });

    if (field === 'itemName' && value.trim()) {
      showSuggestions(index, value);
    }
  };

  const showSuggestions = (index, value) => {
    const filtered = historicalItems.filter(item =>
      item.name.toLowerCase().includes(value.toLowerCase())
    ).slice(0, 5);

    setSuggestions(prev => ({ ...prev, [index]: filtered }));
    setActiveField(index);
  };

  const selectSuggestion = (index, suggestion) => {
    const updatedItems = [...formData.items];
    updatedItems[index].itemName = suggestion.name;
    updatedItems[index].wageRate = suggestion.rate;
    updatedItems[index].totalWage = 0;
    
    setFormData({ ...formData, items: updatedItems });
    setActiveField(null);
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemName: '', wageRate: '', piecesCompleted: '', totalWage: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: updatedItems });
      
      setSuggestions(prev => {
        const newSuggestions = { ...prev };
        delete newSuggestions[index];
        return newSuggestions;
      });
    }
  };

  const useCommonItems = () => {
    if (historicalItems.length > 0) {
      const commonItems = historicalItems.slice(0, 3).map(item => ({
        itemName: item.name,
        wageRate: item.rate,
        piecesCompleted: '',
        totalWage: 0
      }));
      
      setFormData(prev => ({
        ...prev,
        items: commonItems
      }));
      toast.success('Loaded common items');
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      items: [{ itemName: '', wageRate: '', piecesCompleted: '', totalWage: 0 }],
      notes: ''
    });
    setActiveField(null);
  };

  const calculateTotal = () => {
    return formData.items.reduce((total, item) => total + (item.totalWage || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    if (editMode) {
      if (!formData.name.trim() || !formData.phone.trim()) {
        toast.error('Name and phone are required.');
        setLoading(false);
        return;
      }
      try {
        await workersAPI.update(workerId, {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address
        });
        toast.success('Worker details updated!');
        onSuccess();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error updating worker');
      } finally {
        setLoading(false);
      }
      return;
    }
    const hasEmptyFields = formData.items.some(item => 
      !item.itemName.trim() || !item.wageRate || !item.piecesCompleted
    );
    if (!formData.phone.trim()) {
      toast.error('Phone number is required.');
      setLoading(false);
      return;
    }
    if (hasEmptyFields) {
      toast.error('Please fill in all item fields');
      setLoading(false);
      return;
    }
    try {
      const submitData = {
        ...formData,
        items: formData.items.map(item => ({
          itemName: item.itemName,
          wageRate: parseFloat(item.wageRate),
          piecesCompleted: parseInt(item.piecesCompleted)
        }))
      };
      await workersAPI.addWork(workerId, submitData);
      toast.success('Work record added successfully!');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error adding work record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Add Work Record</h2>
          <button className="icon-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} id="work-form" className="modal-body">
          {editMode ? (
            <>
              <div className="form-group">
                <label htmlFor="name">Name <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="Enter worker's name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone <span style={{color: 'red'}}>*</span></label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  required
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label htmlFor="phone">Phone Number <span style={{color: 'red'}}>*</span></label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="Enter phone number"
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="date">Work Date</label>
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          {historicalItems.length > 0 && (
            <div className="quick-fill-options">
              <button type="button" className="btn-secondary small" onClick={useCommonItems}>
                <RotateCcw size={14} /> Load Common Items
              </button>
              <button type="button" className="btn-secondary small" onClick={resetForm}>
                <History size={14} /> Reset
              </button>
            </div>
          )}

          <div className="work-items-container">
            {formData.items.map((item, index) => (
              <div key={index} className="work-item-form">
                <div className="item-row">
                  <div className="form-group suggestion-group">
                    <label>Item Name</label>
                    <div className="suggestion-wrapper">
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        onFocus={() => item.itemName && showSuggestions(index, item.itemName)}
                        onBlur={() => setTimeout(() => setActiveField(null), 200)}
                        placeholder="E.g., 'Saree Polishing'"
                        required
                        className="item-name-input"
                      />
                      {activeField === index && suggestions[index] && suggestions[index].length > 0 && (
                        <div className="suggestions-dropdown">
                          {suggestions[index].map((suggestion, suggestionIndex) => (
                            <div
                              key={suggestionIndex}
                              className="suggestion-item"
                              onMouseDown={() => selectSuggestion(index, suggestion)}
                            >
                              <span className="suggestion-name">{suggestion.name}</span>
                              <span className="suggestion-rate">₹{suggestion.rate}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.wageRate}
                      onChange={(e) => handleItemChange(index, 'wageRate', e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Pieces</label>
                    <input
                      type="number"
                      min="0"
                      value={item.piecesCompleted}
                      onChange={(e) => handleItemChange(index, 'piecesCompleted', e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Total (₹)</label>
                    <input
                      type="text"
                      value={item.totalWage ? item.totalWage.toFixed(2) : '0.00'}
                      readOnly
                      className="readonly rupee-amount"
                    />
                  </div>

                  <button
                    type="button"
                    className="remove-item-btn"
                    onClick={() => removeItem(index)}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="btn-secondary add-item-btn" onClick={addItem}>
            <Plus size={16} />
            Add Another Item
          </button>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="2"
              placeholder="Any additional notes..."
            />
          </div>
        </form>

        <div className="modal-footer">
          <div className="total-section">
            <strong>Daily Total: ₹{calculateTotal().toFixed(2)}</strong>
          </div>
          <div className="footer-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" form="work-form" className="btn-primary" disabled={loading}>
              {loading ? 'Adding Work...' : 'Add Work Record'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerForm;