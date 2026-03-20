import prisma from '../db';
import bcrypt from 'bcrypt';
import { generateTokens } from '../utils/jwt';

export async function verifyUser(email: string, code: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isVerified) {
    throw new Error('User already verified');
  }

  if (user.verifyCode !== code) {
    throw new Error('Invalid verification code');
  }

  if (user.verifyCodeExpiry && user.verifyCodeExpiry < new Date()) {
    throw new Error('Verification code expired');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verifyCode: null,
      verifyCodeExpiry: null,
    },
  });

  const tokens = generateTokens({ userId: user.id });

  // 在实际应用中，refreshToken 也应该被存储起来用于刷新
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
    },
  });

  return tokens;
}

export async function logoutUser(token: string) {
  await prisma.refreshToken.deleteMany({
    where: { token },
  });
}

export async function refreshAccessToken(token: string) {
  const existingToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!existingToken || existingToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired refresh token');
  }

  const { accessToken } = generateTokens({ userId: existingToken.userId });

  return { accessToken };
}


// 生成6位随机数字验证码
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createUser(email: string, password: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const verifyCode = generateVerificationCode();
  const verifyCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10分钟后过期

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      verifyCode,
      verifyCodeExpiry,
    },
  });

  // 模拟发送邮件
  console.log(`-----
  Sending verification email to: ${email}
  Subject: 验证你的 AI 评审模拟器账号
  Body: 你的验证码是 ${verifyCode}。该验证码将在10分钟后失效。
  -----
  `);

  return user;
}

export async function loginUser(email: string, password: string) {
  // 固定账号逻辑
  const FIXED_EMAIL = '3561900938@qq.com';
  const FIXED_PASSWORD = '201314liu';

  let user;

  // 强制忽略大小写和前后空格
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedFixedEmail = FIXED_EMAIL.toLowerCase();

  if (normalizedEmail === normalizedFixedEmail && password === FIXED_PASSWORD) {
    // 检查固定账号是否已在库中，不在则创建
    user = await prisma.user.findUnique({ where: { email: FIXED_EMAIL } });
    if (!user) {
      const passwordHash = await bcrypt.hash(FIXED_PASSWORD, 12);
      user = await prisma.user.create({
        data: {
          email: FIXED_EMAIL,
          passwordHash,
          isVerified: true,
        },
      });
    }
  } else {
    // 原有登录逻辑
    user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new Error('User not verified');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
  }

  const tokens = generateTokens({ userId: user.id });

  // 创建新的 refresh token
  await prisma.refreshToken.create({
    data: {
      token: tokens.refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
    },
  });

  return tokens;
}
