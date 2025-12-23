import fs from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import * as Yup from 'yup';
import Category from '../models/Category.js';

class CategoryController {
  async store(request, response) {
    const schema = Yup.object({
      name: Yup.string().required(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { name } = request.body;

    let filenameFinal = '';

    if (request.file) {
      const {
        filename: filenameOriginal,
        path: pathOriginal,
        destination,
      } = request.file;

      const novoNome = `${filenameOriginal.split('.')[0]}.webp`;
      const pathFinal = resolve(destination, novoNome);

      try {
        await sharp(pathOriginal)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(pathFinal);

        fs.unlinkSync(pathOriginal);

        filenameFinal = novoNome;
      } catch (err) {
        console.error('Erro ao otimizar categoria:', err);
        filenameFinal = filenameOriginal;
      }
    }

    const existingCategory = await Category.findOne({
      where: { name },
    });

    if (existingCategory) {
      return response.status(400).json({ error: 'Category already exists' });
    }

    const newCategory = await Category.create({
      name,
      path: filenameFinal,
    });

    return response.status(201).json({ newCategory });
  }

  async update(request, response) {
    const schema = Yup.object({
      name: Yup.string(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { name } = request.body;
    const { id } = request.params;

    let path;

    if (request.file) {
      const {
        filename: filenameOriginal,
        path: pathOriginal,
        destination,
      } = request.file;

      const novoNome = `${filenameOriginal.split('.')[0]}.webp`;
      const pathFinal = resolve(destination, novoNome);

      try {
        await sharp(pathOriginal)
          .resize(800)
          .webp({ quality: 80 })
          .toFile(pathFinal);

        fs.unlinkSync(pathOriginal);
        path = novoNome;
      } catch (err) {
        console.error('Erro ao otimizar categoria no update:', err);
        path = filenameOriginal;
      }
    }
    if (name) {
      const existingCategory = await Category.findOne({
        where: { name },
      });

      if (existingCategory && existingCategory.id !== Number(id)) {
        return response.status(400).json({ error: 'Category already exists' });
      }
    }

    await Category.update(
      {
        name,
        path,
      },
      {
        where: {
          id,
        },
      },
    );

    return response.status(200).json();
  }

  async index(_request, response) {
    const categories = await Category.findAll();

    return response.status(200).json(categories);
  }
}

export default new CategoryController();
