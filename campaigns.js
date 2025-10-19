const express = require('express');
const Joi = require('joi');
const { Op } = require('sequelize');
const axios = require('axios');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const createCampaignSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(''),
  company_name: Joi.string().min(1).max(100).required(),
  product_name: Joi.string().min(1).max(100).required(),
  product_type: Joi.string().valid('Physical Product', 'Digital Product', 'Service', 'SaaS/Software', 'Other').required(),
  product_description: Joi.string().min(10).max(1000).required(),
  campaign_style: Joi.string().valid('Professional', 'Creative', 'Minimalist', 'Bold & Edgy', 'Playful').required(),
  budget: Joi.number().positive().precision(2).allow(null),
  current_slogan: Joi.string().allow('')
});

const updateCampaignSchema = Joi.object({
  first_name: Joi.string().min(2).max(50),
  last_name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  phone: Joi.string().allow(''),
  company_name: Joi.string().min(1).max(100),
  product_name: Joi.string().min(1).max(100),
  product_type: Joi.string().valid('Physical Product', 'Digital Product', 'Service', 'SaaS/Software', 'Other'),
  product_description: Joi.string().min(10).max(1000),
  campaign_style: Joi.string().valid('Professional', 'Creative', 'Minimalist', 'Bold & Edgy', 'Playful'),
  current_slogan: Joi.string().allow(''),
  status: Joi.string().valid('draft', 'active', 'paused', 'completed', 'cancelled'),
  budget: Joi.number().positive().precision(2).allow(null)
});

// Simplified schema for frontend campaign creation (user info comes from JWT)
const createCampaignFromFrontendSchema = Joi.object({
  product_name: Joi.string().min(1).max(100).required(),
  product_type: Joi.string().valid('Physical Product', 'Digital Product', 'Service', 'SaaS/Software', 'Other').required(),
  product_description: Joi.string().min(10).max(1000).required(),
  campaign_style: Joi.string().valid('Professional', 'Creative', 'Minimalist', 'Bold & Edgy', 'Playful').required(),
  budget: Joi.number().positive().precision(2).allow(null),
  current_slogan: Joi.string().allow('')
});

// Get all campaigns for current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { user_id: req.user.id };

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    // Add search filter if provided
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }

    const campaigns = await Campaign.findAndCountAll({
      where: whereClause,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      campaigns: campaigns.rows,
      pagination: {
        total: campaigns.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(campaigns.count / limit)
      }
    });

  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching campaigns'
    });
  }
});

// Get analytics by email (non-authenticated version for dashboard)
router.get('/analytics', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email parameter is required'
      });
    }

    const campaigns = await Campaign.findAll({
      where: { email }
    });

    const total = campaigns.length;
    const active = campaigns.filter(c => c.status === 'active').length;
    const budget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const ctr_values = campaigns.filter(c => c.ctr > 0).map(c => c.ctr);
    const ctr = ctr_values.length > 0 ? ctr_values.reduce((sum, ctr_val) => sum + ctr_val, 0) / ctr_values.length : 0;

    res.set('Cache-Control', 'no-store');
    res.json({
      total,
      active,
      budget,
      ctr: Number(ctr.toFixed(2))
    });

  } catch (error) {
    console.error('Get analytics by email error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching analytics'
    });
  }
});

// Get campaigns by email (non-authenticated version for dashboard)
router.get('/by-email', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email parameter is required'
      });
    }

  const campaigns = await Campaign.findAll({
      where: { email },
      attributes: ['id', 'product_name', 'product_type', 'campaign_style', 'budget', 'created_at', 'uploaded_files'],
      order: [['created_at', 'DESC']]
    });

  const formattedCampaigns = campaigns.map(campaign => {
    let files = campaign.uploaded_files;
    if (typeof files === 'string') {
      try { files = JSON.parse(files); } catch { files = []; }
    }
    if (!Array.isArray(files)) files = [];
    return {
      id: campaign.id,
      product_name: campaign.product_name,
      product_type: campaign.product_type,
      campaign_style: campaign.campaign_style,
      budget: campaign.budget,
      created_at: campaign.created_at ? campaign.created_at.toISOString() : new Date().toISOString(),
      uploaded_files: files
    };
  });

    res.set('Cache-Control', 'no-store');
    res.json(formattedCampaigns);

  } catch (error) {
    console.error('Get campaigns by email error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching campaigns'
    });
  }
});

// Test endpoint (matches FastAPI test endpoints)
router.get('/test', (req, res) => {
  res.json({
    message: 'Campaign route working',
    timestamp: new Date().toISOString()
  });
});

// Get single campaign
router.get('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: 'Campaign not found or you do not have permission to view it'
      });
    }

    res.json({ campaign });

  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching the campaign'
    });
  }
});

// Create new campaign
router.post('/', authenticate, async (req, res) => {
  try {
    const { error, value } = createCampaignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const campaignData = {
      ...value,
      user_id: req.user.id,
      status: 'draft'
    };

    const campaign = await Campaign.create(campaignData);

    // Generate AI content for the campaign
    try {
      const aiResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/generate-slogans`, {
        product_name: campaign.product_name,
        product_description: campaign.product_description,
        campaign_style: campaign.campaign_style,
        target_audience: null // Could be added later
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        }
      });

      if (aiResponse.data && aiResponse.data.success && aiResponse.data.generated_content) {
        await campaign.update({
          generated_slogan: aiResponse.data.generated_content.recommended,
          generated_content: aiResponse.data.generated_content
        });
      }
    } catch (aiError) {
      console.error('AI content generation failed:', aiError);
      // Continue without AI content - campaign is still created
    }

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating the campaign'
    });
  }
});

// Update campaign
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { error, value } = updateCampaignSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    const campaign = await Campaign.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: 'Campaign not found or you do not have permission to update it'
      });
    }

    await campaign.update(value);

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign
    });

  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating the campaign'
    });
  }
});

// Save a generated image to a campaign's uploaded_files
router.post('/:id/images', authenticate, async (req, res) => {
  try {
    const { data_url, source = 'generated', meta = null } = req.body || {};

    if (!data_url || typeof data_url !== 'string' || !data_url.startsWith('data:image/')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'A valid image data URL is required'
      });
    }

    let campaign = await Campaign.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: 'Campaign not found or you do not have permission to update it'
      });
    }

    const currentFiles = Array.isArray(campaign.uploaded_files) ? campaign.uploaded_files : (campaign.uploaded_files ? [campaign.uploaded_files] : []);
    const newFile = {
      id: `${Date.now()}`,
      type: 'image',
      source,
      created_at: new Date().toISOString(),
      data_url,
      meta
    };

    // Prepend newest image so it's first in arrays and quick admin views
    const updatedFiles = [newFile, ...currentFiles];
    await campaign.update({ uploaded_files: updatedFiles });
    // Reload with fresh values to ensure latest JSON is read back
    campaign = await Campaign.findOne({ where: { id: campaign.id } });

    res.json({
      success: true,
      message: 'Image saved to campaign',
      file: newFile,
      uploaded_files: Array.isArray(campaign.uploaded_files) ? campaign.uploaded_files : []
    });
  } catch (error) {
    console.error('Save campaign image error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while saving the image'
    });
  }
});

// Delete an image from a campaign's uploaded_files
router.delete('/:id/images/:fileId', authenticate, async (req, res) => {
  try {
    let campaign = await Campaign.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    let files = campaign.uploaded_files;
    if (typeof files === 'string') {
      try { files = JSON.parse(files); } catch { files = []; }
    }
    files = Array.isArray(files) ? files : [];

    const fileId = String(req.params.fileId);
    const nextFiles = files.filter((f) => String(f?.id) !== fileId);

    await campaign.update({ uploaded_files: nextFiles });
    campaign = await Campaign.findOne({ where: { id: campaign.id } });

    res.json({ success: true, uploaded_files: Array.isArray(campaign.uploaded_files) ? campaign.uploaded_files : [] });
  } catch (error) {
    console.error('Delete campaign image error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: 'Failed to delete image' });
  }
});

// Delete campaign
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: 'Campaign not found or you do not have permission to delete it'
      });
    }

    await campaign.destroy();

    res.json({
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while deleting the campaign'
    });
  }
});

// Update campaign status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['draft', 'active', 'paused', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: draft, active, paused, completed, cancelled'
      });
    }

    const campaign = await Campaign.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: 'Campaign not found or you do not have permission to update it'
      });
    }

    await campaign.update({ status });

    res.json({
      message: 'Campaign status updated successfully',
      campaign
    });

  } catch (error) {
    console.error('Update campaign status error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating campaign status'
    });
  }
});

// Get user analytics (authenticated)
router.get('/analytics/user', authenticate, async (req, res) => {
  try {
    const campaigns = await Campaign.findAll({
      where: { user_id: req.user.id }
    });

    const total_campaigns = campaigns.length;
    const active_campaigns = campaigns.filter(c => c.status === 'active').length;
    const total_budget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const ctr_values = campaigns.filter(c => c.ctr > 0).map(c => c.ctr);
    const avg_ctr = ctr_values.length > 0 ? ctr_values.reduce((sum, ctr) => sum + ctr, 0) / ctr_values.length : 0;

    res.json({
      total_campaigns,
      active_campaigns,
      total_budget,
      avg_ctr
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while fetching user analytics'
    });
  }
});

// Update campaign analytics
router.patch('/:id/analytics', authenticate, async (req, res) => {
  try {
    const { impressions, clicks } = req.body;

    if (typeof impressions !== 'number' || typeof clicks !== 'number') {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Impressions and clicks must be numbers'
      });
    }

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    const campaign = await Campaign.findOne({
      where: {
        id: req.params.id,
        user_id: req.user.id
      }
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: 'Campaign not found or you do not have permission to update it'
      });
    }

    await campaign.update({
      impressions,
      clicks,
      ctr,
      updated_at: new Date()
    });

    res.json({
      message: 'Campaign analytics updated successfully',
      campaign: {
        id: campaign.id,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.ctr
      }
    });

  } catch (error) {
    console.error('Update campaign analytics error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while updating campaign analytics'
    });
  }
});

// Note: /list endpoint not currently used by frontend

// Note: /details endpoint not currently used by frontend

// Create campaign (matches frontend /campaigns/create call)
router.post('/create', authenticate, async (req, res) => {
  try {
    const { error, value } = createCampaignFromFrontendSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      });
    }

    // Get user information from the authenticated user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Authenticated user not found'
      });
    }

    const campaignData = {
      ...value,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      company_name: user.company_name || 'Unknown Company',
      user_id: req.user.id,
      status: 'draft'
    };

    const campaign = await Campaign.create(campaignData);

    // Generate AI content for the campaign
    try {
      const aiResponse = await axios.post(`${req.protocol}://${req.get('host')}/api/ai/generate-slogans`, {
        product_name: campaign.product_name,
        product_description: campaign.product_description,
        campaign_style: campaign.campaign_style,
        target_audience: null // Could be added later
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization
        }
      });

      if (aiResponse.data && aiResponse.data.success && aiResponse.data.generated_content) {
        await campaign.update({
          generated_slogan: aiResponse.data.generated_content.recommended,
          generated_content: aiResponse.data.generated_content
        });
      }
    } catch (aiError) {
      console.error('AI content generation failed:', aiError);
      // Continue without AI content - campaign is still created
    }

    res.status(201).json({
      message: 'Campaign created successfully',
      campaign
    });

  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while creating the campaign'
    });
  }
});

// Note: /by-email endpoint already defined above (line 124)
// Note: /analytics endpoint already defined above (line 86)

// Test endpoint (matches FastAPI test endpoints)
router.get('/test', (req, res) => {
  res.json({
    message: 'Campaign route working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
