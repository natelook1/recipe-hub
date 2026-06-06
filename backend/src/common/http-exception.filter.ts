import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'object') {
        response.status(status).json(body);
      } else {
        response.status(status).json({ error: body, statusCode: status });
      }
      return;
    }

    console.error('[Unhandled]', exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'Internal server error',
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}
