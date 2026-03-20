import { FastifyRequest, FastifyReply } from 'fastify';
import { createUser, verifyUser, loginUser, refreshAccessToken, logoutUser } from '../services/auth.service';
import { RegisterUserInput, VerifyUserInput, LoginUserInput, RefreshTokenInput } from '../schemas/auth.schema';

export async function registerUserHandler(
  request: FastifyRequest<{ Body: RegisterUserInput }>,
  reply: FastifyReply
) {
  try {
    await createUser(request.body.email, request.body.password);
    return reply.code(201).send({ message: '验证码已发送至邮箱' });
  } catch (error) {
    if (error instanceof Error && error.message === 'Email already registered') {
      return reply.code(409).send({ message: '该邮箱已被注册' });
    }
    // 对于其他错误，记录并返回通用错误信息
    request.log.error(error, 'Error in registerUserHandler');
    return reply.code(500).send({ message: '服务器内部错误' });
  }
}

export async function logoutUserHandler(
  request: FastifyRequest<{ Body: RefreshTokenInput }>,
  reply: FastifyReply
) {
  try {
    await logoutUser(request.body.refreshToken);
    return reply.code(204).send();
  } catch (error) {
    request.log.error(error, 'Error in logoutUserHandler');
    return reply.code(500).send({ message: '服务器内部错误' });
  }
}

export async function verifyUserHandler(
  request: FastifyRequest<{ Body: VerifyUserInput }>,
  reply: FastifyReply
) {
  try {
    const tokens = await verifyUser(request.body.email, request.body.code);
    return reply.code(200).send(tokens);
  } catch (error) {
    if (error instanceof Error) {
      switch (error.message) {
        case 'User not found':
          return reply.code(404).send({ message: '用户不存在' });
        case 'User already verified':
          return reply.code(409).send({ message: '用户已经验证' });
        case 'Invalid verification code':
          return reply.code(400).send({ message: '无效的验证码' });
        case 'Verification code expired':
          return reply.code(400).send({ message: '验证码已过期' });
        default:
          break;
      }
    }
    request.log.error(error, 'Error in verifyUserHandler');
    return reply.code(500).send({ message: '服务器内部错误' });
  }
}

export async function loginUserHandler(
  request: FastifyRequest<{ Body: LoginUserInput }>,
  reply: FastifyReply
) {
  console.log('[loginUserHandler] Attempting login for:', request.body.email);
  try {
    const tokens = await loginUser(request.body.email, request.body.password);
    console.log('[loginUserHandler] Login successful for:', request.body.email);
    return reply.code(200).send(tokens);
  } catch (error) {
    console.error('[loginUserHandler] Login failed for:', request.body.email, error);
    if (error instanceof Error) {
      switch (error.message) {
        case 'Invalid credentials':
          return reply.code(401).send({ message: '邮箱或密码不正确' });
        case 'User not verified':
          return reply.code(403).send({ message: '用户未验证，请先验证邮箱' });
        default:
          break;
      }
    }
    request.log.error(error, 'Error in loginUserHandler');
    return reply.code(500).send({ message: '服务器内部错误' });
  }
}

export async function refreshAccessTokenHandler(
  request: FastifyRequest<{ Body: RefreshTokenInput }>,
  reply: FastifyReply
) {
  try {
    const { accessToken } = await refreshAccessToken(request.body.refreshToken);
    return reply.code(200).send({ accessToken });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid or expired refresh token') {
      return reply.code(401).send({ message: '无效或已过期的刷新令牌' });
    }
    request.log.error(error, 'Error in refreshAccessTokenHandler');
    return reply.code(500).send({ message: '服务器内部错误' });
  }
}
