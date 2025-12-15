import Sequelize, { Model } from 'sequelize';

class Expense extends Model {
  static init(sequelize) {
    super.init(
      {
        description: Sequelize.STRING,
        value: Sequelize.FLOAT,
        date: Sequelize.DATE,
      },
      {
        sequelize,
        tableName: 'expenses',
        underscored: true,
      },
    );
    return this;
  }
}

export default Expense;
