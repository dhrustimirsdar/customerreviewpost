import React from 'react';
import { BarChart3, TrendingUp, AlertCircle, ThumbsUp } from 'lucide-react';

interface Complaint {
  id: string;
  category: string;
  priority: string;
  sentiment: string;
  feedback_helpful: boolean | null;
  created_at: string;
}

interface AnalyticsProps {
  complaints: Complaint[];
}

export default function Analytics({ complaints }: AnalyticsProps) {
  const categoryCount = complaints.reduce((acc, c) => {
    acc[c.category] = (acc[c.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const priorityCount = complaints.reduce((acc, c) => {
    acc[c.priority] = (acc[c.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sentimentCount = complaints.reduce((acc, c) => {
    acc[c.sentiment] = (acc[c.sentiment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const feedbackStats = complaints.reduce(
    (acc, c) => {
      if (c.feedback_helpful === true) acc.helpful++;
      if (c.feedback_helpful === false) acc.notHelpful++;
      if (c.feedback_helpful !== null) acc.total++;
      return acc;
    },
    { helpful: 0, notHelpful: 0, total: 0 }
  );

  const helpfulnessPercentage = feedbackStats.total > 0
    ? Math.round((feedbackStats.helpful / feedbackStats.total) * 100)
    : 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const complaintsOverTime = last7Days.map(date => {
    const count = complaints.filter(c => c.created_at.startsWith(date)).length;
    return { date, count };
  });

  const maxCount = Math.max(...complaintsOverTime.map(d => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-4">
        <BarChart3 className="w-6 h-6 text-blue-600 mr-2" />
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">AI Helpfulness</p>
              <p className="text-3xl font-bold text-gray-900">{helpfulnessPercentage}%</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ThumbsUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {feedbackStats.helpful} helpful / {feedbackStats.total} rated
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">High Priority</p>
              <p className="text-3xl font-bold text-red-600">{priorityCount['High'] || 0}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Negative Sentiment</p>
              <p className="text-3xl font-bold text-orange-600">{sentimentCount['Negative'] || 0}</p>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Category</h3>
          <div className="space-y-3">
            {Object.entries(categoryCount)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <div key={category}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{category}</span>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(count / complaints.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Priority</h3>
          <div className="space-y-3">
            {Object.entries(priorityCount)
              .sort(([, a], [, b]) => b - a)
              .map(([priority, count]) => {
                const color = priority === 'High' ? 'red' : priority === 'Medium' ? 'yellow' : 'green';
                return (
                  <div key={priority}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700">{priority}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-${color}-600 h-2 rounded-full transition-all`}
                        style={{ width: `${(count / complaints.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints Over Last 7 Days</h3>
        <div className="flex items-end justify-between h-48 space-x-2">
          {complaintsOverTime.map(({ date, count }) => (
            <div key={date} className="flex-1 flex flex-col items-center">
              <div className="w-full flex items-end justify-center h-40">
                <div
                  className="w-full bg-blue-600 rounded-t-lg transition-all hover:bg-blue-700"
                  style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '8px' : '0' }}
                  title={`${count} complaints`}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-600 text-center">
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs font-semibold text-gray-900">{count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
