import { z } from 'zod';

/** Kategori hierarkis. `path` disimpan sebagai `/slug-induk/slug-anak`. */
export interface CategoryNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  path: string;
  sortOrder: number;
  questionCount: number;
  children: CategoryNode[];
}

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Nama kategori minimal 2 karakter').max(120),
  parentId: z.string().uuid().nullable().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Gunakan huruf kecil, angka, dan tanda hubung')
    .optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Kirim minimal satu field',
  });
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

export const categoryListQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  includeEmpty: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .default('true'),
});
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;

export interface CategoryDeleteResult {
  deleted: boolean;
  /** True bila kategori hanya diarsipkan karena masih dipakai soal. */
  archived: boolean;
  movedQuestions: number;
}
