import * as Yup from 'yup';
import Category from '../models/Category.js';
import Product from './../models/Product.js';

class ProductController {
  async store(request, response) {
    const schema = Yup.object({
      name: Yup.string().required(),
      price: Yup.number().required(),
      category_id: Yup.number().required(),
      offer: Yup.boolean(),
      description: Yup.string().required(),
      available: Yup.boolean(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { name, price, category_id, offer, description, available } =
      request.body;
    const { filename } = request.file;

    const newProduct = await Product.create({
      name,
      price,
      category_id,
      path: filename,
      offer,
      description,
      available,
    });

    return response.status(201).json({ newProduct });
  }

  async update(request, response) {
    const schema = Yup.object({
      name: Yup.string(),
      price: Yup.number(),
      category_id: Yup.number(),
      offer: Yup.boolean(),
      description: Yup.string(),
      available: Yup.boolean(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { name, price, category_id, offer, description, available } =
      request.body;
    const { id } = request.params;

    let path;
    if (request.file) {
      const { filename } = request.file;
      path = filename;
    }

    await Product.update(
      {
        name,
        price,
        category_id,
        path,
        offer,
        description,
        available,
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
    const products = await Product.findAll({
      where: { available: true },
      include: {
        model: Category,
        as: 'category',
        attributes: ['id', 'name'],
      },
    });

    return response.status(200).json(products);
  }

  async delete(request, response) {
    const { id } = request.params;

    const product = await Product.findByPk(id);
    if (!product) {
      return response.status(404).json({ error: 'Product not found' });
    }

    await product.update({ available: false });

    return response
      .status(200)
      .json({ message: 'Produto desativado com sucesso!' });
  }

  async rate(request, response) {
    const schema = Yup.object({
      stars: Yup.number().min(1).max(5).required(),
    });

    try {
      await schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { id } = request.params;
    const { stars } = request.body;

    try {
      const product = await Product.findByPk(id);

      if (!product) {
        return response.status(400).json({ error: 'Produto não encontardo' });
      }

      const newCount = currentCount + 1;
      const newAvg = (currentAvg * currentCount + stars) / newCount;

      product.rating_count = newCount;
      product.rating_average = newAvg;

      await product.save();
      return response.json(product);
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }
}

export default new ProductController();
