import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  IndianRupee, 
  Clock, 
  ExternalLink, 
  Filter, 
  Search,
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [checkouts, setCheckouts] = useState([]);
  const [stats, setStats] = useState({ totalAbandoned: 0, totalPending: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const [checkoutsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/abandoned`, { params }),
        axios.get(`${API_BASE_URL}/stats`)
      ]);

      setCheckouts(checkoutsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, dateRange]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'abandoned': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'converted': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Recovery Dashboard</h1>
            <p className="text-slate-500 mt-1">Manage and track Shopify abandoned checkouts</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center justify-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all text-slate-700 font-medium shadow-sm"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Abandoned Checkouts</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalAbandoned}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
              <IndianRupee size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Potential Revenue</p>
              <h3 className="text-2xl font-bold text-slate-900">₹{stats.totalAmount}</h3>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pending Processing</p>
              <h3 className="text-2xl font-bold text-slate-900">{stats.totalPending}</h3>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-sm focus:outline-none text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">From</span>
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="bg-transparent text-sm focus:outline-none text-slate-700"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">To</span>
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="bg-transparent text-sm focus:outline-none text-slate-700"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan="6" className="px-6 py-4">
                        <div className="h-10 bg-slate-50 rounded-lg"></div>
                      </td>
                    </tr>
                  ))
                ) : checkouts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-20 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle size={40} />
                        <p className="text-lg font-medium">No checkouts found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  checkouts.map((checkout) => (
                    <tr key={checkout._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{checkout.name}</div>
                        <div className="text-xs text-slate-400">ID: {checkout.checkout_id}</div>
                        {checkout.products && checkout.products.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {checkout.products.map((prod, idx) => (
                              <a 
                                key={idx} 
                                href={`https://suryatras.com/search?q=${encodeURIComponent(prod.title)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded inline-block mr-1 hover:bg-blue-100 transition-colors border border-blue-100"
                              >
                                {prod.title} x{prod.quantity}
                              </a>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{checkout.email}</div>
                        <div className="text-sm text-slate-400">{checkout.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">
                          {checkout.currency} {checkout.amount}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(checkout.status)}`}>
                          {checkout.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {format(new Date(checkout.created_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <a 
                          href={checkout.checkout_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-bold"
                        >
                          Recover <ExternalLink size={14} />
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
