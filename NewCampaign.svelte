<script>
  import { createEventDispatcher } from 'svelte';
  import { auth, getAuthHeaders } from '../lib/stores';
  import { Button } from '$ui/button';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '$ui/card';
  import { Input } from '$ui/input';
  import { Label } from '$ui/label';
  import { Textarea } from '$ui/textarea';
  import { Plus } from 'lucide-svelte';

  const dispatch = createEventDispatcher();

  let productName = '';
  let productType = '';
  let campaignStyle = '';
  let budget = 0;
  let slogan = '';
  let description = '';

  async function submit(e) {
    e.preventDefault();

    // Map frontend values to backend expected values
    const productTypeMap = {
      'physical': 'Physical Product',
      'digital': 'Digital Product',
      'service': 'Service',
      'saas': 'SaaS/Software',
      'other': 'Other'
    };

    const campaignStyleMap = {
      'professional': 'Professional',
      'creative': 'Creative',
      'minimalist': 'Minimalist',
      'bold': 'Bold & Edgy',
      'playful': 'Playful'
    };

    const payload = {
      product_name: productName,
      product_type: productTypeMap[productType] || productType,
      campaign_style: campaignStyleMap[campaignStyle] || campaignStyle,
      budget: Number(budget),
      product_description: description,
      current_slogan: slogan || null
    };

    console.log('Submitting campaign:', payload);

    try {
      const res = await fetch('/api/campaigns/create', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Error:', errorText);
        throw new Error(`API Error: ${res.status} - ${errorText}`);
      }

      const result = await res.json();
      console.log('Campaign created successfully:', result);
      dispatch('created');
    } catch (err) {
      console.error('Full error:', err);
      alert(`Failed to create campaign: ${err.message}`);
    }
  }
</script>

<div
  class="min-h-screen bg-background flex items-center justify-center px-4 py-8"
>
  <Card class="w-full max-w-2xl">
    <CardHeader class="text-center">
      <div
        class="w-16 h-16 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
      >
        <Plus class="w-8 h-8 text-primary" />
      </div>
      <CardTitle class="font-chillax text-2xl text-foreground"
        >Create New Campaign</CardTitle
      >
      <CardDescription class="font-sans text-muted-foreground">
        Set up your AI-powered marketing campaign
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={submit} class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <Label for="productName" class="font-sans text-foreground"
              >Product/Service Name</Label
            >
            <Input
              class=""
              id="productName"
              type="text"
              bind:value={productName}
              required
              placeholder="Enter product or service name"
            />
          </div>

          <div class="space-y-2">
            <Label for="productType" class="font-sans text-foreground"
              >Product Type</Label
            >
            <select
              id="productType"
              bind:value={productType}
              required
              class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select product type</option>
              <option value="physical">Physical Product</option>
              <option value="digital">Digital Product</option>
              <option value="service">Service</option>
              <option value="saas">SaaS/Software</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-2">
            <Label for="campaignStyle" class="font-sans text-foreground"
              >Campaign Style</Label
            >
            <select
              id="campaignStyle"
              bind:value={campaignStyle}
              required
              class="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">Select campaign style</option>
              <option value="professional">Professional</option>
              <option value="creative">Creative</option>
              <option value="minimalist">Minimalist</option>
              <option value="bold">Bold & Edgy</option>
              <option value="playful">Playful</option>
            </select>
          </div>

          <div class="space-y-2">
            <Label
              for="budget"
              class="font-sans text-foreground flex items-center gap-2"
            >
              Budget (₹)
            </Label>
            <Input
              id="budget"
              type="number"
              bind:value={budget}
              min="0"
              step="100"
              required
              placeholder="Enter budget in rupees"
              class=""
            />
          </div>
        </div>

        <div class="space-y-2">
          <Label for="slogan" class="font-sans text-foreground"
            >Current Slogan (optional)</Label
          >
          <Input
            id="slogan"
            type="text"
            bind:value={slogan}
            placeholder="Enter your current slogan"
            class=""
          />
        </div>

        <div class="space-y-2">
          <Label for="description" class="font-sans text-foreground"
            >Product Description</Label
          >
          <Textarea
            class=""
            id="description"
            bind:value={description}
            rows="4"
            required
            placeholder="Describe your product or service in detail"
          />
        </div>

        <div class="flex flex-col sm:flex-row gap-4 pt-4">
          <Button type="submit" class="flex-1" size="lg">
            <Plus class="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
