import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import { Op } from 'sequelize';
import Expense from '../models/Expense.js';
import Order from '../schemas/Order.js';

class DashboardController {
  async index(request, response) {
    const { startDate, endDate } = request.query;

    let filter = {};
    let postgresFilter = {};

    if (
      startDate &&
      endDate &&
      isValid(parseISO(startDate)) &&
      isValid(parseISO(endDate))
    ) {
      filter = {
        createdAt: {
          $gte: startOfDay(parseISO(startDate)),
          $lte: endOfDay(parseISO(endDate)),
        },
      };
      postgresFilter = {
        date: {
          [Op.between]: [
            startOfDay(parseISO(startDate)),
            endOfDay(parseISO(endDate)),
          ],
        },
      };
    } else {
      const today = new Date();
      filter = {
        createdAt: {
          $gte: startOfDay(today),
          $lte: endOfDay(today),
        },
      };
      postgresFilter = {
        date: {
          [Op.between]: [startOfDay(today), endOfDay(today)],
        },
      };
    }

    const orders = await Order.find(filter);
    const expenses = await Expense.findAll({ where: postgresFilter });

    let productRevenue = 0;
    let deliveryRevenue = 0;
    let creditCardSales = 0;
    let canceledRevenue = 0;

    let deliveryCount = 0;
    let takeoutCount = 0;
    let validOrdersCount = 0;

    orders.forEach((order) => {
      const productsTotal = order.products.reduce((acc, prod) => {
        return acc + Number(prod.price) * Number(prod.quantity);
      }, 0);

      const deliveryFee = Number(order.deliveryFee) || 0;
      const orderTotal = productsTotal + deliveryFee;

      if (order.status === 'CANCELED') {
        canceledRevenue += orderTotal;
        return;
      }

      validOrdersCount++;

      if (order.orderType === 'takeout') {
        takeoutCount++;
      } else {
        deliveryCount++;
      }

      productRevenue += productsTotal;
      deliveryRevenue += deliveryFee;

      if (order.paymentMethod === 'card') {
        creditCardSales += orderTotal;
      }
    });

    const statusCount = {
      created: orders.filter((o) => o.status === 'CREATED').length,
      preparing: orders.filter((o) => o.status === 'PREPARING').length,
      delivering: orders.filter((o) => o.status === 'DELIVERING').length,
      delivered: orders.filter((o) => o.status === 'DELIVERED').length,
      canceled: orders.filter((o) => o.status === 'CANCELED').length,
    };

    const totalExpenses = expenses.reduce(
      (acc, exp) => acc + Number(exp.value),
      0,
    );
    const netProfit = productRevenue - totalExpenses;

    const productsMap = {};
    orders.forEach((order) => {
      if (order.status === 'CANCELED') return;
      order.products.forEach((prod) => {
        if (!productsMap[prod.name]) productsMap[prod.name] = 0;
        productsMap[prod.name] += Number(prod.quantity);
      });
    });

    const rankedProducts = Object.entries(productsMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    return response.json({
      period: { startDate, endDate },
      status: statusCount,
      finance: {
        productRevenue,
        deliveryRevenue,
        totalRevenue: productRevenue + deliveryRevenue,
        totalExpenses,
        netProfit,
        canceledRevenue,

        validOrdersCount,
        deliveryCount,
        takeoutCount,
      },
      paymentTypes: {
        creditCard: creditCardSales,
      },
      ranking: {
        bestSellers: rankedProducts.slice(0, 5),
        worstSellers: rankedProducts.reverse().slice(0, 5),
      },
    });
  }

  async reports(request, response) {
    const { startDate, endDate } = request.query;

    let filter = {};
    let postgresFilter = {};

    if (startDate && endDate) {
      filter = {
        createdAt: {
          $gte: startOfDay(parseISO(startDate)),
          $lte: endOfDay(parseISO(endDate)),
        },
      };
      postgresFilter = {
        date: {
          [Op.between]: [
            startOfDay(parseISO(startDate)),
            endOfDay(parseISO(endDate)),
          ],
        },
      };
    } else {
      const today = new Date();
      filter = {
        createdAt: { $gte: startOfDay(today), $lte: endOfDay(today) },
      };
      postgresFilter = {
        date: { [Op.between]: [startOfDay(today), endOfDay(today)] },
      };
    }

    const orders = await Order.find(filter);

    const expenses = await Expense.findAll({ where: postgresFilter });

    const salesList = orders
      .filter((o) => o.status !== 'CANCELED')
      .map((order) => ({
        id: order._id,
        date: order.createdAt,
        user: order.user.name,
        total: order.total || 0,
        payment: order.paymentMethod,
      }));

    const productsMap = {};
    orders.forEach((order) => {
      if (order.status === 'CANCELED') return;
      order.products.forEach((prod) => {
        if (!productsMap[prod.name]) {
          productsMap[prod.name] = { quantity: 0, totalValue: 0 };
        }
        productsMap[prod.name].quantity += Number(prod.quantity);
        productsMap[prod.name].totalValue +=
          Number(prod.price) * Number(prod.quantity);
      });
    });

    const productsList = Object.entries(productsMap)
      .map(([name, data]) => ({
        name,
        quantity: data.quantity,
        totalValue: data.totalValue,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    const deliveryList = orders
      .filter((o) => o.orderType === 'delivery' && o.status !== 'CANCELED')
      .map((order) => ({
        id: order._id,
        cep: order.address?.cep || 'N/A',
        fee: order.deliveryFee || 0,
        date: order.createdAt,
      }));
    const canceledList = orders
      .filter((o) => o.status === 'CANCELED')
      .map((order) => ({
        id: order._id,
        date: order.createdAt,
        total: order.total || 0,
      }));

    const expensesList = expenses.map((exp) => ({
      id: exp.id,
      description: exp.description,
      value: exp.value,
      date: exp.date,
    }));
    return response.json({
      salesList,
      productsList,
      deliveryList,
      canceledList,
      expensesList,
    });
  }
}

export default new DashboardController();
