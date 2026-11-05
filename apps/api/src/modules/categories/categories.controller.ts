import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  categoryCreateSchema,
  categoryListQuerySchema,
  categoryUpdateSchema,
  type CategoryCreateInput,
  type CategoryDeleteResult,
  type CategoryListQuery,
  type CategoryNode,
  type CategoryUpdateInput,
} from '@webcat/contracts';
import type { AuthPrincipal } from '../../core/auth/auth.types';
import { AuthUser } from '../../core/auth/decorators/current-user.decorator';
import { RequirePermissions } from '../../core/auth/decorators/permissions.decorator';
import { EmailVerifiedGuard } from '../../core/auth/email-verified.guard';
import { JwtAuthGuard } from '../../core/auth/jwt-auth.guard';
import { PermissionsGuard } from '../../core/auth/permissions.guard';
import { zodPipe } from '../../core/http/validation.pipe';
import { CategoriesService } from './categories.service';

@ApiTags('Admin — Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, EmailVerifiedGuard, PermissionsGuard)
@Controller('admin/categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  private actor(user: AuthPrincipal, req: Request) {
    return { id: user.id, ip: req.ip ?? null, userAgent: req.headers['user-agent'] ?? null };
  }

  @RequirePermissions('questions.read')
  @Get()
  @ApiOperation({ summary: 'Daftar kategori dan subtes bank soal' })
  list(@Query(zodPipe(categoryListQuerySchema)) query: CategoryListQuery): Promise<CategoryNode[]> {
    return this.categories.list(query);
  }

  @RequirePermissions('questions.write')
  @Post()
  @ApiOperation({ summary: 'Buat kategori baru' })
  create(
    @Body(zodPipe(categoryCreateSchema)) body: CategoryCreateInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<CategoryNode> {
    return this.categories.create(body, this.actor(user, req));
  }

  @RequirePermissions('questions.write')
  @Patch(':id')
  @ApiOperation({ summary: 'Ubah kategori' })
  update(
    @Param('id') id: string,
    @Body(zodPipe(categoryUpdateSchema)) body: CategoryUpdateInput,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<CategoryNode> {
    return this.categories.update(id, body, this.actor(user, req));
  }

  @RequirePermissions('questions.write')
  @Delete(':id')
  @ApiOperation({ summary: 'Hapus kategori (soft delete)' })
  remove(
    @Param('id') id: string,
    @AuthUser() user: AuthPrincipal,
    @Req() req: Request,
  ): Promise<CategoryDeleteResult> {
    return this.categories.remove(id, this.actor(user, req));
  }
}
