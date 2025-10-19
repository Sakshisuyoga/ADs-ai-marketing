const express = require('express');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GEMINI_API_KEY
});

// Validation for AI requests
const aiRequestSchema = {
  prompt: 'string|required',
  max_tokens: 'number|optional|default:1000',
  temperature: 'number|optional|default:0.7',
  model: 'string|optional|default:gemini-pro'
};

// Generate text content
router.post('/generate-text', authenticate, async (req, res) => {
  try {
    const {
      prompt,
      max_tokens = 1000,
      temperature = 0.7,
      model = 'gemini-pro'
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Prompt is required'
      });
    }

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Google Gemini API key is not configured'
      });
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        maxOutputTokens: max_tokens,
        temperature: temperature
      }
    });

    const text = response.text;

    res.json({
      success: true,
      generated_text: text,
      usage: {
        prompt_tokens: prompt.length,
        completion_tokens: text.length,
        total_tokens: prompt.length + text.length
      }
    });
  } catch (error) {
    console.error('AI text generation error:', error);

    if (error.message?.includes('API key')) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Invalid or missing Google Gemini API key'
      });
    }

    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while generating text content'
    });
  }
});

// Generate slogans
router.post('/generate-slogans', authenticate, async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      campaign_style,
      target_audience,
      max_tokens = 1000
    } = req.body;

    if (!product_name || !product_description || !campaign_style) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product name, description, and campaign style are required'
      });
    }

    const style = campaign_style.replace('_', ' ');
    const audience_part = target_audience
      ? `Target audience: ${target_audience}.`
      : '';

    const prompt = `Generate exactly 5 concise marketing taglines (each <= 8 words) for a campaign.
    Product: ${product_name}. Description: ${product_description}. Style: ${style}.
    ${audience_part}
    Return ONLY a valid JSON array like ['tagline1', 'tagline2', 'tagline3', 'tagline4', 'tagline5']
    with no additional text, explanations, or formatting.`;

    // If no Gemini key, return deterministic fallback slogans instead of 500
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      const fallbacks = [
        `${product_name}: Smarter results, faster growth`,
        `Power your impact with ${product_name}`,
        `${product_name} — Optimize. Automate. Win.`,
        `Make every ad count with ${product_name}`,
        `${product_name}: AI that drives performance`
      ];
      return res.json({
        success: true,
        generated_content: {
          slogans: fallbacks.map((s) => ({ text: s, explanation: `Fallback ${campaign_style} tagline` })),
          recommended: fallbacks[0]
        },
        metadata: { product_name, product_description, campaign_style, target_audience }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        maxOutputTokens: max_tokens,
        temperature: 0.7
      }
    });

    const rawResponse = response.text
      .trim()
      .replace(/`/g, '')
      .replace(/^json\s*/i, '');

    // Parse the response to extract slogans
    let slogans = [];
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(rawResponse);
      if (Array.isArray(parsed)) {
        slogans = parsed
          .slice(0, 5)
          .map((slogan) => slogan.trim())
          .filter(
            (slogan) =>
              slogan.length > 3 &&
              !['json', '[', ']', '{', '}', 'null', 'undefined'].includes(
                slogan.toLowerCase()
              )
          );
      }
    } catch (e) {
      // Fallback: split by lines and filter
      const lines = rawResponse.split('\n');
      for (const line of lines) {
        const cleaned = line
          .trim()
          .replace(/[-•"']/g, '')
          .trim();
        if (
          cleaned.length > 3 &&
          !['json', '[', ']', '{', '}', 'null', 'undefined', 'error'].includes(
            cleaned.toLowerCase()
          ) &&
          cleaned.split(' ').length <= 8
        ) {
          slogans.push(cleaned);
        }
      }
    }

    // Ensure we have exactly 5 slogans
    if (slogans.length < 5) {
      const fallbacks = [
        `${product_name}: Where Innovation Meets Excellence`,
        `Transform Your Business with ${product_name}`,
        `${product_name} - Your Gateway to Success`,
        `Unlock Potential with ${product_name}`,
        `${product_name}: Excellence Redefined`
      ];
      slogans = [...slogans, ...fallbacks].slice(0, 5);
    }

    const slogansWithExplanations = slogans.map((slogan, index) => ({
      text: slogan,
      explanation: `Auto-generated ${campaign_style} tagline`
    }));

    res.json({
      success: true,
      generated_content: {
        slogans: slogansWithExplanations,
        recommended: slogans[0] || `${product_name}: Your Success Partner`
      },
      metadata: {
        product_name,
        product_description,
        campaign_style,
        target_audience
      }
    });
  } catch (error) {
    console.error('Slogan generation error:', error);
    // Fallback slogans on any failure instead of 500
    try {
      const { product_name = 'Your Product', campaign_style = 'professional' } = req.body || {};
      const fallbacks = [
        `${product_name}: Smarter results, faster growth`,
        `Power your impact with ${product_name}`,
        `${product_name} — Optimize. Automate. Win.`,
        `Make every ad count with ${product_name}`,
        `${product_name}: AI that drives performance`
      ];
      return res.json({
        success: true,
        generated_content: {
          slogans: fallbacks.map((s) => ({ text: s, explanation: `Fallback ${campaign_style} tagline` })),
          recommended: fallbacks[0]
        },
        metadata: req.body || {}
      });
    } catch (e) {
      return res.status(500).json({
        error: 'AI Generation Failed',
        message: 'An error occurred while generating slogans'
      });
    }
  }
});

// Generate ad copy
router.post('/generate-ad-copy', authenticate, async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      campaign_style,
      target_audience,
      max_tokens = 800
    } = req.body;

    if (!product_name || !product_description || !campaign_style) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product name, description, and campaign style are required'
      });
    }

    const adCopies = [
      {
        text: `Discover ${product_name} - the revolutionary solution that's changing the game. ${product_description.substring(
          0,
          100
        )}...`,
        explanation: 'Focuses on discovery and innovation'
      },
      {
        text: `Ready to transform your business? ${product_name} delivers results that matter. ${product_description.substring(
          0,
          80
        )}...`,
        explanation: 'Emphasizes transformation and results'
      },
      {
        text: `Join thousands who trust ${product_name} for their success. ${product_description.substring(
          0,
          90
        )}...`,
        explanation: 'Uses social proof and trust'
      }
    ];

    if (target_audience) {
      adCopies.push({
        text: `Perfect for ${target_audience}: ${product_name} delivers exactly what you need. ${product_description.substring(
          0,
          70
        )}...`,
        explanation: `Targets ${target_audience} specifically`
      });
    }

    res.json({
      success: true,
      generated_content: {
        ad_copies: adCopies,
        recommended: adCopies[0].text
      },
      metadata: {
        product_name,
        product_description,
        campaign_style,
        target_audience
      }
    });
  } catch (error) {
    console.error('Ad copy generation error:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while generating ad copy'
    });
  }
});

// Generate headlines
router.post('/generate-headlines', authenticate, async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      campaign_style,
      target_audience,
      max_tokens = 800
    } = req.body;

    if (!product_name || !product_description || !campaign_style) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product name, description, and campaign style are required'
      });
    }

    const headlines = [
      {
        text: `Introducing ${product_name}: The Future is Here`,
        explanation: 'Creates excitement and forward-thinking'
      },
      {
        text: `Why ${product_name} is the Choice of Professionals`,
        explanation: 'Appeals to professional credibility'
      },
      {
        text: `Get More Done with ${product_name}`,
        explanation: 'Focuses on productivity and efficiency'
      }
    ];

    if (target_audience) {
      headlines.push({
        text: `${target_audience} Love ${product_name} - Here's Why`,
        explanation: `Directly addresses ${target_audience}`
      });
    }

    res.json({
      success: true,
      generated_content: {
        headlines: headlines,
        recommended: headlines[0].text
      },
      metadata: {
        product_name,
        product_description,
        campaign_style,
        target_audience
      }
    });
  } catch (error) {
    console.error('Headline generation error:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while generating headlines'
    });
  }
});

// Generate product descriptions
router.post('/generate-descriptions', authenticate, async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      campaign_style,
      target_audience,
      max_tokens = 800
    } = req.body;

    if (!product_name || !product_description || !campaign_style) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product name, description, and campaign style are required'
      });
    }

    const descriptions = [
      {
        text: `${product_name} is a cutting-edge solution designed to deliver exceptional results. ${product_description}`,
        explanation: 'Comprehensive and detailed description'
      },
      {
        text: `Experience the power of ${product_name}. ${product_description.substring(
          0,
          150
        )}...`,
        explanation: 'Focuses on experience and benefits'
      },
      {
        text: `${product_name} combines innovation with reliability to provide the perfect solution for your needs. ${product_description.substring(
          0,
          120
        )}...`,
        explanation: 'Emphasizes innovation and reliability'
      }
    ];

    res.json({
      success: true,
      generated_content: {
        descriptions: descriptions,
        recommended: descriptions[0].text
      },
      metadata: {
        product_name,
        product_description,
        campaign_style,
        target_audience
      }
    });
  } catch (error) {
    console.error('Description generation error:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while generating descriptions'
    });
  }
});

// Generate marketing copy
router.post('/generate-marketing-copy', authenticate, async (req, res) => {
  try {
    const {
      product_name,
      target_audience,
      tone = 'professional',
      content_type = 'general',
      key_benefits = [],
      max_tokens = 500
    } = req.body;

    if (!product_name || !target_audience) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product name and target audience are required'
      });
    }

    const prompt = `Generate engaging marketing copy for "${product_name}" targeting ${target_audience}.
    Use a ${tone} tone of voice.
    Content type: ${content_type}.
    ${
      key_benefits.length > 0 ? `Key benefits: ${key_benefits.join(', ')}.` : ''
    }
    Create compelling, persuasive copy that highlights the value proposition and encourages action.`;

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Google Gemini API key is not configured'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        maxOutputTokens: max_tokens,
        temperature: 0.7
      }
    });

    const text = response.text;

    res.json({
      success: true,
      marketing_copy: text,
      metadata: {
        product_name,
        target_audience,
        tone,
        content_type,
        key_benefits
      }
    });
  } catch (error) {
    console.error('Marketing copy generation error:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while generating marketing copy'
    });
  }
});

// Generate social media posts
router.post('/generate-social-post', authenticate, async (req, res) => {
  try {
    const {
      topic,
      platform = 'general',
      tone = 'engaging',
      include_hashtags = true,
      max_length = 280
    } = req.body;

    if (!topic) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Topic is required'
      });
    }

    let platformPrompt = '';
    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        platformPrompt =
          'Keep it under 280 characters, make it punchy and engaging.';
        break;
      case 'linkedin':
        platformPrompt =
          'Make it professional yet engaging, suitable for business networking.';
        break;
      case 'instagram':
        platformPrompt =
          'Make it visually descriptive and engaging, suitable for image captions.';
        break;
      case 'facebook':
        platformPrompt = 'Make it conversational and community-oriented.';
        break;
      default:
        platformPrompt = 'Make it engaging and suitable for social media.';
    }

    const hashtagPrompt = include_hashtags
      ? 'Include 3-5 relevant hashtags at the end.'
      : 'Do not include hashtags.';

    const prompt = `Generate a social media post about: "${topic}".
    Platform: ${platform}
    Tone: ${tone}
    ${platformPrompt}
    ${hashtagPrompt}
    Keep the length appropriate for the platform (max ${max_length} characters).`;

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Google Gemini API key is not configured'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        maxOutputTokens: Math.ceil(max_length * 0.25), // Rough estimate for tokens
        temperature: 0.8
      }
    });

    const text = response.text;

    res.json({
      success: true,
      social_post: text,
      metadata: {
        topic,
        platform,
        tone,
        include_hashtags,
        character_count: text.length
      }
    });
  } catch (error) {
    console.error('Social post generation error:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while generating social media post'
    });
  }
});

// Generate email content
router.post('/generate-email', authenticate, async (req, res) => {
  try {
    const {
      subject,
      recipient_type = 'customer',
      goal = 'inform',
      tone = 'professional',
      key_points = []
    } = req.body;

    if (!subject) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email subject is required'
      });
    }

    const prompt = `Generate a professional email with the subject: "${subject}".
    Recipient type: ${recipient_type}
    Goal: ${goal}
    Tone: ${tone}
    ${
      key_points.length > 0
        ? `Key points to include: ${key_points.join(', ')}.`
        : ''
    }
    Structure the email with:
    1. A compelling subject line
    2. A personalized greeting
    3. An engaging introduction
    4. The main content body
    5. A clear call-to-action
    6. A professional sign-off

    Keep it concise but impactful.`;

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Google Gemini API key is not configured'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 800,
        temperature: 0.7
      }
    });

    const emailContent = response.text;

    res.json({
      success: true,
      email_content: emailContent,
      metadata: {
        subject,
        recipient_type,
        goal,
        tone,
        key_points
      }
    });
  } catch (error) {
    console.error('Email generation error:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while generating email content'
    });
  }
});

// Content summarization
router.post('/summarize', authenticate, async (req, res) => {
  try {
    const { content, max_length = 200, style = 'concise' } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Content to summarize is required'
      });
    }

    const prompt = `Please summarize the following content in a ${style} style, keeping it under ${max_length} words:

    "${content}"

    Focus on the key points and main ideas. Make it clear and engaging.`;

    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Google Gemini API key is not configured'
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        maxOutputTokens: Math.ceil(max_length * 1.5), // Rough estimate for tokens
        temperature: 0.5
      }
    });

    const summary = response.text;

    res.json({
      success: true,
      summary: summary,
      metadata: {
        original_length: content.length,
        summary_length: summary.length,
        style,
        max_length
      }
    });
  } catch (error) {
    console.error('Content summarization error:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: 'An error occurred while summarizing content'
    });
  }
});

// Generate images for selected slogan (matches FastAPI /generate-images endpoint)
router.post('/generate-images', authenticate, async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      campaign_style,
      selected_tagline,
      image_type = 'product_mockup',
      product_type
    } = req.body;

    if (!product_name || !product_description || !selected_tagline) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Product name, description, and selected tagline are required'
      });
    }

    console.log('🖼️ Image Generation Request Received');
    console.log(`📋 Product: ${product_name}, Tagline: ${selected_tagline}`);

    // Generate enhanced prompt from Gemini if available (can be disabled)
    let processed_prompt = null;
    if (
      process.env.GOOGLE_GEMINI_API_KEY &&
      process.env.AI_ENHANCE_IMAGES !== 'false'
    ) {
      try {
        const enhancement_prompt = `You are optimizing a prompt for a text-to-image API.
Return a single, comma-separated prompt with short tokens only (no sentences), max 300 characters, no quotes, no line breaks.
Include: subject, key visual cues, composition, lighting, quality tokens, style tokens for ${campaign_style}, and the tagline as a short token.
Context: product=${product_name}; type=${
          product_type || 'software/service'
        }; tagline=${selected_tagline}; brief=${product_description}; image_type=${image_type}.
Example output format: modern SaaS dashboard, KPI charts, world map heatpoints, soft diffused light, 4k, ultra-detailed, minimal, creative style, tagline: Smarter ads bigger impact ADFUSION`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: enhancement_prompt,
          config: { maxOutputTokens: 120, temperature: 0.2 }
        });

        processed_prompt = response.text
          .split('\n')[0]
          .trim()
          .replace(/[`"']/g, '')
          .replace(/^json\s*/i, '')
          .replace(/\s+/g, ' ');
        if (processed_prompt.length > 300)
          processed_prompt = processed_prompt.slice(0, 300);
        // Ensure comma separation style
        processed_prompt = processed_prompt.replace(/\.\s*/g, ', ');
        console.log(
          `✅ Enhanced prompt generated: ${processed_prompt.substring(
            0,
            100
          )}...`
        );
      } catch (error) {
        console.error(
          '❌ Failed to generate enhanced prompt from Gemini:',
          error
        );
      }
    }

    // Build ClipDrop prompt (max 1000 chars)
    // Build concise final prompt (<=1000 chars for ClipDrop)
    const fallbackCompact = [
      product_type || 'SaaS',
      image_type,
      product_name,
      'marketing image',
      campaign_style,
      'clean minimal',
      'soft diffused light',
      '4k, ultra-detailed',
      selected_tagline ? `tagline: ${selected_tagline}` : ''
    ]
      .filter(Boolean)
      .join(', ');

    const finalPrompt = (processed_prompt || fallbackCompact)
      .toString()
      .slice(0, 1000);

    let generated_images = [];
    let clipdropMeta = null;
    let clipdropError = null;

    // Prefer ClipDrop when API key is available
    if (process.env.CLIPDROP_API_KEY) {
      try {
        console.log('🎨 Calling ClipDrop text-to-image API');
        const form = new FormData();
        form.append('prompt', finalPrompt);

        const clipResp = await fetch(
          'https://clipdrop-api.co/text-to-image/v1',
          {
            method: 'POST',
            headers: { 'x-api-key': process.env.CLIPDROP_API_KEY },
            body: form
          }
        );

        if (!clipResp.ok) {
          let detail = 'Unknown error';
          try {
            const errJson = await clipResp.json();
            detail = errJson?.error || JSON.stringify(errJson);
          } catch {}
          clipdropError = { status: clipResp.status, detail };
          console.warn(
            `⚠️ ClipDrop call failed: ${clipResp.status} - ${detail}`
          );
        } else {
          const buf = Buffer.from(await clipResp.arrayBuffer());
          const dataUrl = `data:image/png;base64,${buf.toString('base64')}`;
          generated_images.push(dataUrl);
          clipdropMeta = {
            remaining_credits: clipResp.headers.get('x-remaining-credits'),
            credits_consumed: clipResp.headers.get('x-credits-consumed')
          };
        }
      } catch (e) {
        console.error('❌ ClipDrop request error:', e);
      }
    }

    // Fallback placeholder when no image was generated
    if (generated_images.length === 0) {
      console.log('🔄 Falling back to placeholder SVG');
      const svg = `
        <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          <rect width="512" height="512" fill="#f8fafc"/>
          <rect x="40" y="40" width="432" height="432" rx="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="256" cy="180" r="40" fill="#3b82f6" opacity="0.8"/>
          <text x="256" y="350" font-family="system-ui" font-size="18" font-weight="600" text-anchor="middle" fill="#1e293b">${product_name}</text>
          <text x="256" y="380" font-family="system-ui" font-size="12" text-anchor="middle" fill="#64748b">${campaign_style.toUpperCase()} STYLE</text>
          <text x="256" y="410" font-family="system-ui" font-size="10" text-anchor="middle" fill="#94a3b8">${selected_tagline}</text>
        </svg>`;
      generated_images.push(
        `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
      );
    }

    console.log(
      `✅ Image generation completed. Generated ${generated_images.length} images`
    );

    res.json({
      success: true,
      content_type: 'images_only',
      generated_content: { message: 'Images generated successfully' },
      generated_images,
      processed_prompt,
      clipdrop: clipdropMeta,
      clipdrop_error: clipdropError
    });
  } catch (error) {
    console.error('💥 Image generation failed:', error);
    res.status(500).json({
      error: 'AI Generation Failed',
      message: `Image generation failed: ${error.message}`
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'AI route working',
    timestamp: new Date().toISOString()
  });
});

// Logging status endpoint (matches FastAPI logging-status)
router.get('/logging-status', (req, res) => {
  const api_status = {
    clipdrop_api_key: !!process.env.CLIPDROP_API_KEY,
    huggingface_token: !!process.env.HUGGINGFACE_API_TOKEN,
    gemini_available: !!process.env.GOOGLE_GEMINI_API_KEY,
    gemini_text_model: !!process.env.GOOGLE_GEMINI_API_KEY
  };

  res.json({
    logging_enabled: true,
    log_file: 'ai_services.log',
    api_status: api_status,
    image_generation: 'ClipDrop API (primary) + Hugging Face (fallback)',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
