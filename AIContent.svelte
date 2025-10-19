<script>
  import { onMount, onDestroy } from 'svelte';
  import { auth, getAuthHeaders, signInDemo } from '$lib/stores';
  import { Button } from '$ui/button';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '$ui/card';
  import { Label } from '$ui/label';
  import { Badge } from '$ui/badge';
  import {
    Bot,
    Sparkles,
    Copy,
    RefreshCw,
    Target,
    MessageSquare,
    Image,
    FileText
  } from 'lucide-svelte';

  let productName = '';
  let productDescription = '';
  let targetAudience = '';
  let campaignStyle = 'professional';
  let contentType = 'slogan';
  let imageType = 'product_mockup';
  let isGenerating = false;
  let generatedContent = null;
  let selectedTagline = '';
  let selectedSloganIndex = -1; // Track which slogan is selected for image generation
  let savedSlogans = new Set(); // Track which slogans have been saved
  let generatedImages = [];
  let savedImageIds = new Set();
  let savedImages = new Set();
  let error = '';
  let processedPrompt = '';
  let showSloganGeneration = false;
  let showImageGeneration = false;
  let showImageTypeSelection = false; // New state for image type selection
  let cooldownTime = 0;
  let cooldownInterval = null;

  // Campaign selection
  let existingCampaigns = [];
  let selectedCampaign = null;
  let showCampaignSelection = true;
  let isLoadingCampaigns = false;

  // Check URL parameters to determine initial state
  let skipCampaignSelection = false;

  const contentTypes = [
    { value: 'slogan', label: 'Slogans', icon: MessageSquare },
    { value: 'ad_copy', label: 'Ad Copy', icon: FileText },
    { value: 'headlines', label: 'Headlines', icon: Target },
    { value: 'descriptions', label: 'Product Descriptions', icon: FileText }
  ];

  const campaignStyles = [
    { value: 'professional', label: 'Professional' },
    { value: 'creative', label: 'Creative' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'bold', label: 'Bold & Edgy' },
    { value: 'playful', label: 'Playful' }
  ];

  const imageTypes = [
    { value: 'product_mockup', label: 'Product Mockup' },
    { value: 'logo', label: 'Logo' },
    { value: 'illustration', label: 'Illustration' }
  ];

  // Load existing campaigns
  async function loadCampaigns() {
    if (!$auth.email) return;

    isLoadingCampaigns = true;
    try {
      const response = await fetch(
        `/api/campaigns/by-email?email=${encodeURIComponent($auth.email)}`
      );
      if (response.ok) {
        existingCampaigns = await response.json();
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      isLoadingCampaigns = false;
    }
  }

  // Select a campaign and populate form
  async function selectCampaign(campaign) {
    console.log('🎯 Campaign selected:', campaign);
    selectedCampaign = campaign;

    // Load full campaign details
    try {
      console.log('📡 Fetching campaign details for ID:', campaign.id);
      let response = await fetch(`/api/campaigns/${campaign.id}`, {
        headers: getAuthHeaders()
      });
      console.log('📡 Campaign details response status:', response.status);

      // Auto re-authenticate once if token expired/invalid
      if (response.status === 401) {
        const email = $auth.email || 'john.doe@test.com';
        console.warn('🔐 401 received. Attempting demo re-auth for', email);
        const login = await signInDemo(email);
        if (login?.success) {
          response = await fetch(`/api/campaigns/${campaign.id}`, {
            headers: getAuthHeaders()
          });
          console.log('📡 Retried campaign details status:', response.status);
        }
      }

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Campaign details loaded:', responseData);
        const details = responseData.campaign;
        selectedCampaign = details;
        productName = details.product_name;
        productDescription = details.product_description || '';

        // Map backend campaign style values to frontend values
        const campaignStyleMap = {
          'Professional': 'professional',
          'Creative': 'creative',
          'Minimalist': 'minimalist',
          'Bold & Edgy': 'bold',
          'Playful': 'playful'
        };
        campaignStyle = campaignStyleMap[details.campaign_style] || 'professional';
      } else {
        console.log('⚠️ Failed to load campaign details, using basic data');
        // Fallback to basic data
        productName = campaign.product_name;
        productDescription = campaign.product_description || '';

        // Map backend campaign style values to frontend values
        const campaignStyleMap = {
          'Professional': 'professional',
          'Creative': 'creative',
          'Minimalist': 'minimalist',
          'Bold & Edgy': 'bold',
          'Playful': 'playful'
        };
        campaignStyle = campaignStyleMap[campaign.campaign_style] || 'professional';
      }
    } catch (err) {
      console.error('💥 Failed to load campaign details:', err);
      // Fallback to basic data
      productName = campaign.product_name;
      productDescription = campaign.product_description || '';

      // Map backend campaign style values to frontend values
      const campaignStyleMap = {
        'Professional': 'professional',
        'Creative': 'creative',
        'Minimalist': 'minimalist',
        'Bold & Edgy': 'bold',
        'Playful': 'playful'
      };
      campaignStyle = campaignStyleMap[campaign.campaign_style] || 'professional';
    }

    console.log('📋 Campaign form populated:', {
      productName: productName,
      productDescription: productDescription,
      campaignStyle: campaignStyle
    });

    showCampaignSelection = false;
    console.log('🔄 Campaign selection hidden');
  }

  // Go back to campaign selection
  function backToCampaignSelection() {
    showCampaignSelection = true;
    selectedCampaign = null;
    productName = '';
    productDescription = '';
    campaignStyle = 'professional';
    generatedContent = null;
    generatedImages = [];
    error = '';
    selectedTagline = '';
    processedPrompt = '';
  }

  // Check URL parameters on mount
  onMount(() => {
    console.log('🚀 AIContent component mounted');
    const urlParams = new URLSearchParams(window.location.search);
    skipCampaignSelection = urlParams.get('skip') === 'true';

    console.log('🔍 URL parameters:', {
      skip: urlParams.get('skip'),
      skipCampaignSelection: skipCampaignSelection
    });

    if (skipCampaignSelection) {
      console.log('⏭️ Skipping campaign selection due to URL parameter');
      showCampaignSelection = false;
    }

    console.log('📊 Initial component state:', {
      showCampaignSelection: showCampaignSelection,
      selectedCampaign: selectedCampaign,
      generateImages: generateImages,
      imageType: imageType,
      contentType: contentType
    });
  });

  // Load campaigns when component mounts
  $: if ($auth.email) {
    loadCampaigns();
  }

  // Cooldown management
  function startCooldown(seconds = 30) {
    cooldownTime = seconds;
    if (cooldownInterval) clearInterval(cooldownInterval);

    cooldownInterval = setInterval(() => {
      cooldownTime--;
      if (cooldownTime <= 0) {
        clearInterval(cooldownInterval);
        cooldownInterval = null;
      }
    }, 1000);
  }

  // Cleanup interval on component destroy
  onDestroy(() => {
    if (cooldownInterval) clearInterval(cooldownInterval);
  });

  async function generateSlogans() {
    console.log('🚀 Starting generateSlogans function...');

    if (!selectedCampaign || !selectedCampaign.product_name) {
      error = 'Please select a valid campaign first';
      return;
    }

    isGenerating = true;
    error = '';

    try {
      const payload = {
        product_name: selectedCampaign?.product_name || '',
        product_description: selectedCampaign?.product_description || '',
        campaign_style: (selectedCampaign?.campaign_style || campaignStyle)
          .toLowerCase()
          .replace(' & ', '_')
          .replace(' ', '_'),
        target_audience: null // Optional field
      };

      if (selectedCampaign?.id) {
        payload.campaign_id = String(selectedCampaign.id);
      }

      console.log(
        '📤 Payload for slogan generation:',
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch('/api/ai/generate-slogans', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Slogans generated successfully:', result);

      generatedContent = result;
      showSloganGeneration = true;
      showCampaignSelection = false;

      // Reset slogan selection when generating new slogans
      selectedSloganIndex = -1;
      selectedTagline = '';
      savedSlogans.clear(); // Clear saved slogans when generating new ones
      savedSlogans = savedSlogans; // Trigger reactivity
      showImageGeneration = false;
      showImageTypeSelection = false;

      // Start cooldown after successful generation
      startCooldown(30);
    } catch (err) {
      console.error('💥 Slogan generation error:', err);
      error = 'Failed to generate slogans. Please try again.';
    } finally {
      isGenerating = false;
    }
  }

  async function generateImages() {
    console.log('🖼️ Starting generateImages function...');

    if (!selectedTagline) {
      error = 'Please select a slogan first';
      return;
    }

    if (!selectedCampaign || !selectedCampaign.product_name) {
      error = 'Please select a valid campaign first';
      return;
    }

    isGenerating = true;
    error = '';

    try {
      const payload = {
        product_name: selectedCampaign?.product_name || '',
        product_description: selectedCampaign?.product_description || '',
        campaign_style: (selectedCampaign?.campaign_style || campaignStyle)
          .toLowerCase()
          .replace(' & ', '_')
          .replace(' ', '_'),
        content_type: 'slogan',
        generate_images: true,
        image_type: imageType,
        selected_tagline: selectedTagline,
        product_type: selectedCampaign?.product_type || null
      };

      if (selectedCampaign?.id) {
        payload.campaign_id = String(selectedCampaign.id);
      }

      console.log(
        '📤 Payload for image generation:',
        JSON.stringify(payload, null, 2)
      );

      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Images generated successfully:', result);

      generatedImages = result.generated_images || [];
      savedImageIds = new Set();
      savedImages = new Set();
      processedPrompt = result.processed_prompt || '';
      showImageGeneration = true;
    } catch (err) {
      console.error('💥 Image generation error:', err);
      error = 'Failed to generate images. Please try again.';
    } finally {
      isGenerating = false;
    }
  }

  async function saveImageToCampaign(dataUrl, meta) {
    if (!selectedCampaign?.id) return;
    try {
      const res = await fetch(`/api/campaigns/${selectedCampaign.id}/images`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ data_url: dataUrl, source: 'generated', meta })
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);
      const out = await res.json();
      savedImageIds.add(out.file.id);
      savedImageIds = new Set(savedImageIds);
      // Track saved image by its data URL so we can update UI instantly
      if (typeof dataUrl === 'string') {
        savedImages.add(dataUrl);
        savedImages = new Set(savedImages);
      }
      // Update selectedCampaign.uploaded_files with latest from server
      if (out?.uploaded_files && selectedCampaign) {
        selectedCampaign.uploaded_files = out.uploaded_files;
      }
      console.log('💾 Image saved:', out.file);
      return true;
    } catch (e) {
      console.error('❌ Failed saving image:', e);
      return false;
    }
  }

  function generateImagesDirectly() {
    console.log('🖼️ Starting generateImagesDirectly function...');

    if (!selectedCampaign?.current_slogan) {
      error = 'No default slogan available for this campaign';
      return;
    }

    // Set the selected tagline to the campaign's current slogan
    selectedTagline = selectedCampaign.current_slogan;

    // Show image type selection instead of directly generating
    showImageTypeSelection = true;
    showImageGeneration = false;
  }


  async function generateImagesWithType() {
    console.log('🎨 Generating images with type:', imageType, 'for slogan:', selectedTagline);

    if (!selectedTagline) {
      error = 'No slogan selected for image generation';
      return;
    }

    // Hide the type selection and call the regular generateImages function
    showImageTypeSelection = false;
    await generateImages();
  }

  async function saveSloganToCampaign(sloganText) {
    console.log('💾 Auto-saving slogan to campaign:', sloganText);

    if (!selectedCampaign?.id) {
      console.error('❌ No campaign selected to save slogan to');
      return false;
    }

    try {
      const response = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          current_slogan: sloganText
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update the local campaign data
          selectedCampaign.current_slogan = sloganText;
          console.log('✅ Slogan auto-saved successfully to database');

          // Mark this slogan as saved
          savedSlogans.add(sloganText);
          savedSlogans = savedSlogans; // Trigger reactivity

          // Clear any previous errors
          error = '';

          console.log('🎉 Campaign updated with new slogan:', sloganText);
          return true;
        } else {
          throw new Error(result.error || 'Failed to save slogan');
        }
      } else {
        throw new Error(`Failed to save slogan: ${response.status}`);
      }
    } catch (err) {
      console.error('💥 Error auto-saving slogan:', err);
      console.warn('⚠️ Auto-save failed, but user can continue');
      return false;
    }
  }

  function generateImagesForSavedSlogan(sloganText) {
    console.log('🎨 Opening image type selection for saved slogan:', sloganText);
    selectedTagline = sloganText;
    showImageTypeSelection = true;
    showImageGeneration = false;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  }

  function resetForm() {
    console.log('🔄 Reset form called');

    productName = '';
    productDescription = '';
    targetAudience = '';
    campaignStyle = 'professional';
    contentType = 'slogan';
    imageType = 'product_mockup';
    generatedContent = null;
    generatedImages = [];
    error = '';
    selectedTagline = '';
    selectedSloganIndex = -1;
    savedSlogans.clear();
    savedSlogans = savedSlogans; // Trigger reactivity
    processedPrompt = '';
    selectedCampaign = null;
    showCampaignSelection = true;
    showSloganGeneration = false;
    showImageGeneration = false;
    showImageTypeSelection = false;
    isGenerating = false;

    // Clear cooldown
    if (cooldownInterval) {
      clearInterval(cooldownInterval);
      cooldownInterval = null;
    }
    cooldownTime = 0;

    console.log('✅ Form reset completed');
  }
</script>

<div class="min-h-screen bg-background py-8">
  <div class="container mx-auto px-4 max-w-6xl">
    <!-- Header -->
    <div class="text-center mb-8">
      <div
        class="w-20 h-20 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-6"
      >
        <Bot class="w-10 h-10 text-primary" />
      </div>
      <h1
        class="font-chillax text-3xl sm:text-4xl font-bold text-foreground mb-4"
      >
        AI Content Generation
      </h1>
      <p class="font-sans text-muted-foreground text-lg max-w-2xl mx-auto">
        Generate compelling marketing content with the power of AI. Create
        slogans, ad copy, headlines, and more.
      </p>
    </div>

    <div class="flex flex-col gap-8">
      <!-- Campaign Selection or Input Form -->
      <Card class="h-full">
        <CardHeader>
          <CardTitle
            class="font-chillax text-xl text-foreground flex items-center gap-2"
          >
            <Sparkles class="w-5 h-5 text-primary" />
            {showCampaignSelection ? 'Select Campaign' : 'Content Brief'}
          </CardTitle>
          <CardDescription class="font-sans text-muted-foreground">
            {showCampaignSelection
              ? 'Choose an existing campaign to generate content for'
              : skipCampaignSelection && !selectedCampaign
                ? 'Create new content or select an existing campaign'
                : "Tell us about your product and we'll generate amazing content"}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6">
          {#if showCampaignSelection}
            <!-- Campaign Selection -->
            <div class="space-y-4">
              {#if isLoadingCampaigns}
                <div class="flex items-center justify-center py-8">
                  <div
                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
                  ></div>
                  <span class="ml-2 text-muted-foreground"
                    >Loading campaigns...</span
                  >
                </div>
              {:else if existingCampaigns.length === 0}
                <div class="text-center py-8">
                  <div
                    class="w-16 h-16 bg-gradient-to-br from-muted/30 to-muted/50 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Target class="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 class="text-lg font-semibold text-foreground mb-2">
                    No campaigns found
                  </h3>
                  <p class="text-muted-foreground mb-4">
                    You don't have any campaigns yet. Create a campaign first to
                    generate AI content.
                  </p>
                  <Button onclick={() => (location.pathname = '/new')} class="">
                    Create New Campaign
                  </Button>
                </div>
              {:else}
                <div class="space-y-4">
                  <div class="text-center">
                    <h3 class="text-lg font-semibold text-foreground mb-2">
                      Choose Your Campaign
                    </h3>
                    <p class="text-sm text-muted-foreground">
                      Select an existing campaign to generate AI-powered content
                    </p>
                  </div>

                  <div class="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                    {#each existingCampaigns as campaign}
                      <Card
                        class="cursor-pointer transition-all duration-200 border-2 {selectedCampaign?.id ===
                        campaign.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'} p-4"
                        onclick={() => selectCampaign(campaign)}
                      >
                        <div class="flex items-start justify-between gap-4">
                          <!-- Campaign Info -->
                          <div class="flex-1 space-y-2">
                            <div class="flex items-center gap-2">
                              <h4
                                class="font-semibold text-foreground text-base"
                              >
                                {campaign.product_name}
                              </h4>
                              {#if selectedCampaign?.id === campaign.id}
                                <Badge variant="default" class="text-xs">
                                  Selected
                                </Badge>
                              {/if}
                            </div>
                          </div>

                          <!-- Date -->
                          <div class="text-right">
                            <Badge variant="outline" class="text-xs">
                              {new Date(
                                campaign.created_at
                              ).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <!-- Selected Campaign Header -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onclick={backToCampaignSelection}
                  class=""
                >
                  ← Back to Campaigns
                </Button>
                {#if selectedCampaign}
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-sm font-medium text-foreground">
                      Campaign Selected
                    </span>
                  </div>
                {/if}
              </div>

              <!-- Campaign Info Card -->
              {#if selectedCampaign}
                <Card class="border-primary/20 bg-primary/5">
                  <CardContent class="px-6">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1 space-y-3">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center"
                          >
                            <Target class="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 class="font-semibold text-foreground text-lg">
                              {selectedCampaign.product_name}
                            </h3>
                            {#if selectedCampaign.current_slogan}
                              <p
                                class="flex items-start justify-between font-medium text-foreground text-right italic"
                              >
                                "{selectedCampaign.current_slogan}"
                              </p>
                            {/if}
                          </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4 text-sm">
                          <div class="space-y-2">
                            <div class="flex items-center justify-between">
                              <span class="text-muted-foreground">Budget:</span>
                              <span class="font-medium text-foreground"
                                >₹{selectedCampaign.budget}</span
                              >
                            </div>
                            <div class="flex items-center justify-between">
                              <span class="text-muted-foreground">Created:</span
                              >
                              <span class="font-medium text-foreground">
                                {new Date(
                                  selectedCampaign.created_at
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div class="space-y-2">
                            <div class="flex items-center justify-between">
                              <span class="text-muted-foreground">Type:</span>
                              <span class="font-medium text-foreground">
                                {selectedCampaign.product_type
                                  ? selectedCampaign.product_type
                                      .charAt(0)
                                      .toUpperCase() +
                                    selectedCampaign.product_type.slice(1)
                                  : ''}
                              </span>
                            </div>
                            <div class="flex items-center justify-between">
                              <span class="text-muted-foreground">Style:</span>
                              <span class="font-medium text-foreground">
                                {selectedCampaign.campaign_style
                                  ? selectedCampaign.campaign_style
                                      .charAt(0)
                                      .toUpperCase() +
                                    selectedCampaign.campaign_style.slice(1)
                                  : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              {/if}
            </div>

            <!-- Form Fields removed: only existing campaigns are used -->
          {/if}

          {#if selectedCampaign}
            {#if error}
              <div
                class="p-3 bg-destructive/10 border border-destructive/20 rounded-md"
              >
                <p class="text-sm text-destructive">{error}</p>
              </div>
            {/if}

            <!-- Initial Action Buttons -->
            {#if !showSloganGeneration}
              <div class="pt-6 border-t border-border">
                <div class="flex flex-col sm:flex-row gap-3">
                  <Button
                    onclick={generateSlogans}
                    disabled={isGenerating || cooldownTime > 0}
                    class="flex-1 h-12 text-base font-medium"
                    size=""
                  >
                    {#if isGenerating}
                      <RefreshCw class="w-5 h-5 mr-2 animate-spin" />
                      Generating Slogans...
                    {:else if cooldownTime > 0}
                      <RefreshCw class="w-5 h-5 mr-2" />
                      Wait {cooldownTime}s
                    {:else}
                      <MessageSquare class="w-5 h-5 mr-2" />
                      Generate 5 Slogans
                    {/if}
                  </Button>

                  <Button
                    onclick={generateImagesDirectly}
                    disabled={isGenerating || !selectedCampaign?.current_slogan}
                    variant="outline"
                    class="flex-1 h-12 text-base font-medium"
                    size=""
                  >
                    <Image class="w-5 h-5 mr-2" />
                    Generate Images
                  </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-2 text-center">
                  {#if cooldownTime > 0}
                    <!-- During cooldown, avoid repeating the message since the button shows the timer -->
                  {:else if selectedCampaign?.current_slogan}
                    Generate slogans or create images with your existing slogan:
                    "{selectedCampaign.current_slogan}"
                  {:else}
                    Generate 5 slogan options first, or add a default slogan to
                    your campaign to generate images directly
                  {/if}
                </p>
              </div>
            {/if}
          {/if}
        </CardContent>
      </Card>

      <!-- Slogan Generation Results -->
      {#if showSloganGeneration && generatedContent}
        <Card class="h-full">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="font-chillax text-xl text-foreground flex items-center gap-2"
                >
                  <MessageSquare class="w-5 h-5 text-primary" />
                  Generated Slogans
                </CardTitle>
                <CardDescription class="font-sans text-muted-foreground">
                  Choose your favorite slogan for {selectedCampaign?.product_name ||
                    'your campaign'}
                </CardDescription>
              </div>
              <Button
                onclick={generateSlogans}
                disabled={isGenerating || cooldownTime > 0}
                variant="outline"
                size="sm"
                class=""
              >
                {#if isGenerating}
                  <RefreshCw class="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                {:else if cooldownTime > 0}
                  <RefreshCw class="w-4 h-4 mr-2" />
                  Wait {cooldownTime}s
                {:else}
                  <RefreshCw class="w-4 h-4 mr-2" />
                  Refresh Slogans
                {/if}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              {#each generatedContent.generated_content.slogans as slogan, index}
                <Card
                  class="border-border/50 hover:border-primary/30 transition-colors"
                >
                  <CardContent class="px-4">
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <p
                          class="font-sans text-foreground font-medium text-lg"
                        >
                          "{slogan.text}"
                        </p>
                      </div>
                      <div class="flex flex-row gap-2 min-w-fit">
                        {#if savedSlogans.has(slogan.text)}
                          <!-- Saved state: Show saved indicator and generate images button -->
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled
                            class=""
                          >
                            <Copy class="w-4 h-4 mr-2" />
                            Saved
                          </Button>
                          <Button
                            onclick={() => generateImagesForSavedSlogan(slogan.text)}
                            disabled={isGenerating}
                            size="sm"
                            class=""
                          >
                            <Image class="w-4 h-4 mr-2" />
                            Generate Images
                          </Button>
                        {:else}
                          <!-- Unsaved state: Show save button only -->
                          <Button
                            onclick={() => saveSloganToCampaign(slogan.text)}
                            variant="outline"
                            size="sm"
                            class=""
                          >
                            <Copy class="w-4 h-4 mr-2" />
                            Save Slogan
                          </Button>
                        {/if}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Image Type Selection -->
      {#if showImageTypeSelection && selectedTagline}
        <Card class="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle
              class="font-chillax text-xl text-foreground flex items-center gap-2"
            >
              <Image class="w-5 h-5 text-primary" />
              Select Image Type
            </CardTitle>
            <CardDescription class="font-sans text-muted-foreground">
              Choose the type of image to generate for: "{selectedTagline}"
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Image Type Selection -->
            <div class="space-y-4">
              <Label for="imageTypeSelect" class="font-sans text-foreground font-medium text-base">
                Image Type
              </Label>
              <select
                id="imageTypeSelect"
                bind:value={imageType}
                class="w-full px-4 py-3 border border-input bg-background rounded-lg text-base ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {#each imageTypes as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
              <div class="p-4 bg-muted/30 rounded-lg border border-border">
                <p class="text-sm text-muted-foreground">
                  {#if imageType === 'product_mockup'}
                    <strong>Product Mockup:</strong> Professional product photography with studio lighting, perfect for showcasing your product in marketing materials.
                  {:else if imageType === 'logo'}
                    <strong>Logo:</strong> Clean vector-style logo design with modern typography, ideal for brand identity and corporate materials.
                  {:else if imageType === 'illustration'}
                    <strong>Illustration:</strong> Creative marketing illustrations and graphics, great for digital campaigns and promotional content.
                  {/if}
                </p>
              </div>
            </div>

            <!-- Generate Button -->
            <div class="flex flex-col sm:flex-row gap-3">
              <Button
                onclick={generateImagesWithType}
                disabled={isGenerating}
                class="flex-1 h-12 text-base font-medium"
                size=""
              >
                {#if isGenerating}
                  <RefreshCw class="w-5 h-5 mr-2 animate-spin" />
                  Generating Images...
                {:else}
                  <Image class="w-5 h-5 mr-2" />
                  Generate {imageTypes.find((t) => t.value === imageType)?.label}
                {/if}
              </Button>
              <Button
                onclick={() => {
                  showImageTypeSelection = false;
                  selectedTagline = '';
                  selectedSloganIndex = -1;
                }}
                variant="outline"
                class="h-12 text-base font-medium px-2"
                size=""
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      {/if}

      <!-- Image Generation Results -->
      {#if showImageGeneration && generatedImages && generatedImages.length > 0}
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div>
                <CardTitle
                  class="font-chillax text-xl text-foreground flex items-center gap-2"
                >
                  <Image class="w-5 h-5 text-primary" />
                  Generated Images
                </CardTitle>
                <CardDescription class="font-sans text-muted-foreground">
                  AI-generated images for: "{selectedTagline}"
                </CardDescription>
              </div>
              <!-- Image Type Selection -->
              <div class="flex items-center gap-2">
                <Label for="imageType" class="text-sm font-medium">Type:</Label>
                <select
                  id="imageType"
                  bind:value={imageType}
                  class="px-2 py-1 border border-input bg-background rounded text-sm"
                >
                  {#each imageTypes as type}
                    <option value={type.value}>{type.label}</option>
                  {/each}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent class="space-y-6">
            <!-- Enhanced Prompt Display -->
            {#if processedPrompt}
              <div class="p-4 bg-muted/30 rounded-lg border border-border">
                <div class="flex items-start justify-between gap-3 mb-2">
                  <h4 class="font-sans font-medium text-foreground text-sm">
                    AI-Enhanced Prompt ({processedPrompt.length} characters)
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onclick={() => copyToClipboard(processedPrompt)}
                    class="h-6 w-6 p-0"
                  >
                    <Copy class="w-3 h-3" />
                  </Button>
                </div>
                <div class="max-h-32 overflow-y-auto">
                  <p
                    class="font-mono text-xs text-muted-foreground leading-relaxed"
                  >
                    {processedPrompt}
                  </p>
                </div>
              </div>
            {/if}

            <!-- Generated Images Grid -->
            <div class="grid gap-4">
              {#each generatedImages as imageData, index}
                <div class="space-y-2">
                  <div class="relative group">
                    <img
                      src={imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`}
                      alt="Generated {imageType}"
                      class="w-full h-[80vh] object-contain rounded-lg border border-border"
                      onload={() => {
                        console.log(
                          `🖼️ Image ${index + 1} loaded successfully`
                        );
                        console.log(
                          `📏 Image ${index + 1} data length:`,
                          imageData?.length || 0
                        );
                      }}
                      onerror={(event) => {
                        console.error(`❌ Failed to load image ${index + 1}`);
                        console.error(
                          `📏 Image ${index + 1} data length:`,
                          imageData?.length || 0
                        );
                        const img = event.target;
                        if (img && img instanceof HTMLImageElement) {
                          img.src = `data:image/svg+xml;base64,${imageData}`;
                        }
                      }}
                    />
                    <div
                      class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                    >
                      <Button
                        variant="secondary"
                        size="sm"
                        onclick={() => {
                          console.log(`💾 Downloading image ${index + 1}`);
                          const link = document.createElement('a');
                          link.href = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
                          link.download = `${selectedCampaign?.product_name || 'image'}_${imageType}_${index + 1}.png`;
                          link.click();
                        }}
                        class=""
                      >
                        <Copy class="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div class="flex gap-2 justify-center">
                    {#if savedImages.has(imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`)}
                      <Button size="sm" variant="secondary" disabled class="">
                        Saved
                      </Button>
                    {:else}
                      <Button size="sm" class="" onclick={() => saveImageToCampaign(imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`, null)}>
                        Save to campaign
                      </Button>
                    {/if}
                  </div>
                  <p class="text-xs text-muted-foreground text-center">
                    {imageTypes.find((t) => t.value === imageType)?.label} #{index +
                      1}
                  </p>
                </div>
              {/each}
            </div>
          </CardContent>
        </Card>
      {/if}
    </div>
  </div>
</div>
