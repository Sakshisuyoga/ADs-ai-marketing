const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // User information
  first_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  company_name: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Product information
  product_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  product_type: {
    type: DataTypes.ENUM('Physical Product', 'Digital Product', 'Service', 'SaaS/Software', 'Other'),
    allowNull: false
  },
  product_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },

  // Campaign information
  campaign_style: {
    type: DataTypes.ENUM('Professional', 'Creative', 'Minimalist', 'Bold & Edgy', 'Playful'),
    allowNull: false
  },
  current_slogan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  generated_slogan: {
    type: DataTypes.STRING,
    allowNull: true
  },
  generated_content: {
    type: DataTypes.JSON,
    allowNull: true
  },

  // Campaign settings
  status: {
    type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'cancelled'),
    defaultValue: 'draft'
  },
  budget: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },

  // Analytics
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ctr: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.0
  },

  // File uploads
  uploaded_files: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },

  // User relationship
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'campaigns',
  timestamps: true,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['email']
    }
  ]
});

module.exports = Campaign;
