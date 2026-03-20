import { Role, RoleThread } from '../types';
import { User, Code, DollarSign, Shield } from 'lucide-react';

interface RoleCardProps {
  thread: RoleThread;
  onReply: (role: Role) => void;
}

const roleIcons = {
  user: User,
  dev: Code,
  boss: DollarSign,
  legal: Shield,
};

const roleNames = {
  user: '挑剔用户',
  dev: '保守工程师',
  boss: 'ROI 老板',
  legal: '合规律师',
};

const statusColors = {
  challenging: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  generating: 'bg-blue-100 text-blue-800',
  error: 'bg-red-100 text-red-800',
};

export default function RoleCard({ thread, onReply }: RoleCardProps) {
  const Icon = roleIcons[thread.role];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {roleNames[thread.role]}
            </h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[thread.status]}`}>
              {thread.status === 'challenging' && '质疑中'}
              {thread.status === 'partial' && '部分认可'}
              {thread.status === 'approved' && '已通过'}
              {thread.status === 'generating' && '生成中'}
              {thread.status === 'error' && '出错'}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {thread.questions.map((question) => (
          <div key={question.id} className="flex items-start space-x-2">
            <span className="text-primary font-medium">•</span>
            <p className="text-gray-700 text-sm">{question.text}</p>
          </div>
        ))}
      </div>

      {thread.status !== 'generating' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onReply(thread.role)}
            className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-md hover:bg-primary hover:text-white transition-colors"
            disabled={thread.status === 'approved'}
          >
            {thread.status === 'approved' ? '已通过' : '回复辩驳'}
          </button>
        </div>
      )}
    </div>
  );
}