import * as Yup from 'yup';
import Expense from '../models/Expense.js';

class ExpenseController {
  async store(request, response) {
    const schema = Yup.object({
      description: Yup.string().required(),
      value: Yup.number().required(),
      date: Yup.date().required(),
    });

    try {
      await schema.validateSync(request.body, { abortEarly: false });
    } catch (err) {
      return response.status(400).json({ error: err.errors });
    }

    const expense = await Expense.create(request.body);
    return response.json(expense);
  }
}

export default new ExpenseController();
