import { useState } from 'react';
import { RotateCcw, Play } from 'lucide-react';

interface IterateSectionProps {
  onReReview: (iterationText: string) => void;
  isReviewing?: boolean;
}

export default function IterateSection({ onReReview, isReviewing }: IterateSectionProps) {
  const [iterationText, setIterationText] = useState('');

  const handleSubmit = () => {
    if (!iterationText.trim()) return;
    onReReview(iterationText);
    setIterationText('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 animate-fadeUp">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">迭代优化</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            修改方案描述
          </label>
          <textarea
            value={iterationText}
            onChange={(e) => setIterationText(e.target.value)}
            placeholder="修改方案后在此描述改动，或直接粘贴新版本"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            rows={4}
            disabled={isReviewing}
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setIterationText('')}
            disabled={!iterationText.trim() || isReviewing}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>清空</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={!iterationText.trim() || isReviewing}
            className="flex items-center space-x-2 px-4 py-2 bg-secondary hover:bg-secondary-dark disabled:bg-gray-300 text-white rounded-md transition-colors"
          >
            {isReviewing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>评审中...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>再次评审</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}