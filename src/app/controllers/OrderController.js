import { Op } from 'sequelize';
import * as Yup from 'yup';
import Category from '../models/Category.js';
import DeliveryTax from './../models/DeliveryTax.js';
import Product from '../models/Product.js';
import Order from '../schemas/Order.js';

const statusFlow = {
  CREATED: ['PREPARING', 'CANCELED'],
  PREPARING: ['READY', 'CANCELED'],
  READY: ['DELIVERING', 'CANCELED'],
  DELIVERING: ['DELIVERED'],
  DELIVERED: [],
  CANCELED: [],
};

class OrderController {
  async store(request, response) {
    const schema = Yup.object({
      observation: Yup.string(),
      paymentMethod: Yup.string().required(),
      orderType: Yup.string().oneOf(['delivery', 'takeout']).required(),

      paymentId: Yup.string().when('paymentMethod', (paymentMethod, schema) => {
        return paymentMethod === 'card' ? schema.required() : schema;
      }),

      products: Yup.array()
        .required()
        .of(
          Yup.object({
            id: Yup.number().required(),
            quantity: Yup.number().required(),
            observation: Yup.string(),
          }),
        ),

      address: Yup.object()
        .shape({
          cep: Yup.string().required(),
          street: Yup.string().required(),
          number: Yup.string().required(),
          neighborhood: Yup.string().required(),
          city: Yup.string().required(),
          complement: Yup.string(),
        })
        .required(),
    });

    try {
      await schema.validateSync(request.body, {
        abortEarly: false,
        strict: true,
      });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { userId, userName } = request;
    const {
      products,
      observation: orderObservation,
      paymentId,
      paymentMethod,
      orderType,
      address,
    } = request.body;

    let deliveryFee = 0;

    if (orderType === 'delivery') {
      const cepNumber = address.cep.replace(/\D/g, '');

      const taxRule = await DeliveryTax.findOne({
        where: {
          zip_code_start: { [Op.lte]: cepNumber },
          zip_code_end: { [Op.gte]: cepNumber },
        },
      });

      if (!taxRule) {
        return response.status(400).json({
          error: 'Ops! Esse endereço está fora da nossa área de Entrega.',
        });
      }

      deliveryFee = taxRule.price;
    }

    const productId = products.map((product) => product.id);

    const findeProducts = await Product.findAll({
      where: {
        id: productId,
      },
      include: {
        model: Category,
        as: 'category',
        attributes: ['name'],
      },
    });

    const mapedProducts = findeProducts.map((product) => {
      const quantity = products.find((p) => p.id === product.id).quantity;
      const observation = products.find((p) => p.id === product.id).observation;

      const newProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        url: product.url,
        category: product.category.name,
        quantity,
        observation,
      };

      return newProduct;
    });

    const totalProducts = mapedProducts.reduce((acc, product) => {
      return acc + product.price * product.quantity;
    }, 0);

    const totalOrder = totalProducts + (deliveryFee || 0);

    const order = {
      user: {
        id: userId,
        name: userName,
      },
      products: mapedProducts,
      status: 'CREATED',
      observation: orderObservation,
      paymentId,
      paymentMethod,
      orderType,
      address,
      deliveryFee,

      total: totalOrder,
    };

    const newOrder = await Order.create(order);

    request.io.emit('new_order', newOrder);

    return response.status(201).json(newOrder);
  }

  async update(request, response) {
    const schema = Yup.object({
      status: Yup.string().required(),
    });

    try {
      schema.validateSync(request.body, { abortEarly: false, strict: true });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { status } = request.body;
    const { id } = request.params;

    try {
      const order = await Order.findById(id);

      if (!order) {
        return response.status(404).json({ error: 'Pedido não Encontrado' });
      }

      const allowedStatus = statusFlow[order.status];

      if (!allowedStatus || !allowedStatus.includes(status)) {
        return response.status(400).json({ error: `Status inválido` });
      }

      if (status === 'DELIVERED' && order.status !== 'DELIVERED') {
        for (const productData of order.products) {
          await Product.increment('sold_count', {
            by: productData.quantity,
            where: { id: productData.id },
          });
        }
      }

      await Order.updateOne({ _id: id }, { status });

      request.io.to(id).emit('status_update', {
        orderId: id,
        newStatus: status,
      });
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }

    return response.status(200).json({ message: 'status update successfully' });
  }

  async index(_request, response) {
    const orders = await Order.find();
    return response.status(200).json(orders);
  }

  async show(request, response) {
    try {
      const orders = await Order.find({ 'user.id': request.userId });
      return response.json(orders);
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  async cancel(request, response) {
    const { id } = request.params;
    const { userId } = request;

    try {
      const order = await Order.findOne({ _id: id, 'user.id': userId });
      if (!order) {
        return response.status(404).json({ error: 'Pedido não encontrado' });
      }

      const uncancelableStatus = [
        'READY',
        'DELIVERING',
        'DELIVERED',
        'CANCELED',
      ];

      if (uncancelableStatus.includes(order.status)) {
        return response.status(400).json({
          error:
            'Pedido já está em andamento ou Finalizado e não pode ser cancelado.',
        });
      }

      const timeNow = new Date();
      const timeOrder = new Date(order.createdAt);
      const diffInMinutes = (timeNow - timeOrder) / 1000 / 60;

      if (diffInMinutes > 30) {
        return response
          .status(400)
          .json({ error: 'Tempo limite de cancelamento (30 min) expirado' });
      }

      await Order.updateOne({ _id: id }, { status: 'CANCELED' });

      return response.json({ message: 'Pedido Cancelado com sucesso.' });
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  async addMessage(request, response) {
    const schema = Yup.object({
      text: Yup.string().required(),
    });

    try {
      await schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { id } = request.params;
    const { text } = request.body;
    const { userName } = request;

    try {
      const order = await Order.findById(id);

      if (!order) {
        return response.status(400).json({ error: 'Pedido não encontrado' });
      }

      const newMessage = {
        userName,
        text,
        createdAt: new Date(),
      };

      order.messages.push(newMessage);
      await order.save();

      request.io.emit('new_order_message', {
        orderId: id,
        message: newMessage,
      });

      return response.json({
        message: 'Mensagem enviada',
        chat: order.messages,
      });
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }

  async rateOrder(request, response) {
    const { id } = request.params;
    const { stars } = request.body;

    if (stars < 1 || stars > 5) {
      return response
        .status(400)
        .json({ error: 'A nota deve ser entre 1 e 5' });
    }

    try {
      const order = await Order.findById(id);

      if (!order) {
        return response.status(400).json({ error: 'Pedido não encontrado' });
      }

      if (order.isRated) {
        return response
          .status(400)
          .json({ error: 'Este pedido já foi avaliado.' });
      }

      const updatePromises = order.products.map(async (item) => {
        const product = await Product.findByPk(item.id);

        if (product) {
          const currentCount = product.rating_count || 0;
          const currentAvg = product.rating_average || 0;

          const newCount = currentCount + 1;
          const newAvg = (currentAvg * currentCount + stars) / newCount;

          product.rating_count = newCount;
          product.rating_average = newAvg;

          await product.save();
        }
      });

      await Promise.all(updatePromises);
      order.isRated = true;
      await order.save();

      return response
        .status(200)
        .json({ message: 'Avaliação enviada com sucesso!' });
    } catch (err) {
      return response.status(400).json({ error: err.message });
    }
  }
}

export default new OrderController();
