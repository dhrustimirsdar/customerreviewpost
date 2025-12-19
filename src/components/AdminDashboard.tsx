import { useState, useEffect } from 'react';
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle, ThumbsUp, ThumbsDown, LogOut, BarChart3, MessageSquare, Brain, Info, Eye, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Analytics from './Analytics';
import MessageThread from './MessageThread';
import TranslatedText from './TranslatedText';
import LanguageSelector from './LanguageSelector';

interface Complaint {
  id: string;
  complaint_text: string;
  category: string;
  sentiment: string;
  priority: string;
  ai_response: string;
  ai_confidence_score?: number;
  ai_explanation?: string;
  status: string;
  feedback_helpful: boolean | null;
  created_at: string;
  phone_number?: string | null;
  tracking_id?: string | null;
  user_email?: string | null;
}

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [activeTab, setActiveTab] = useState<'complaints' | 'analytics'>('complaints');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [messageCounts, setMessageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (complaints.length > 0) {
      fetchMessageCounts();
    }
  }, [complaints]);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-complaints`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch complaints');
      }

      setComplaints(data.complaints || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessageCounts = async () => {
    try {
      const counts: Record<string, number> = {};

      await Promise.all(
        complaints.map(async (complaint) => {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/complaint-messages?complaint_id=${complaint.id}`,
            {
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              },
            }
          );

          const result = await response.json();
          if (result.success) {
            counts[complaint.id] = result.messages.length;
          }
        })
      );

      setMessageCounts(counts);
    } catch (err) {
      console.error('Failed to fetch message counts:', err);
    }
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-complaints`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update complaint');
      }

      setComplaints(complaints.map(c => c.id === id ? { ...c, status } : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update complaint');
    }
  };

  const updateFeedback = async (id: string, helpful: boolean) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-complaints`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, feedback_helpful: helpful }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update feedback');
      }

      setComplaints(complaints.map(c => c.id === id ? { ...c, feedback_helpful: helpful } : c));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update feedback');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true;
    return complaint.status.toLowerCase() === filter;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    high: complaints.filter(c => c.priority === 'High').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  <TranslatedText text="Admin Dashboard" />
                </h1>
                <p className="text-sm text-gray-600">
                  <TranslatedText text="Complaint Management System" />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <TranslatedText text="Logout" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('complaints')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'complaints'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <TranslatedText text="Complaints" />
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <TranslatedText text="Analytics" />
          </button>
        </div>

        {activeTab === 'analytics' ? (
          <Analytics complaints={complaints} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="Total" />
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <LayoutDashboard className="w-10 h-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="Pending" />
                </p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="Resolved" />
                </p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolved}</p>
              </div>
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  <TranslatedText text="High Priority" />
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.high}</p>
              </div>
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                <TranslatedText text="Complaints" />
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'all'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TranslatedText text="All" />
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'pending'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TranslatedText text="Pending" />
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === 'resolved'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <TranslatedText text="Resolved" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <Clock className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                <TranslatedText text="Loading complaints..." />
              </p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">
                <TranslatedText text="No complaints found" />
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="Complaint" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="Contact" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="Category" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="Priority" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="AI Confidence" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="Messages" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="Status" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      <TranslatedText text="Actions" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 line-clamp-2">{complaint.complaint_text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </p>
                          {complaint.tracking_id && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              Tracking: {complaint.tracking_id}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-600">
                          {complaint.user_email && (
                            <p className="mb-1">{complaint.user_email}</p>
                          )}
                          {complaint.phone_number && (
                            <p className="text-gray-700 font-medium">{complaint.phone_number}</p>
                          )}
                          {!complaint.user_email && !complaint.phone_number && (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{complaint.category}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {complaint.ai_confidence_score !== undefined ? (
                          <div className="flex items-center gap-1">
                            <Brain className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-gray-900">
                              {complaint.ai_confidence_score}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">
                            {messageCounts[complaint.id] || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          complaint.status === 'Resolved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedComplaint(complaint)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            <TranslatedText text="View" />
                          </button>
                          {complaint.status === 'Pending' && (
                            <button
                              onClick={() => updateComplaintStatus(complaint.id, 'Resolved')}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                            >
                              <TranslatedText text="Resolve" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

          </>
        )}
      </main>

      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                <TranslatedText text="Complaint Details" />
              </h3>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <TranslatedText text="Complaint ID" />
                </p>
                <p className="text-sm font-mono text-gray-900">{selectedComplaint.id}</p>
              </div>

              {(selectedComplaint.user_email || selectedComplaint.phone_number || selectedComplaint.tracking_id) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  {selectedComplaint.user_email && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        <TranslatedText text="Email" />
                      </p>
                      <p className="text-sm text-gray-900">{selectedComplaint.user_email}</p>
                    </div>
                  )}
                  {selectedComplaint.phone_number && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        <TranslatedText text="Phone Number" />
                      </p>
                      <p className="text-sm text-gray-900">{selectedComplaint.phone_number}</p>
                    </div>
                  )}
                  {selectedComplaint.tracking_id && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        <TranslatedText text="Tracking ID" />
                      </p>
                      <p className="text-sm text-blue-600 font-medium">{selectedComplaint.tracking_id}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-gray-600 mb-2">
                  <TranslatedText text="Complaint Text" />
                </p>
                <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {selectedComplaint.complaint_text}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    <TranslatedText text="Category" />
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{selectedComplaint.category}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    <TranslatedText text="Priority" />
                  </p>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(selectedComplaint.priority)}`}>
                    <TranslatedText text={selectedComplaint.priority} />
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    <TranslatedText text="Sentiment" />
                  </p>
                  <span className={`text-sm font-medium ${
                    selectedComplaint.sentiment === 'Positive' ? 'text-green-600' :
                    selectedComplaint.sentiment === 'Negative' ? 'text-red-600' :
                    'text-gray-600'
                  }`}>
                    <TranslatedText text={selectedComplaint.sentiment} />
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    <TranslatedText text="Status" />
                  </p>
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                    selectedComplaint.status === 'Resolved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    <TranslatedText text={selectedComplaint.status} />
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    <TranslatedText text="AI Response" />
                  </h4>
                  {selectedComplaint.ai_confidence_score !== undefined && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                      {selectedComplaint.ai_confidence_score}% <TranslatedText text="confidence" />
                    </span>
                  )}
                </div>
                <p className="text-sm text-blue-800 mb-3">{selectedComplaint.ai_response}</p>

                {selectedComplaint.ai_explanation && (
                  <div className="bg-white bg-opacity-50 rounded p-3 text-xs text-blue-700">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium mb-1">
                          <TranslatedText text="AI Explanation:" />
                        </p>
                        <p>{selectedComplaint.ai_explanation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedComplaint.feedback_helpful !== null && (
                  <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-sm">
                    <span className="text-blue-700">
                      <TranslatedText text="User Feedback:" />
                    </span>
                    {selectedComplaint.feedback_helpful ? (
                      <span className="flex items-center gap-1 text-green-700 font-medium">
                        <ThumbsUp className="w-4 h-4" /> <TranslatedText text="Helpful" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-700 font-medium">
                        <ThumbsDown className="w-4 h-4" /> <TranslatedText text="Not Helpful" />
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <MessageThread complaintId={selectedComplaint.id} isAdmin={true} />
              </div>

              <div className="flex gap-2 justify-end">
                {selectedComplaint.status === 'Pending' && (
                  <button
                    onClick={() => {
                      updateComplaintStatus(selectedComplaint.id, 'Resolved');
                      setSelectedComplaint({ ...selectedComplaint, status: 'Resolved' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    <TranslatedText text="Mark as Resolved" />
                  </button>
                )}
                <button
                  onClick={() => setSelectedComplaint(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <TranslatedText text="Close" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
