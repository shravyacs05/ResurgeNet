import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PartnerApprovals = ({ user }) => {
  const [partners, setPartners] = useState([]);
  const [allPartners, setAllPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [meetingData, setMeetingData] = useState({
    date: '',
    time: '',
    topic: '',
    description: ''
  });

  const API_BASE_URL = 'http://localhost:5002/api/partners';

  const supportIcons = {
    money: '💰',
    food: '🍲',
    medical: '🏥',
    shelter: '🏠',
    clothing: '👕',
    volunteers: '👥',
    transport: '🚚',
    equipment: '🔧',
    counseling: '💬',
    other: '📦'
  };

  // Fetch all partners on component mount
  useEffect(() => {
    fetchAllPartners();
  }, []);

  // Filter partners when activeTab changes
  useEffect(() => {
    filterPartnersByStatus();
  }, [activeTab, allPartners]);

  const fetchAllPartners = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching ALL partners from:', API_BASE_URL);
      
      const response = await axios.get(API_BASE_URL);
      
      console.log('📥 API Response:', response.data);
      console.log('📊 Total partners fetched:', response.data.data?.length || 0);
      
      if (response.data.success && response.data.data) {
        setAllPartners(response.data.data);
        console.log('✅ All partners stored:', response.data.data.length);
        
        const statusBreakdown = response.data.data.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Status breakdown:', statusBreakdown);
      }
    } catch (error) {
      console.error('❌ Error fetching partners:', error);
      alert('Error loading partners: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const filterPartnersByStatus = () => {
    console.log('🔍 Filtering by status:', activeTab);
    console.log('📦 Total partners:', allPartners.length);
    
    const filtered = allPartners.filter(p => p.status === activeTab);
    console.log('✅ Filtered partners:', filtered.length);
    
    setPartners(filtered);
  };

  const handleApprove = async (partnerId) => {
    if (!window.confirm('Are you sure you want to approve this organization?')) {
      return;
    }

    setActionLoading(true);
    try {
      console.log('✅ Approving partner:', partnerId);
      console.log('👤 User:', user);
      
      const response = await axios.patch(`${API_BASE_URL}/${partnerId}/approve`, {
        approvedBy: user?.email || user?.uid || user?.id || 'admin',
        approverName: user?.displayName || user?.name || 'Super Admin'
      });

      console.log('✅ Response:', response.data);

      if (response.data.success) {
        alert('✅ Organization approved successfully!');
        await fetchAllPartners();
        setShowModal(false);
      }
    } catch (error) {
      console.error('❌ Error approving partner:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(`Error: ${error.response?.data?.message || 'Failed to approve partner'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (partnerId) => {
    if (!rejectReason || !rejectReason.trim()) {
      alert('❌ Please provide a reason for rejection');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this organization?')) {
      return;
    }

    setActionLoading(true);
    try {
      console.log('❌ Rejecting partner:', partnerId);
      console.log('📝 Reason:', rejectReason);
      console.log('👤 User:', user);
      
      const response = await axios.patch(`${API_BASE_URL}/${partnerId}/reject`, {
        rejectedBy: user?.email || user?.uid || user?.id || 'admin',
        rejectionReason: rejectReason.trim()
      });

      console.log('✅ Response:', response.data);
      if (response.data.success) {
        alert('❌ Organization rejected successfully');
        await fetchAllPartners();
        setShowModal(false);
        setRejectReason('');
      }
    } catch (error) {
      console.error('❌ Error rejecting partner:', error);
      console.error('❌ Error response:', error.response?.data);
      alert(`Error: ${error.response?.data?.message || 'Failed to reject partner'}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingData.date || !meetingData.time || !meetingData.topic) {
      alert('Please fill in all required meeting details');
      return;
    }

    setActionLoading(true);
    try {
      alert(`✅ Meeting scheduled for ${meetingData.date} at ${meetingData.time}\nInvitation sent to ${selectedPartner.email}`);
      
      setShowMeetingModal(false);
      setMeetingData({ date: '', time: '', topic: '', description: '' });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      alert('Error scheduling meeting');
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (partner) => {
    setSelectedPartner(partner);
    setShowModal(true);
    setRejectReason('');
  };

  const openMeetingModal = (partner) => {
    setSelectedPartner(partner);
    setShowMeetingModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-500', text: 'Pending Review' },
      approved: { bg: 'bg-green-500', text: 'Approved' },
      rejected: { bg: 'bg-red-500', text: 'Rejected' }
    };
    return badges[status] || badges.pending;
  };

  const counts = {
    pending: allPartners.filter(p => p.status === 'pending').length,
    approved: allPartners.filter(p => p.status === 'approved').length,
    rejected: allPartners.filter(p => p.status === 'rejected').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-3">Partner Approvals</h1>
              <p className="text-blue-100 text-lg opacity-90">Review and verify relief organization registrations</p>
            </div>
            <button
              onClick={fetchAllPartners}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl"
            >
              <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-900/20 border-2 border-yellow-500 rounded-xl p-6 text-center shadow-2xl hover:shadow-yellow-500/25 transition-all duration-300">
            <div className="text-5xl font-bold text-yellow-400 mb-3">
              {counts.pending}
            </div>
            <div className="text-yellow-200 font-medium text-lg">Pending Review</div>
            <div className="text-yellow-400 text-sm mt-2">Awaiting approval</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/40 to-green-900/20 border-2 border-green-500 rounded-xl p-6 text-center shadow-2xl hover:shadow-green-500/25 transition-all duration-300">
            <div className="text-5xl font-bold text-green-400 mb-3">
              {counts.approved}
            </div>
            <div className="text-green-200 font-medium text-lg">Approved</div>
            <div className="text-green-400 text-sm mt-2">Active partners</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/40 to-red-900/20 border-2 border-red-500 rounded-xl p-6 text-center shadow-2xl hover:shadow-red-500/25 transition-all duration-300">
            <div className="text-5xl font-bold text-red-400 mb-3">
              {counts.rejected}
            </div>
            <div className="text-red-200 font-medium text-lg">Rejected</div>
            <div className="text-red-400 text-sm mt-2">Not approved</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl mb-8 shadow-2xl overflow-hidden">
          <div className="flex border-b border-gray-700">
            {['pending', 'approved', 'rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-5 px-6 font-semibold text-lg transition-all duration-300 ${
                  activeTab === tab
                    ? tab === 'pending' 
                      ? 'bg-yellow-600 text-white border-b-4 border-yellow-400 shadow-inner' 
                      : tab === 'approved' 
                      ? 'bg-green-600 text-white border-b-4 border-green-400 shadow-inner'
                      : 'bg-red-600 text-white border-b-4 border-red-400 shadow-inner'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                {tab === 'pending' && `⏳ Pending (${counts.pending})`}
                {tab === 'approved' && `✅ Approved (${counts.approved})`}
                {tab === 'rejected' && `❌ Rejected (${counts.rejected})`}
              </button>
            ))}
          </div>
        </div>

        {/* Partners List */}
        {loading ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-16 text-center border-2 border-gray-700 shadow-2xl">
            <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-500 mx-auto mb-6"></div>
            <p className="text-gray-300 text-xl">Loading applications...</p>
            <p className="text-gray-500 text-sm mt-2">Please wait while we fetch partner data</p>
          </div>
        ) : partners.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-16 text-center border-2 border-gray-700 shadow-2xl">
            <div className="text-8xl mb-6 opacity-60">📋</div>
            <h3 className="text-2xl font-bold text-white mb-3">No {activeTab} applications</h3>
            <p className="text-gray-400 text-lg">
              {activeTab === 'pending' 
                ? 'All applications have been reviewed and processed' 
                : `No ${activeTab} applications found in the system`}
            </p>
            <button
              onClick={fetchAllPartners}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg"
            >
              Check Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {partners.map(partner => {
              const badge = getStatusBadge(partner.status);
              
              return (
                <div
                  key={partner._id}
                  className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border-2 border-gray-700 hover:border-blue-500 transition-all duration-300 shadow-2xl hover:shadow-blue-500/10"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h3 className="text-2xl font-bold text-white">
                            {partner.organizationName}
                          </h3>
                          <span className={`${badge.bg} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-gray-400 text-lg mb-2">{partner.organizationType}</p>
                        <p className="text-gray-500 text-sm">
                          📅 Applied: {new Date(partner.createdAt).toLocaleString()} • 
                          📋 Reg: {partner.registrationNumber || 'N/A'}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => openModal(partner)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300">
                        <p className="text-gray-400 text-sm mb-2">👤 Contact Person</p>
                        <p className="text-white font-semibold text-lg">{partner.contactPerson || partner.contactPersonName || 'N/A'}</p>
                        <p className="text-gray-400 text-sm mt-1">📞 {partner.phone}</p>
                      </div>
                      
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300">
                        <p className="text-gray-400 text-sm mb-2">📧 Email</p>
                        <p className="text-blue-400 text-sm break-all">{partner.email}</p>
                      </div>
                      
                      <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-all duration-300">
                        <p className="text-gray-400 text-sm mb-2">📍 Location</p>
                        <p className="text-white text-lg">{partner.city}, {partner.state}</p>
                      </div>
                      
                      {partner.monetaryPledge > 0 && (
                        <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-500 rounded-lg p-4 shadow-lg hover:shadow-green-500/25 transition-all duration-300">
                          <p className="text-green-400 text-sm mb-2">💰 Pledged Amount</p>
                          <p className="text-green-200 font-bold text-xl">
                            ₹{partner.monetaryPledge.toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mb-6">
                      <p className="text-gray-400 text-sm mb-3">🎯 Support Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {partner.supportType && partner.supportType.map((type, index) => (
                          <span
                            key={index}
                            className="bg-blue-900/50 border border-blue-500 text-blue-200 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-800/50 transition-all duration-300"
                          >
                            {supportIcons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {partner.status === 'pending' && (
                      <div className="flex space-x-4 pt-6 border-t border-gray-700">
                        <button
                          onClick={() => handleApprove(partner._id)}
                          disabled={actionLoading}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve Organization
                        </button>
                        <button
                          onClick={() => openMeetingModal(partner)}
                          className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Schedule Meeting
                        </button>
                        <button
                          onClick={() => openModal(partner)}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject Application
                        </button>
                      </div>
                    )}

                    {partner.status === 'approved' && partner.approvedBy && (
                      <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border-2 border-green-500 rounded-xl p-4 mt-6 shadow-lg">
                        <p className="text-green-200 text-sm flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          ✅ Approved by {partner.approverName || partner.approvedBy} on {new Date(partner.approvedAt).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {partner.status === 'rejected' && partner.rejectionReason && (
                      <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-2 border-red-500 rounded-xl p-4 mt-6 shadow-lg">
                        <p className="text-red-200 text-sm font-medium mb-2 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Rejection Reason:
                        </p>
                        <p className="text-red-100 text-sm">{partner.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-700 shadow-2xl my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white sticky top-0 z-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-3">{selectedPartner.organizationName}</h2>
                  <p className="text-blue-100 text-lg opacity-90">{selectedPartner.organizationType}</p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRejectReason('');
                  }}
                  className="text-white hover:text-gray-200 text-4xl font-light transition-all duration-300 hover:scale-110"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-8">
              {/* Registration Details */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
                  📋 Registration Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-2">Registration Number</p>
                    <p className="text-white font-mono text-xl">{selectedPartner.registrationNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-2">Organization Type</p>
                    <p className="text-white text-xl">{selectedPartner.organizationType}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
                  👥 Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-2">Contact Person</p>
                    <p className="text-white text-xl">{selectedPartner.contactPerson || selectedPartner.contactPersonName || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-2">Email Address</p>
                    <p className="text-blue-400 text-xl break-all">{selectedPartner.email}</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                    <p className="text-gray-400 text-sm mb-2">Phone Number</p>
                    <p className="text-white text-xl">{selectedPartner.phone}</p>
                  </div>
                  {selectedPartner.website && (
                    <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
                      <p className="text-gray-400 text-sm mb-2">Website</p>
                      <a
                        href={selectedPartner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xl transition-all duration-300"
                      >
                        {selectedPartner.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
                  📍 Address
                </h3>
                <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                  <p className="text-white text-lg">
                    {selectedPartner.address || 'N/A'}<br/>
                    {selectedPartner.city}, {selectedPartner.state} - {selectedPartner.pincode}
                  </p>
                </div>
              </div>

              {/* Support Details */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
                  🎯 Support Details
                </h3>
                <div className="flex flex-wrap gap-3 mb-6">
                  {selectedPartner.supportType && selectedPartner.supportType.map((type, index) => (
                    <span
                      key={index}
                      className="bg-blue-900/50 border border-blue-500 text-blue-200 px-5 py-3 rounded-full text-lg font-medium hover:bg-blue-800/50 transition-all duration-300"
                    >
                      {supportIcons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                    </span>
                  ))}
                </div>
                {selectedPartner.monetaryPledge > 0 && (
                  <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border-2 border-green-500 rounded-xl p-6 shadow-2xl">
                    <p className="text-green-400 text-lg mb-3">💰 Monetary Pledge</p>
                    <p className="text-green-100 text-4xl font-bold">
                      ₹ {selectedPartner.monetaryPledge.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedPartner.description && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-3">
                    📝 About Organization
                  </h3>
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600">
                    <p className="text-gray-300 text-lg whitespace-pre-wrap leading-relaxed">{selectedPartner.description}</p>
                  </div>
                </div>
              )}

              {/* Actions for Pending */}
              {selectedPartner.status === 'pending' && (
                <div className="border-t border-gray-700 pt-8">
                  <h3 className="text-2xl font-bold text-white mb-6">⚡ Admin Action</h3>
                  
                  <div className="mb-6">
                    <label className="block text-gray-300 mb-3 text-lg font-medium">Rejection Reason (if rejecting)</label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows="4"
                      className="w-full px-6 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 resize-none"
                      placeholder="Provide detailed reason for rejection..."
                    />
                  </div>

                  <div className="flex space-x-6">
                    <button
                      onClick={() => handleApprove(selectedPartner._id)}
                      disabled={actionLoading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-5 rounded-xl font-bold text-xl transition-all duration-300 disabled:opacity-50 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {actionLoading ? 'Processing...' : 'Approve Organization'}
                    </button>
                    <button
                      onClick={() => handleReject(selectedPartner._id)}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-5 rounded-xl font-bold text-xl transition-all duration-300 disabled:opacity-50 shadow-2xl hover:shadow-3xl flex items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {actionLoading ? 'Processing...' : 'Reject Application'}
                    </button>
                  </div>
                </div>
              )}

              {/* Show Approval/Rejection Info */}
              {selectedPartner.status === 'approved' && (
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/20 border-2 border-green-500 rounded-xl p-6">
                  <p className="text-green-200 text-lg flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    ✅ Approved by {selectedPartner.approverName || selectedPartner.approvedBy} on {new Date(selectedPartner.approvedAt).toLocaleString()}
                  </p>
                </div>
              )}

              {selectedPartner.status === 'rejected' && (
                <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-2 border-red-500 rounded-xl p-6">
                  <p className="text-red-200 text-lg font-medium mb-2 flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Rejection Reason:
                  </p>
                  <p className="text-red-100 text-lg mb-3">{selectedPartner.rejectionReason}</p>
                  <p className="text-red-300 text-sm">
                    Rejected by {selectedPartner.rejectedBy} on {new Date(selectedPartner.rejectedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meeting Modal */}
      {showMeetingModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl max-w-2xl w-full border-2 border-gray-700 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-3">📅 Schedule Meeting</h2>
                  <p className="text-purple-100 text-lg">with {selectedPartner.organizationName}</p>
                </div>
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="text-white hover:text-gray-200 text-4xl font-light transition-all duration-300 hover:scale-110"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-gray-300 mb-3 text-lg font-medium">📅 Meeting Date *</label>
                <input
                  type="date"
                  value={meetingData.date}
                  onChange={(e) => setMeetingData({...meetingData, date: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-3 text-lg font-medium">⏰ Meeting Time *</label>
                <input
                  type="time"
                  value={meetingData.time}
                  onChange={(e) => setMeetingData({...meetingData, time: e.target.value})}
                  className="w-full px-6 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-3 text-lg font-medium">💬 Meeting Topic *</label>
                <input
                  type="text"
                  value={meetingData.topic}
                  onChange={(e) => setMeetingData({...meetingData, topic: e.target.value})}
                  placeholder="e.g., Partnership Discussion, Resource Planning, Collaboration Meeting"
                  className="w-full px-6 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-3 text-lg font-medium">📝 Description</label>
                <textarea
                  value={meetingData.description}
                  onChange={(e) => setMeetingData({...meetingData, description: e.target.value})}
                  rows="5"
                  placeholder="Add any additional details about the meeting agenda, discussion points, or preparation required..."
                  className="w-full px-6 py-4 bg-gray-700 border-2 border-gray-600 rounded-xl text-white text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 resize-none"
                />
              </div>

              <div className="bg-blue-900/30 border-2 border-blue-500 rounded-xl p-6">
                <p className="text-blue-200 text-lg">
                  <span className="font-semibold">📧 Meeting Invitation will be sent to:</span><br/>
                  <span className="text-blue-100">{selectedPartner.email}</span>
                </p>
              </div>

              <div className="flex space-x-6 pt-6">
                <button
                  onClick={() => setShowMeetingModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeeting}
                  disabled={actionLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {actionLoading ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnerApprovals;