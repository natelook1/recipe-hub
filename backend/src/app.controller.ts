import { Controller, Get } from '@nestjs/common';
import { SkipAuth } from './auth/skip-auth.decorator';

@Controller()
export class AppController {
  @SkipAuth()
  @Get('health')
  health() {
    return { ok: true, ts: Date.now() };
  }
}
