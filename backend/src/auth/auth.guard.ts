import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';

export const SKIP_AUTH = 'skipAuth';

function getSecret(secretName: string, envVar: string, defaultValue = ''): string {
  const secretPath = path.join('/run/secrets', secretName);
  try {
    if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath, 'utf8').trim();
  } catch {}
  return process.env[envVar] || defaultValue;
}

const API_KEY = getSecret('recipe_api_key', 'API_KEY', 'dev-key');

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const key = (req.headers['x-api-key'] as string) || (req.query.key as string);

    if (!key) throw new UnauthorizedException('Unauthorized');

    // Pad to same length before timing-safe compare to avoid length leak
    const provided = Buffer.from(key.padEnd(API_KEY.length, '\0'));
    const expected = Buffer.from(API_KEY.padEnd(key.length, '\0'));
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      throw new UnauthorizedException('Unauthorized');
    }

    return true;
  }
}
