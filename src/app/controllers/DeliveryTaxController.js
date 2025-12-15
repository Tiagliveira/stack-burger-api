import { Op } from 'sequelize';
import * as Yup from 'yup';
import DeliveryTax from './../models/DeliveryTax.js';

class DeliveryTaxController {
  async store(request, response) {
    const schema = Yup.object({
      zip_code_start: Yup.number().required(),
      zip_code_end: Yup.number().required(),
      price: Yup.number().required(),
    });

    try {
      await schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const tax = await DeliveryTax.create(request.body);
    return response.json(tax);
  }

  async calculate(request, response) {
    const schema = Yup.object({
      cep: Yup.string().required().min(8).max(9),
    });

    try {
      await schema.validateSync(request.body);
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const { cep } = request.body;

    const cepNumber = Number(cep.replace(/\D/g, ''));
    try {
      const tax = await DeliveryTax.findOne({
        where: {
          zip_code_start: { [Op.lte]: cepNumber },
          zip_code_end: { [Op.gte]: cepNumber },
        },
      });

      if (!tax) {
        return response.status(400).json({
          error: 'Desculpe ainda não entregamos na região.',
        });
      }

      return response.json({
        price: tax.price,
        message: `A taxa de entrega é R${tax.price.toFixed(2)}`,
      });
    } catch (_err) {
      return response.status(500).json({ error: 'Erro ao caucular frete.' });
    }
  }
  async index(_request, response) {
    const taxes = await DeliveryTax.findAll();
    return response.json(taxes);
  }
}

export default new DeliveryTaxController();
