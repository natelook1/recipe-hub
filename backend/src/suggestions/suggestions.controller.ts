import { Controller, Get, Post, Body } from '@nestjs/common';
import { SuggestionsService } from './suggestions.service';

@Controller('suggestions')
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get()
  getSuggestions() {
    return this.suggestionsService.getSuggestions();
  }

  @Post('extract')
  extract(@Body() body: any) {
    return this.suggestionsService.extract(body.url);
  }

  @Post('save')
  save(@Body() body: any) {
    return this.suggestionsService.save(body);
  }
}
