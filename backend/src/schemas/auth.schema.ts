import { z } from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: '无效的邮箱地址' }),
    password: z.string().min(8, { message: '密码至少需要8位' }),
  }),
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>['body'];

export const verifyUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: '无效的邮箱地址' }),
    code: z.string().length(6, { message: '验证码必须是6位' }),
  }),
});

export type VerifyUserInput = z.infer<typeof verifyUserSchema>['body'];

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: '无效的邮箱地址' }),
    password: z.string(),
  }),
});

export type LoginUserInput = z.infer<typeof loginUserSchema>['body'];

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
