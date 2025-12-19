import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Send, CheckCircle2, Clock, TrendingUp, ThumbsUp, ThumbsDown, Brain, Info,
  MessageCircle, LogOut, Plus, Filter, Search, AlertCircle, Package,
  ChevronRight, Sparkles, BarChart3, X, Phone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import MessageThread from './MessageThread';
import LanguageSelector from './LanguageSelector';
import TranslatedText from './TranslatedText';

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
  feedback_helpful?: boolean | null;
  created_at: string;
  phone_number?: string | null;
  tracking_id?: string | null;
}

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export default function UserDashboard() {
  const { user, signOut } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewComplaint, setShowNewComplaint] = useState(false);
  const [complaintText, setComplaintText] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const recaptchaRef = useRef<number | null>(null);

  useEffect(() => {
    fetchUserComplaints();
  }, [user]);

  useEffect(() => {
    if (showNewComplaint) {
      const loadRecaptcha = () => {
        if (window.grecaptcha && window.grecaptcha.render) {
          if (recaptchaRef.current === null) {
            const recaptchaElement = document.getElementById('recaptcha-container-modal');
            if (recaptchaElement && recaptchaElement.children.length === 0) {
              try {
                recaptchaRef.current = window.grecaptcha.render('recaptcha-container-modal', {
                  sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI',
                  size: 'normal',
                });
              } catch (err) {
                console.error('reCAPTCHA render error:', err);
              }
            }
          }
        }
      };

      if (window.grecaptcha) {
        loadRecaptcha();
      } else {
        const interval = setInterval(() => {
          if (window.grecaptcha) {
            loadRecaptcha();
            clearInterval(interval);
          }
        }, 100);

        return () => clearInterval(interval);
      }
    }
  }, [showNewComplaint]);

  const fetchUserComplaints = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    let recaptchaToken = '';
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    if (siteKey && siteKey !== '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI') {
      try {
        if (window.grecaptcha && recaptchaRef.current !== null) {
          recaptchaToken = window.grecaptcha.getResponse(recaptchaRef.current);
          if (!recaptchaToken) {
            alert('Please complete the reCAPTCHA verification');
            return;
          }
        }
      } catch (err) {
        console.error('reCAPTCHA error:', err);
        alert('reCAPTCHA verification failed. Please refresh and try again.');
        return;
      }
    } else {
      recaptchaToken = 'test-token';
    }

    setIsSubmitting(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-complaint`;
      const session = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complaint_text: complaintText,
          phone_number: phoneNumber || null,
          tracking_id: trackingId || null,
          recaptcha_token: recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to submit');

      setComplaintText('');
      setPhoneNumber('');
      setTrackingId('');
      setShowNewComplaint(false);

      if (window.grecaptcha && recaptchaRef.current !== null) {
        window.grecaptcha.reset(recaptchaRef.current);
      }
      recaptchaRef.current = null;

      fetchUserComplaints();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      if (window.grecaptcha && recaptchaRef.current !== null) {
        window.grecaptcha.reset(recaptchaRef.current);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFeedback = async (complaintId: string, helpful: boolean) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-complaints`;
      const session = await supabase.auth.getSession();

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: complaintId, feedback_helpful: helpful }),
      });

      if (response.ok) {
        fetchUserComplaints();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const getEmojiForSentiment = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return '😊';
      case 'Negative': return '😞';
      case 'Neutral': return '😐';
      default: return '💬';
    }
  };

  const getEmojiForCategory = (category: string) => {
    if (category.includes('Delivery')) return '📦';
    if (category.includes('Lost')) return '🔍';
    if (category.includes('Damage')) return '📮';
    if (category.includes('Delay')) return '⏰';
    return '📬';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-700 border-red-300';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'Low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    const matchesFilter = filter === 'all' || complaint.status.toLowerCase() === filter;
    const matchesSearch = complaint.complaint_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         complaint.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    highPriority: complaints.filter(c => c.priority === 'High').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-amber-50">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  <TranslatedText text="My Complaints" />
                </h1>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <button
                onClick={async () => {
                  await signOut();
                  window.location.href = '/';
                }}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <TranslatedText text="Sign Out" as="span" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <TranslatedText text="Total Complaints" />
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-4 bg-red-100 rounded-xl">
                <BarChart3 className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <TranslatedText text="Pending" />
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.pending}</p>
              </div>
              <div className="p-4 bg-amber-100 rounded-xl">
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <TranslatedText text="Resolved" />
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.resolved}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  <TranslatedText text="High Priority" />
                </p>
                <p className="text-3xl font-bold text-gray-900">{stats.highPriority}</p>
              </div>
              <div className="p-4 bg-red-100 rounded-xl">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <TranslatedText text="All" />
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'pending' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <TranslatedText text="Pending" />
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'resolved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <TranslatedText text="Resolved" />
              </button>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-600 focus:ring-4 focus:ring-red-100 outline-none transition-all"
              />
            </div>

            <button
              onClick={() => setShowNewComplaint(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg font-semibold hover:from-red-700 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <TranslatedText text="New Complaint" />
            </button>
          </div>

          <div className="space-y-4">
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  <TranslatedText text="No complaints found" />
                </p>
                <button
                  onClick={() => setShowNewComplaint(true)}
                  className="mt-4 text-red-600 hover:text-red-700 font-medium"
                >
                  <TranslatedText text="Submit your first complaint" />
                </button>
              </div>
            ) : (
              filteredComplaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="border-2 border-gray-200 rounded-xl p-6 hover:border-red-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedComplaint(complaint)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{getEmojiForCategory(complaint.category)}</span>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">{complaint.category}</h3>
                          <p className="text-sm text-gray-500">{new Date(complaint.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 line-clamp-2">{complaint.complaint_text}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {complaint.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="text-lg">{getEmojiForSentiment(complaint.sentiment)}</span>
                        {complaint.sentiment}
                      </span>
                      {complaint.ai_confidence_score && (
                        <span className="flex items-center gap-1">
                          <Brain className="w-4 h-4" />
                          {complaint.ai_confidence_score}% AI Confidence
                        </span>
                      )}
                    </div>
                    <button className="flex items-center gap-1 text-red-600 hover:text-red-700 font-medium">
                      <TranslatedText text="View Details" />
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showNewComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto transform animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-red-600 to-orange-500 rounded-xl">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  <TranslatedText text="New Complaint" />
                </h2>
              </div>
              <button
                onClick={() => setShowNewComplaint(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmitComplaint} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TranslatedText text="Describe your issue in detail" />
                </label>
                <textarea
                  rows={6}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-100 outline-none transition-all resize-none"
                  placeholder="Please provide detailed information about your complaint..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <TranslatedText text="Phone Number (Optional)" />
                    </div>
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-100 outline-none transition-all"
                    placeholder="Enter your phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      <TranslatedText text="Tracking ID (Optional)" />
                    </div>
                  </label>
                  <input
                    type="text"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-red-600 focus:ring-4 focus:ring-red-100 outline-none transition-all"
                    placeholder="Enter your tracking ID"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <div id="recaptcha-container-modal"></div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewComplaint(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  <TranslatedText text="Cancel" />
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      <TranslatedText text="Processing..." />
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <TranslatedText text="Submit Complaint" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{getEmojiForCategory(selectedComplaint.category)}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedComplaint.category}</h2>
                  <p className="text-sm text-gray-500">Submitted on {new Date(selectedComplaint.created_at).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  <TranslatedText text="Your Complaint" />
                </h3>
                <p className="text-gray-700">{selectedComplaint.complaint_text}</p>
                {(selectedComplaint.phone_number || selectedComplaint.tracking_id) && (
                  <div className="mt-4 pt-4 border-t border-gray-300 space-y-2">
                    {selectedComplaint.phone_number && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-red-600" />
                        <TranslatedText text="Phone" />: {selectedComplaint.phone_number}
                      </p>
                    )}
                    {selectedComplaint.tracking_id && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Package className="w-4 h-4 text-red-600" />
                        <TranslatedText text="Tracking ID" />: {selectedComplaint.tracking_id}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">
                    <TranslatedText text="Status" />
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selectedComplaint.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    <TranslatedText text={selectedComplaint.status} />
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">
                    <TranslatedText text="Priority" />
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(selectedComplaint.priority)}`}>
                    <TranslatedText text={selectedComplaint.priority} />
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-600 mb-1">
                    <TranslatedText text="Sentiment" />
                  </p>
                  <span className="text-lg">{getEmojiForSentiment(selectedComplaint.sentiment)} <TranslatedText text={selectedComplaint.sentiment} /></span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 border-2 border-red-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-red-600" />
                    <TranslatedText text="AI-Generated Response" />
                  </h4>
                  {selectedComplaint.ai_confidence_score && (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                      {selectedComplaint.ai_confidence_score}% <TranslatedText text="Confidence" />
                    </span>
                  )}
                </div>
                <p className="text-gray-800 mb-4">{selectedComplaint.ai_response}</p>

                {selectedComplaint.feedback_helpful === null && (
                  <div className="pt-4 border-t border-red-200">
                    <p className="text-sm text-gray-700 mb-2 font-medium">
                      <TranslatedText text="Was this response helpful?" />
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitFeedback(selectedComplaint.id, true)}
                        className="flex-1 py-2 px-4 bg-white border-2 border-green-200 text-green-700 rounded-lg hover:bg-green-50 font-medium flex items-center justify-center gap-2 transition-all"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <TranslatedText text="Helpful" />
                      </button>
                      <button
                        onClick={() => submitFeedback(selectedComplaint.id, false)}
                        className="flex-1 py-2 px-4 bg-white border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium flex items-center justify-center gap-2 transition-all"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <TranslatedText text="Not Helpful" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <MessageThread complaintId={selectedComplaint.id} isAdmin={false} />
              </div>

              <p className="text-xs text-gray-500 text-center">
                <TranslatedText text="Complaint ID" />: {selectedComplaint.id}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
