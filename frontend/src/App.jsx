import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  IndianRupee, 
  Clock, 
  ExternalLink, 
  Filter, 
  RefreshCcw,
  AlertCircle,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Download,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [checkouts, setCheckouts] = useState([]);
  const [stats, setStats] = useState({ totalAbandoned: 0, totalPending: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (filterStatus) params.status = filterStatus;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      const [checkoutsRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/abandoned`, { params }),
        axios.get(`${API_BASE_URL}/stats`, { params: { startDate: dateRange.start, endDate: dateRange.end } })
      ]);

      setCheckouts(checkoutsRes.data.data || []);
      setTotalPages(checkoutsRes.data.pages || 1);
      setTotalItems(checkoutsRes.data.total || 0);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, dateRange, page]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'abandoned': return 'bg-red-50 text-red-600 border-red-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'converted': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const openWhatsApp = (phone, name, url) => {
    if (!phone) return alert('Phone number not available');
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `Hello ${name}, we noticed you left some items in your cart. You can complete your purchase here: ${url}`;
    const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91'+cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleExport = () => {
    if (checkouts.length === 0) return alert('No data to export');
    const exportData = checkouts.map(item => ({
      'Date': format(new Date(item.created_at), 'yyyy-MM-dd HH:mm'),
      'Customer Name': item.name,
      'Phone': item.phone,
      'Email': item.email,
      'Amount (INR)': item.amount,
      'Status': item.status,
      'Address': item.address || 'N/A',
      'Pincode': item.pincode || 'N/A',
      'Products': item.products ? item.products.map(p => `${p.title} (x${p.quantity})`).join(', ') : '',
      'Checkout URL': item.checkout_url
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Abandoned Leads");
    XLSX.writeFile(workbook, `GoKwik_Leads_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) { startPage = Math.max(1, endPage - maxVisiblePages + 1); }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button key={i} onClick={() => { setPage(i); window.scrollTo({top: 0, behavior: 'smooth'}); }}
          className={`w-9 h-9 md:w-10 md:h-10 rounded-xl text-xs font-bold transition-all ${page === i ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 scale-105' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
        > {i} </button>
      );
    }
    return pages;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 tracking-tight">
      {/* Sleek Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 md:px-8">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
           <div><h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">GoKwik <span className="text-blue-600">Recovery</span></h1><p className="hidden md:block text-[9px] text-slate-400 font-bold uppercase tracking-widest">Velence</p></div>
           <div className="flex gap-2">
              <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 px-4 py-2 rounded-xl text-white font-semibold text-xs md:text-sm shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all active:scale-95">
                <Download size={14} /><span className="hidden sm:inline">Export Excel</span><span className="sm:hidden">Excel</span>
              </button>
              <button onClick={() => { setPage(1); fetchData(); }} className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-xl text-white font-semibold text-xs md:text-sm shadow-xl shadow-slate-200 hover:bg-blue-600 transition-all active:scale-95">
                <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /><span>Sync Data</span>
              </button>
           </div>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto">
        {/* Balanced Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center gap-5">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Users size={22} /></div>
            <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Abandoned</p><h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalAbandoned}</h3></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center gap-5">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><IndianRupee size={22} /></div>
            <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Potential Revenue</p><h3 className="text-2xl font-bold text-slate-900 tracking-tight">₹{parseFloat(stats.totalAmount).toLocaleString('en-IN')}</h3></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/50 flex items-center gap-5">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><Clock size={22} /></div>
            <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sync Queue</p><h3 className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalPending}</h3></div>
          </div>
        </div>

        {/* Improved Filter Bar UI */}
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/50 mb-8 flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-3 bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all group">
            <Filter size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lead Status</span>
              <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="bg-transparent text-sm font-bold focus:outline-none text-slate-700 min-w-[140px] cursor-pointer">
                <option value="">All Statuses</option><option value="abandoned">Abandoned</option><option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Date Range Picker - Compact UI */}
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-3 px-3 py-1.5 flex-1 hover:bg-white rounded-xl transition-all group border border-transparent hover:border-slate-100">
                <Calendar size={16} className="text-slate-400 group-hover:text-blue-500" />
                <div className="flex flex-col flex-1">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Start Date</span>
                   <input type="date" value={dateRange.start} onChange={(e) => { setDateRange({...dateRange, start: e.target.value}); setPage(1); }} className="bg-transparent text-sm font-bold outline-none text-slate-700 w-full" />
                </div>
             </div>
             
             <div className="hidden sm:flex items-center justify-center text-slate-200">
                <ArrowRight size={16} />
             </div>

             <div className="flex items-center gap-3 px-3 py-1.5 flex-1 hover:bg-white rounded-xl transition-all group border border-transparent hover:border-slate-100">
                <Calendar size={16} className="text-slate-400 group-hover:text-blue-500" />
                <div className="flex flex-col flex-1">
                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">End Date</span>
                   <input type="date" value={dateRange.end} onChange={(e) => { setDateRange({...dateRange, end: e.target.value}); setPage(1); }} className="bg-transparent text-sm font-bold outline-none text-slate-700 w-full" />
                </div>
             </div>
          </div>

          <div className="hidden xl:flex flex-col items-end px-4 border-l border-slate-100">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Live Database</span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">{totalItems} Leads</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mb-10">
          {/* Desktop Version Table */}
          <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Lead Profile</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Logistics</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Valuation</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-center">Status</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                   Array(10).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse"><td colSpan="5" className="px-8 py-6"><div className="h-12 bg-slate-50 rounded-xl w-full"></div></td></tr>
                  ))
                ) : checkouts.map((checkout) => (
                  <tr key={checkout._id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="font-bold text-slate-900 text-sm leading-tight">{checkout.name}</div>
                      <div className="text-[11px] text-slate-400 font-medium mt-0.5">{checkout.email}</div>
                      <div className="text-blue-600 font-bold text-[11px] mt-0.5 tracking-wide">{checkout.phone}</div>
                      {checkout.products && checkout.products.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {checkout.products.map((prod, idx) => (<span key={idx} className="text-[9px] bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg font-semibold border border-slate-100">{prod.title} ×{prod.quantity}</span>))}
                        </div>
                      )}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-start gap-3 max-w-[260px]">
                        <div className="p-2 bg-slate-50 rounded-lg text-slate-300 group-hover:text-blue-400 transition-colors shrink-0"><MapPin size={14} /></div>
                        <div>
                          <div className="text-[11px] font-medium text-slate-600 line-clamp-1 italic">{checkout.address || 'Address missing'}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-wider">Zip: {checkout.pincode || '-----'} • {format(new Date(checkout.created_at), 'MMM dd, yyyy • HH:mm')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5"><div className="text-base font-bold text-slate-900 tracking-tight">₹{parseFloat(checkout.amount).toLocaleString('en-IN')}</div></td>
                    <td className="px-8 py-5 text-center"><span className={`px-3 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${getStatusColor(checkout.status)}`}>{checkout.status}</span></td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => openWhatsApp(checkout.phone, checkout.name, checkout.checkout_url)} className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100 hover:bg-emerald-600 active:scale-95 transition-all"><MessageCircle size={16} strokeWidth={2.5} /></button>
                        <a href={checkout.checkout_url} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"><ExternalLink size={16} strokeWidth={2.5} /></a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Version Cards */}
          <div className="lg:hidden flex flex-col gap-4">
            {loading ? (
               Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200/60 animate-pulse h-48"></div>
              ))
            ) : checkouts.map((checkout) => (
              <div key={checkout._id} className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                <div className="flex justify-between items-start">
                   <div className="flex-1"><h4 className="font-bold text-slate-900 text-base leading-tight">{checkout.name}</h4><p className="text-[11px] text-slate-400 font-medium mt-0.5">{checkout.email}</p><p className="text-blue-600 font-bold text-[13px] mt-1 tracking-wide">{checkout.phone}</p></div>
                   <div className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border uppercase tracking-wider ${getStatusColor(checkout.status)}`}>{checkout.status}</div>
                </div>
                <div className="flex flex-col gap-3">
                   <div className="flex items-start gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100"><MapPin size={15} className="text-slate-300 mt-0.5 shrink-0" /><div className="overflow-hidden"><p className="text-[11px] font-medium text-slate-600 italic line-clamp-1">{checkout.address || 'Address missing'}</p><p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Zip: {checkout.pincode || '-----'}</p></div></div>
                   {checkout.products && checkout.products.length > 0 && (<div className="flex flex-wrap gap-1.5">{checkout.products.map((prod, idx) => (<span key={idx} className="text-[9px] bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg font-semibold border border-slate-100">{prod.title} ×{prod.quantity}</span>))}</div>)}
                </div>
                <div className="flex items-center justify-between mt-1 pt-4 border-t border-slate-100">
                   <div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">₹{parseFloat(checkout.amount).toLocaleString('en-IN')}</p><p className="text-[10px] text-slate-400 font-medium mt-0.5">{format(new Date(checkout.created_at), 'MMM dd, HH:mm')}</p></div>
                   <div className="flex gap-3">
                      <button onClick={() => openWhatsApp(checkout.phone, checkout.name, checkout.checkout_url)} className="flex items-center justify-center w-12 h-12 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100"><MessageCircle size={20} strokeWidth={2.5} /></button>
                      <a href={checkout.checkout_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><ExternalLink size={20} strokeWidth={2.5} /></a>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Improved Pagination Section */}
        {totalPages > 1 && (
          <div className="bg-white p-4 md:p-6 rounded-[2.5rem] shadow-sm border border-slate-200/60 flex flex-col md:flex-row items-center justify-center gap-6">
            <div className="flex items-center gap-2 md:gap-4">
              <button disabled={page === 1 || loading} onClick={() => { setPage(p => p - 1); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronLeft size={20} strokeWidth={3} />
              </button>
              <div className="flex items-center gap-2">{renderPageNumbers()}</div>
              <button disabled={page === totalPages || loading} onClick={() => { setPage(p => p + 1); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm">
                <ChevronRight size={20} strokeWidth={3} />
              </button>
            </div>
            <div className="md:absolute md:right-12 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Page {page} of {totalPages}</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
