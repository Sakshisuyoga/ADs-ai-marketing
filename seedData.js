const { Campaign } = require('../models/Campaign');
const { User } = require('../models/User');

/**
 * Seed sample data for testing and demonstration purposes
 */
async function seedSampleData() {
  try {
    console.log('🌱 Seeding sample data...');

    // Check if sample user exists
    let sampleUser = await User.findOne({
      where: { email: 'john.doe@test.com' }
    });

    if (!sampleUser) {
      sampleUser = await User.create({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        password: 'Test@123',
        company_name: 'TechCorp Solutions'
      });
      console.log('✅ Sample user created');
    }

    // Check if sample campaign exists
    const existingCampaign = await Campaign.findOne({
      where: {
        email: 'john.doe@test.com',
        product_name: 'Smart Home Optimizer'
      }
    });

    if (!existingCampaign) {
      const sampleCampaign = await Campaign.create({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@test.com',
        phone: '+91-9876543210',
        company_name: 'TechCorp Solutions',
        product_name: 'Smart Home Optimizer',
        product_type: 'SaaS/Software',
        product_description: 'AI-powered home automation system that optimizes energy consumption and improves comfort',
        campaign_style: 'Professional',
        budget: 5000.0,
        current_slogan: 'Make your home smarter',
        status: 'completed',
        impressions: 0,
        clicks: 0,
        ctr: 0.0,
        generated_slogan: 'Empower Your Home, Optimize Your Savings.',
        generated_content: {
          slogans: [
            {
              text: 'Empower Your Home, Optimize Your Savings.',
              explanation: 'Emphasizes both empowerment and cost benefits'
            },
            {
              text: 'Smart Living, Smarter Savings.',
              explanation: 'Focus on intelligence and financial benefits'
            },
            {
              text: 'Transform Your Home, Reduce Your Bills.',
              explanation: 'Highlights transformation and cost reduction'
            }
          ],
          recommended: 'Empower Your Home, Optimize Your Savings.'
        },
        user_id: sampleUser.id
      });

      console.log('✅ Sample campaign created');
      console.log('📊 Sample data seeded successfully!');
      console.log(`   User: ${sampleUser.email}`);
      console.log(`   Campaign: ${sampleCampaign.product_name}`);
    } else {
      console.log('ℹ️ Sample campaign already exists');
    }

  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
  }
}

/**
 * Clear all sample data
 */
async function clearSampleData() {
  try {
    console.log('🗑️ Clearing sample data...');

    // Delete sample campaigns
    const deletedCampaigns = await Campaign.destroy({
      where: { email: 'john.doe@test.com' }
    });

    // Delete sample user
    const deletedUsers = await User.destroy({
      where: { email: 'john.doe@test.com' }
    });

    console.log(`✅ Cleared ${deletedCampaigns} campaigns and ${deletedUsers} users`);

  } catch (error) {
    console.error('❌ Error clearing sample data:', error);
  }
}

module.exports = {
  seedSampleData,
  clearSampleData
};
