import { Router, type NextFunction, type Request, type Response } from 'express';
import type { CategoryRepository } from '../repositories/CategoryRepository';
import type { NodeCategoryProps } from '../db/types';

export type CategoryRepositoryContract = Pick<
  CategoryRepository,
  | 'listCategories'
  | 'createCategory'
  | 'getCategoryById'
  | 'getCategoryByName'
  | 'updateCategory'
  | 'deleteCategory'
>;

export const createCategoryRouter = (categoryRepo: CategoryRepositoryContract): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    const { parentId } = req.query;
    let filter: string | null | undefined = undefined;
    if (parentId !== undefined) {
      if (parentId === null || parentId === '' || parentId === 'null') {
        filter = null;
      } else {
        filter = String(parentId);
      }
    }

    try {
      const categories = await categoryRepo.listCategories(filter);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const { name, parentId, props } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    if (props !== undefined && (typeof props !== 'object' || props === null || Array.isArray(props))) {
      res.status(400).json({ error: 'props must be an object if provided' });
      return;
    }

    const normalizedParent = parentId === undefined || parentId === null || parentId === '' ? null : String(parentId);
    const sanitizedProps = props as NodeCategoryProps | undefined;

    try {
      const category = await categoryRepo.createCategory({
        name: name.trim(),
        parentId: normalizedParent,
        props: sanitizedProps,
      });
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  router.get('/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const nameParam = req.query.name;
    const hasNameFilter = typeof nameParam === 'string' && nameParam.trim().length > 0;

    try {
      const category = hasNameFilter
        ? await categoryRepo.getCategoryByName(nameParam.trim())
        : await categoryRepo.getCategoryById(categoryId);

      if (!category) {
        res.status(404).json({ error: 'Node category not found' });
        return;
      }
      res.json(category);
    } catch (error) {
      next(error);
    }
  });

  router.patch('/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    const patch: Record<string, unknown> = req.body ?? {};
    const update: { name?: string; props?: NodeCategoryProps; parentId?: string | null } = {};

    if (typeof patch.name === 'string') {
      const trimmed = patch.name.trim();
      if (!trimmed) {
        res.status(400).json({ error: 'name cannot be empty' });
        return;
      }
      update.name = trimmed;
    }
    if (patch.props !== undefined) {
      if (typeof patch.props !== 'object' || patch.props === null || Array.isArray(patch.props)) {
        res.status(400).json({ error: 'props must be an object if provided' });
        return;
      }
      update.props = patch.props as NodeCategoryProps;
    }
    if (patch.parentId !== undefined) {
      update.parentId = patch.parentId === null || patch.parentId === '' ? null : String(patch.parentId);
    }

    if (!Object.keys(update).length) {
      res.status(400).json({ error: 'No valid fields to update' });
      return;
    }

    try {
      const updated = await categoryRepo.updateCategory(categoryId, update);
      if (!updated) {
        res.status(404).json({ error: 'Node category not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.params;
    try {
      await categoryRepo.deleteCategory(categoryId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
