import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { RecipesService } from './recipes.service';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  findAll(
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.recipesService.findAll(q, tag, limit, offset);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recipesService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.recipesService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.recipesService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.recipesService.remove(id);
  }
}
