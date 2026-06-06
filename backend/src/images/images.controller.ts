import { Controller, Get, Post, Param, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import * as multer from 'multer';
import { ImagesService } from './images.service';

@Controller('recipes')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(':id/image')
  getImage(@Param('id') id: string, @Res() res: Response) {
    const fullPath = this.imagesService.getImagePath(id);
    res.sendFile(fullPath);
  }

  @Post(':id/image')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
  }))
  uploadImage(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    return this.imagesService.saveImage(id, file);
  }
}
