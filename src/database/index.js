import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import Category from '../app/models/Category.js';
import Product from '../app/models/Product.js';
import User from '../app/models/User.js';
import databaseConfig from '../config/database.cjs';
import 'dotenv/config';
import DeliveryTax from '../app/models/DeliveryTax.js';
import Expense from '../app/models/Expense.js';

const models = [User, Product, Category, DeliveryTax, Expense];

class Database {
  constructor() {
    this.init();
    this.mongo();
  }

  init() {
    this.conection = new Sequelize(databaseConfig);
    models
      .map((model) => model.init(this.conection))
      .map(
        (model) => model.associate && model.associate(this.conection.models),
      );
  }
  mongo() {
    this.mongooseConection = mongoose.connect(process.env.MONGO_URL);
  }
}

export default new Database();
