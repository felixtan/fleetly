'use strict';

/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Car', { 
    tlcNumber: {
      type: DataTypes.STRING,
      allowNull: false,           // required
    },
    licensePlateNumber: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mileage: {
      type: DataTypes.INTEGER,
      allowNull: false,           // required
    },
    oilChangeRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    organization: {
      type: DataTypes.STRING,
      allowNull: false,           // required
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    }
  });
};
