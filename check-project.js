const fs = require('fs');
const path = require('path');

console.log('=== 项目状态检查 ===\n');

// 检查当前目录
console.log('1. 当前目录:', process.cwd());

// 检查Node.js版本
console.log('\n2. Node.js版本:', process.version);

// 检查项目结构
console.log('\n3. 项目结构检查:');
const requiredDirs = ['backend', 'feature-review-simulator'];
const requiredFiles = [
  'backend/package.json',
  'feature-review-simulator/package.json',
  'backend/prisma/schema.prisma'
];

requiredDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`   ✓ ${dir} 目录存在`);
  } else {
    console.log(`   ✗ ${dir} 目录不存在`);
  }
});

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file} 存在`);
  } else {
    console.log(`   ✗ ${file} 不存在`);
  }
});

// 检查依赖
console.log('\n4. 依赖检查:');
const backendModules = 'backend/node_modules';
const frontendModules = 'feature-review-simulator/node_modules';

if (fs.existsSync(backendModules)) {
  console.log('   ✓ 后端依赖已安装');
} else {
  console.log('   ✗ 后端依赖未安装');
}

if (fs.existsSync(frontendModules)) {
  console.log('   ✓ 前端依赖已安装');
} else {
  console.log('   ✗ 前端依赖未安装');
}

// 检查package.json内容
console.log('\n5. Package.json检查:');
try {
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const frontendPkg = JSON.parse(fs.readFileSync('feature-review-simulator/package.json', 'utf8'));

  console.log('   后端脚本:', Object.keys(backendPkg.scripts || {}));
  console.log('   前端脚本:', Object.keys(frontendPkg.scripts || {}));
} catch (e) {
  console.log('   ✗ 读取package.json失败:', e.message);
}

// 提供建议
console.log('\n=== 建议操作 ===');
if (!fs.existsSync(backendModules)) {
  console.log('\n- 安装后端依赖:');
  console.log('  cd backend && npm install');
}

if (!fs.existsSync(frontendModules)) {
  console.log('\n- 安装前端依赖:');
  console.log('  cd feature-review-simulator && npm install');
}

console.log('\n- 启动后端:');
console.log('  cd backend && npm run dev');

console.log('\n- 启动前端:');
console.log('  cd feature-review-simulator && npm run dev');

console.log('\n- 访问地址:');
console.log('  http://localhost:5173');