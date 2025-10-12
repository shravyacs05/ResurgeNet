import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PledgeSupport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    registrationNumber: '',
    organizationType: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    supportType: [],
    monetaryPledge: '',
    description: ''
  });

  const API_BASE_URL = 'http://localhost:5002/api/partners';

  const organizationTypes = [
    'NGO', 'Trust', 'Society', 'Private Company', 'Foundation',
    'Cooperative Society', 'Government Body', 'Educational Institution',
    'Healthcare Organization', 'Other'
  ];

  const supportTypes = [
    { value: 'money', label: 'Monetary Support' },
    { value: 'food', label: 'Food & Water Supplies' },
    { value: 'medical', label: 'Medical Aid & Equipment' },
    { value: 'shelter', label: 'Shelter & Housing' },
    { value: 'clothing', label: 'Clothing & Essentials' },
    { value: 'volunteers', label: 'Volunteer Manpower' },
    { value: 'transport', label: 'Transport & Logistics' },
    { value: 'equipment', label: 'Equipment & Tools' },
    { value: 'counseling', label: 'Counseling Services' },
    { value: 'other', label: 'Other Support' }
  ];

  const states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir'
  ];

  // Check backend connection on component mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}`);
        console.log('✅ Backend is reachable');
      } catch (err) {
        console.warn('⚠️ Cannot connect to backend:', err);
        setError('Warning: Backend server may not be running. Please ensure it is running on port 5002.');
      }
    };
    checkBackend();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSupportTypeChange = (value) => {
    setFormData(prev => {
      const updated = prev.supportType.includes(value)
        ? prev.supportType.filter(type => type !== value)
        : [...prev.supportType, value];
      return { ...prev, supportType: updated };
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.organizationName.trim()) {
      setError('Organization name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.phone.trim() || formData.phone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    if (!formData.pincode.trim() || formData.pincode.length !== 6) {
      setError('Pincode must be exactly 6 digits');
      return;
    }

    if (formData.supportType.length === 0) {
      setError('Please select at least one type of support');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Submitting to:', API_BASE_URL);
      console.log('📋 Form Data:', formData);

      const payload = {
        organizationName: formData.organizationName.trim(),
        registrationNumber: formData.registrationNumber.trim() || 'PENDING',
        organizationType: formData.organizationType,
        contactPerson: formData.contactPerson.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        website: formData.website.trim() || '',
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state,
        pincode: formData.pincode.trim(),
        supportType: formData.supportType,
        monetaryPledge: formData.monetaryPledge ? parseInt(formData.monetaryPledge) : 0,
        description: formData.description.trim(),
        status: 'pending'
      };

      console.log('📦 Payload:', payload);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('📥 Response Status:', response.status);
      const data = await response.json();
      console.log('📥 Response Data:', data);

      if (response.ok && data.success) {
        console.log('✅ Registration successful!');
        setSuccess(true);
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/relief-partners');
        }, 3000);
      } else {
        console.error('❌ Registration failed:', data);
        setError(data.message || 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setError('Network error. Please ensure the backend server is running on port 5002.');
    } finally {
      setLoading(false);
    }
  };

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-gray-800/50 backdrop-blur-sm border border-green-500/50 rounded-2xl shadow-lg shadow-green-600/20 p-8 text-center">
          <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Registration Successful! 🎉</h2>
          <p className="text-xl text-gray-300 mb-2">Thank you for pledging your support!</p>
          <p className="text-gray-400 mb-6">
            Your application has been submitted and is pending verification by our admin team.
            You will receive an email notification once your organization is approved.
          </p>
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4 mb-6">
            <p className="text-blue-200 text-sm">
              ✅ Application Status: <span className="font-bold">Pending Verification</span>
            </p>
            <p className="text-blue-300 text-xs mt-2">
              Expected review time: 24-48 hours
            </p>
          </div>
          <button
            onClick={() => navigate('/relief-partners')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg"
          >
            View Relief Partners Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg shadow-blue-600/10 p-8">
        <h1 className="text-3xl font-bold text-white mb-3 text-center">
          Register Your Organization
        </h1>
        <p className="text-gray-400 text-center mb-10">
          Join our verified relief partner network and contribute your expertise or resources.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-6 py-4 rounded-lg mb-6 flex items-start">
            <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Organization Details */}
          <div>
            <h2 className="text-lg font-semibold text-blue-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Organization Details
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="text"
                name="organizationName"
                placeholder="Organization Name *"
                value={formData.organizationName}
                onChange={handleChange}
                required
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="text"
                name="registrationNumber"
                placeholder="Registration Number (optional)"
                value={formData.registrationNumber}
                onChange={handleChange}
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <select
                name="organizationType"
                value={formData.organizationType}
                onChange={handleChange}
                required
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select Organization Type *</option>
                {organizationTypes.map((type, i) => (
                  <option key={i} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-lg font-semibold text-blue-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Information
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="text"
                name="contactPerson"
                placeholder="Contact Person *"
                value={formData.contactPerson}
                onChange={handleChange}
                required
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={handleChange}
                required
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number (10 digits) *"
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength="10"
                pattern="[0-9]{10}"
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="url"
                name="website"
                placeholder="Website (optional)"
                value={formData.website}
                onChange={handleChange}
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-lg font-semibold text-blue-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Address
            </h2>
            <div className="grid md:grid-cols-2 gap-5">
              <input
                type="text"
                name="address"
                placeholder="Street Address *"
                value={formData.address}
                onChange={handleChange}
                required
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <input
                type="text"
                name="city"
                placeholder="City *"
                value={formData.city}
                onChange={handleChange}
                required
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select State *</option>
                {states.map((s, i) => <option key={i} value={s}>{s}</option>)}
              </select>
              <input
                type="text"
                name="pincode"
                placeholder="Pincode (6 digits) *"
                value={formData.pincode}
                onChange={handleChange}
                required
                maxLength="6"
                pattern="[0-9]{6}"
                className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Support Details */}
          <div>
            <h2 className="text-lg font-semibold text-blue-400 mb-4 pb-2 border-b border-gray-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Support Details *
            </h2>
            <p className="text-sm text-gray-400 mb-3">Select at least one type of support you can provide:</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              {supportTypes.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.supportType.includes(value)
                      ? 'bg-blue-600/20 border-blue-500'
                      : 'bg-gray-700/30 border-gray-600 hover:border-blue-500/50 hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.supportType.includes(value)}
                    onChange={() => handleSupportTypeChange(value)}
                    className="accent-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-gray-300 text-sm hover:text-white transition-colors">{label}</span>
                </label>
              ))}
            </div>

            <input
              type="number"
              name="monetaryPledge"
              placeholder="Monetary Pledge Amount (₹) - Optional"
              value={formData.monetaryPledge}
              onChange={handleChange}
              min="0"
              className="p-3 mb-4 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full"
            />
            <textarea
              name="description"
              placeholder="Describe your organization and the support you can provide... *"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              className="p-3 bg-gray-700/60 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-full resize-none"
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex justify-center gap-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg flex items-center gap-2 ${
                loading
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-blue-600/30 hover:shadow-blue-600/50'
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Registration'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/relief-partners')}
              disabled={loading}
              className="px-8 py-3 border border-gray-600 text-gray-300 rounded-lg hover:text-white hover:border-blue-500/50 hover:bg-gray-700/30 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PledgeSupport;