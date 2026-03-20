
import { ROLES } from '../lib/roles';
import { Role } from '../types';

interface RoleSelectorProps {
  selected: Role[];
  onChange: (roles: Role[]) => void;
  disabled?: boolean;
}

export default function RoleSelector({ selected, onChange, disabled }: RoleSelectorProps) {
  const handleRoleToggle = (roleKey: Role) => {
    const isSelected = selected.includes(roleKey);

    if (isSelected) {
      // 取消选择，但至少要保留一个角色
      if (selected.length > 1) {
        onChange(selected.filter(key => key !== roleKey));
      }
    } else {
      // 添加选择
      onChange([...selected, roleKey]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {ROLES.map((role) => {
        const isSelected = selected.includes(role.key);

        return (
          <div
            key={role.key}
            onClick={() => !disabled && handleRoleToggle(role.key)}
            className={`
              relative p-4 rounded-lg border-2 transition-all
              ${disabled
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer hover:border-gray-300 hover:shadow-sm'
              }
              ${isSelected
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200'
              }
            `}
          >
            {/* 选中状态指示器 */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}

            {/* 角色内容 */}
            <div className="flex items-start space-x-3">
              {/* Emoji */}
              <div className="text-3xl">{role.emoji}</div>

              {/* 文字内容 */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {role.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {role.description}
                </p>

                {/* 关注维度标签 */}
                <div className="flex flex-wrap gap-1">
                  {role.key === 'user' && [
                    '使用流程', '认知负担', '预期落差', '边界case'
                  ].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {role.key === 'dev' && [
                    '技术可行性', '工期评估', '系统耦合', '性能风险'
                  ].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {role.key === 'boss' && [
                    '商业价值', 'ROI', '机会成本', '市场验证'
                  ].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                  {role.key === 'legal' && [
                    '数据合规', '隐私政策', '法律风险', '授权机制'
                  ].map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 选中状态遮罩 */}
            {isSelected && (
              <div className="absolute inset-0 bg-primary/5 rounded-lg pointer-events-none" />
            )}
          </div>
        );
      })}
    </div>
  );
}