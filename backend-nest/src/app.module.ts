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
import { GeminiModule } from './gemini/gemini.module';
import { IngestModule } from './ingest/ingest.module';
import { SuggestionsModule } from './suggestions/suggestions.module';

@Module({
  imports: [DatabaseModule, RecipesModule, ImagesModule, TagsModule, SettingsModule, GeminiModule, IngestModule, SuggestionsModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}
