import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  type CategoryCreateInput,
  type CategoryDeleteResult,
  type CategoryListQuery,
  type CategoryNode,
  type CategoryUpdateInput,
} from '@webcat/contracts';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../core/prisma/prisma.service';

interface Actor {
  id: string;
  ip?: string | null;
  userAgent?: string | null;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

@Injectable()
export class CategoriesService {
  private listCache: { key: string; data: CategoryNode[]; expiresAt: number } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(query: CategoryListQuery): Promise<CategoryNode[]> {
    const cacheKey = query.includeEmpty ? 'all' : 'non-empty';
    if (this.listCache && this.listCache.key === cacheKey && this.listCache.expiresAt > Date.now()) {
      return this.listCache.data;
    }
    const [categories, counts] = await Promise.all([
      this.prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.question.groupBy({
        by: ['categoryId'],
        where: { categoryId: { not: null }, deletedAt: null },
        _count: { _all: true },
      }),
    ]);

    const countMap = new Map(
      counts
        .filter((row): row is typeof row & { categoryId: string } => row.categoryId !== null)
        .map((row) => [row.categoryId, row._count._all]),
    );

    const nodes = new Map<string, CategoryNode>(
      categories.map((category) => [
        category.id,
        {
          id: category.id,
          parentId: category.parentId,
          name: category.name,
          slug: category.slug,
          path: category.path,
          sortOrder: category.sortOrder,
          questionCount: countMap.get(category.id) ?? 0,
          children: [],
        },
      ]),
    );

    let visible = new Set(nodes.keys());
    if (query.q) {
      const needle = query.q.toLowerCase();
      visible = new Set<string>();
      for (const node of nodes.values()) {
        if (!node.name.toLowerCase().includes(needle) && !node.path.includes(needle)) continue;
        let cursor: CategoryNode | undefined = node;
        while (cursor) {
          visible.add(cursor.id);
          cursor = cursor.parentId ? nodes.get(cursor.parentId) : undefined;
        }
      }
    }

    const roots: CategoryNode[] = [];
    for (const node of nodes.values()) {
      if (!visible.has(node.id)) continue;
      if (!query.includeEmpty && node.questionCount === 0 && node.children.length === 0) continue;
      if (node.parentId && visible.has(node.parentId)) {
        nodes.get(node.parentId)?.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNodes = (list: CategoryNode[]) => {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      for (const node of list) sortNodes(node.children);
    };
    sortNodes(roots);
    this.listCache = { key: cacheKey, data: roots, expiresAt: Date.now() + 30000 };
    return roots;
  }

  async create(input: CategoryCreateInput, actor: Actor): Promise<CategoryNode> {
    this.listCache = null;
    const slug = input.slug ?? slugify(input.name);
    if (!slug) {
      throw new ConflictException({
        code: 'COMMON_VALIDATION_FAILED',
        message: 'Nama kategori tidak dapat dijadikan slug',
      });
    }

    const parent = input.parentId ? await this.requireById(input.parentId) : null;
    const path = parent ? `${parent.path}/${slug}` : slug;

    try {
      const category = await this.prisma.category.create({
        data: {
          name: input.name,
          slug,
          path,
          parentId: parent?.id ?? null,
          sortOrder: input.sortOrder,
        },
      });

      await this.audit.record({
        actorUserId: actor.id,
        action: 'category.created',
        entityType: 'category',
        entityId: category.id,
        metadata: { name: category.name, path: category.path },
        ip: actor.ip ?? null,
        userAgent: actor.userAgent ?? null,
      });

      return {
        id: category.id,
        parentId: category.parentId,
        name: category.name,
        slug: category.slug,
        path: category.path,
        sortOrder: category.sortOrder,
        questionCount: 0,
        children: [],
      };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({
          code: 'COMMON_CONFLICT',
          message: 'Kategori dengan slug yang sama sudah ada di induk ini',
        });
      }
      throw error;
    }
  }

  async update(id: string, input: CategoryUpdateInput, actor: Actor): Promise<CategoryNode> {
    this.listCache = null;
    const current = await this.requireById(id);
    const parent =
      input.parentId === undefined
        ? current.parentId
          ? await this.requireById(current.parentId)
          : null
        : input.parentId
          ? await this.requireById(input.parentId)
          : null;

    if (parent?.id === id) {
      throw new ConflictException({
        code: 'COMMON_CONFLICT',
        message: 'Kategori tidak boleh menjadi induk dirinya sendiri',
      });
    }
    if (parent && (parent.path === current.path || parent.path.startsWith(`${current.path}/`))) {
      throw new ConflictException({
        code: 'COMMON_CONFLICT',
        message: 'Kategori tidak boleh dipindahkan ke bawah turunannya',
      });
    }

    const slug = input.slug ?? current.slug;
    const path = parent ? `${parent.path}/${slug}` : slug;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.category.update({
        where: { id },
        data: {
          name: input.name ?? current.name,
          slug,
          path,
          parentId: parent?.id ?? null,
          sortOrder: input.sortOrder ?? current.sortOrder,
        },
      });

      if (path !== current.path) {
        const descendants = await tx.category.findMany({
          where: { path: { startsWith: `${current.path}/` } },
          select: { id: true, path: true },
        });
        for (const descendant of descendants) {
          await tx.category.update({
            where: { id: descendant.id },
            data: { path: descendant.path.replace(current.path, path) },
          });
        }
      }

      return row;
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'category.updated',
      entityType: 'category',
      entityId: id,
      metadata: { before: current.path, after: updated.path },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    const count = await this.prisma.question.count({ where: { categoryId: id, deletedAt: null } });
    return {
      id: updated.id,
      parentId: updated.parentId,
      name: updated.name,
      slug: updated.slug,
      path: updated.path,
      sortOrder: updated.sortOrder,
      questionCount: count,
      children: [],
    };
  }

  async remove(id: string, actor: Actor): Promise<CategoryDeleteResult> {
    this.listCache = null;
    const current = await this.requireById(id);
    const children = await this.prisma.category.count({ where: { parentId: id } });
    if (children > 0) {
      throw new ConflictException({
        code: 'COMMON_CONFLICT',
        message: 'Pindahkan atau hapus subkategori terlebih dahulu',
      });
    }

    const moved = await this.prisma.$transaction(async (tx) => {
      const result = await tx.question.updateMany({
        where: { categoryId: id },
        data: { categoryId: null },
      });
      await tx.category.delete({ where: { id } });
      return result.count;
    });

    await this.audit.record({
      actorUserId: actor.id,
      action: 'category.deleted',
      entityType: 'category',
      entityId: id,
      metadata: { path: current.path, movedQuestions: moved },
      ip: actor.ip ?? null,
      userAgent: actor.userAgent ?? null,
    });

    return { deleted: true, archived: false, movedQuestions: moved };
  }

  private async requireById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException({
        code: 'COMMON_NOT_FOUND',
        message: 'Kategori tidak ditemukan',
      });
    }
    return category;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Prisma.PrismaClientKnownRequestError).code === 'P2002'
  );
}
