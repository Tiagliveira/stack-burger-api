import Sequelize, { Model } from 'sequelize';

class Product extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        price: Sequelize.INTEGER,
        path: Sequelize.STRING,
        offer: Sequelize.BOOLEAN,
        description: Sequelize.STRING,
        available: Sequelize.BOOLEAN,
        sold_count: Sequelize.INTEGER,
        rating_average: Sequelize.FLOAT,
        rating_count: Sequelize.INTEGER,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `http://localhost:3001/product-file/${this.path}`;
          },
        },
      },
      {
        sequelize,
        tableName: 'products',
      },
    );
    return this;
  }

  static associate(Models) {
    this.belongsTo(Models.Category, {
      foreignKey: 'category_id',
      as: 'category',
    });
  }
}

export default Product;
