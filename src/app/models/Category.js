import Sequelize, { Model } from 'sequelize';

class Category extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        path: Sequelize.STRING,
        url: {
          type: Sequelize.VIRTUAL,
          get() {
            return `${process.env.APP_URL}/category-file/${this.path}`;
          },
        },
      },
      {
        sequelize,
        tableName: 'categories',
      },
    );
    return this;
  }
}

export default Category;
