import { Controller, Post, Body, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { IngestService } from './ingest.service';

@Controller('ingest')
export class IngestController {
  constructor(private readonly ingestService: IngestService) {}

  @Post('url')
  fromUrl(@Body() body: any) {
    return this.ingestService.fromUrl(body.url, body.preferredUnit);
  }

  @Post('text')
  fromText(@Body() body: any) {
    return this.ingestService.fromText(body.text, body.preferredUnit);
  }

  @Post('photo')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
  }))
  fromPhoto(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    return this.ingestService.fromPhoto(file, body.preferredUnit);
  }

  @Post('confirm')
  confirm(@Body() body: any) {
    return this.ingestService.confirm(body);
  }
}
