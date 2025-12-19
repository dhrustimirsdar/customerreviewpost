import React, { useState, useEffect } from 'react';
import { Send, MessageCircle, User, Shield } from 'lucide-react';

interface Message {
  id: string;
  complaint_id: string;
  message_text: string;
  sender_role: 'user' | 'admin';
  created_at: string;
}

interface MessageThreadProps {
  complaintId: string;
  isAdmin?: boolean;
}

export default function MessageThread({ complaintId, isAdmin = false }: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  useEffect(() => {
    fetchMessages();
  }, [complaintId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/complaint-messages?complaint_id=${complaintId}`,
        {
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        setMessages(result.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await fetch(
        `${supabaseUrl}/functions/v1/complaint-messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            complaint_id: complaintId,
            message_text: newMessage.trim(),
            sender_role: isAdmin ? 'admin' : 'user',
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setMessages([...messages, result.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center">
        <MessageCircle className="w-5 h-5 text-gray-600 mr-2" />
        <h3 className="font-semibold text-gray-900">Support Messages</h3>
        <span className="ml-auto text-sm text-gray-500">{messages.length} messages</span>
      </div>

      <div className="max-h-96 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_role === 'admin' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.sender_role === 'admin'
                    ? 'bg-blue-50 text-blue-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center mb-1">
                  {message.sender_role === 'admin' ? (
                    <Shield className="w-4 h-4 mr-1 text-blue-600" />
                  ) : (
                    <User className="w-4 h-4 mr-1 text-gray-600" />
                  )}
                  <span className="text-xs font-semibold">
                    {message.sender_role === 'admin' ? 'Admin' : 'You'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{message.message_text}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAdmin ? "Reply to user..." : "Ask a follow-up question..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center"
          >
            <Send className="w-4 h-4 mr-2" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
