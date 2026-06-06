import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthGuard } from './auth/auth.guard';
import { RecipesModule } from './recipes/recipes.module';
import { ImagesModule } from './images/images.module';
import { TagsModule } from './tags/tags.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [DatabaseModule, RecipesModule, ImagesModule, TagsModule, SettingsModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
