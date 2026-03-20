export interface Role {
  key: string;
  name: string;
  emoji: string;
  description: string;
}

export const ROLES: Role[] = [
  {
    key: 'product_manager',
    name: '产品经理',
    emoji: '💼',
    description: '评估产品需求和市场契合度',
  },
  {
    key: 'software_engineer',
    name: '软件工程师',
    emoji: '💻',
    description: '评估技术可行性和实现方案',
  },
  {
    key: 'qa_engineer',
    name: '测试工程师',
    emoji: '🧪',
    description: '评估可测试性和质量风险',
  },
  {
    key: 'designer',
    name: '设计师',
    emoji: '🎨',
    description: '评估用户界面和交互设计',
  },
];
