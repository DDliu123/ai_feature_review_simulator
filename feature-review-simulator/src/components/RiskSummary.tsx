import { AlertTriangle } from 'lucide-react';

interface RiskSummaryProps {
  summary: string;
}

export default function RiskSummary({ summary }: RiskSummaryProps) {
  const risks = summary
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.replace(/^-\s*/, '').trim());

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 animate-fadeUp">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-orange-900">核心风险汇总</h3>
      </div>

      <div className="space-y-3">
        {risks.map((risk, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
            <p className="text-orange-800 text-sm leading-relaxed">
              {risk}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-orange-600 mt-4">
        以上风险由 AI 从多角色反馈中提炼总结
      </p>
    </div>
  );
}