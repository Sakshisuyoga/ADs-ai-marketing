<script>
  import { auth, getAuthHeaders } from '$lib/stores';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '$ui/card';
  import { Button } from '$ui/button';
  import { Badge } from '$ui/badge';
  import {
    Plus,
    Bot,
    BarChart3,
    TrendingUp,
    Target,
    DollarSign,
    Users
  } from 'lucide-svelte';

  let total = 0,
    active = 0,
    budget = 0,
    ctr = '0.00%';
  let campaigns = [];
  let recentImages = [];
  function firstCampaignImage(c) {
    let files = c?.uploaded_files;
    if (typeof files === 'string') {
      try { files = JSON.parse(files); } catch { files = []; }
    }
    files = Array.isArray(files) ? files : [];
    // Prefer most recent image by created_at
    const images = files
      .filter((f) => f && f.type === 'image' && typeof f.data_url === 'string')
      .sort((a, b) => (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime()));
    const img = images[0];
    return img?.data_url || null;
  }

  function getCampaignImages(c, max = 4) {
    let files = c?.uploaded_files;
    if (typeof files === 'string') {
      try { files = JSON.parse(files); } catch { files = []; }
    }
    files = Array.isArray(files) ? files : [];
    return files
      .filter((f) => f && f.type === 'image' && typeof f.data_url === 'string')
      .sort((a, b) => (new Date(b.created_at || 0).getTime()) - (new Date(a.created_at || 0).getTime()))
      .slice(0, max)
      .map((f) => f.data_url);
  }

  async function deleteImage(campaignId, fileId) {
    try {
      let res = await fetch(`/api/campaigns/${campaignId}/images/${fileId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (res.status === 401) {
        // Try silent re-auth using stored email
        const email = $auth.email || 'john.doe@test.com';
        try { await fetch('/api/auth/demo-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); } catch {}
        res = await fetch(`/api/campaigns/${campaignId}/images/${fileId}`, { method: 'DELETE', headers: getAuthHeaders() });
      }
      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
      // Optimistic: update local state
      campaigns = campaigns.map((c) => {
        if (c.id !== campaignId) return c;
        let files = c.uploaded_files;
        if (typeof files === 'string') {
          try { files = JSON.parse(files); } catch { files = []; }
        }
        files = Array.isArray(files) ? files : [];
        const nextFiles = files.filter((f) => String(f?.id) !== String(fileId));
        return { ...c, uploaded_files: nextFiles };
      });
    } catch (e) {
      console.error('Delete failed', e);
    }
  }

  function downloadDataUrl(dataUrl, name) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = name || 'image.png';
    link.click();
  }
  let expandedCampaignIds = new Set();
  function toggleExpand(c) {
    if (expandedCampaignIds.has(c.id)) {
      expandedCampaignIds.delete(c.id);
    } else {
      expandedCampaignIds.add(c.id);
    }
    expandedCampaignIds = new Set(expandedCampaignIds);
  }

  async function loadData() {
    // Use auth email if available, otherwise use demo email for sample data
    const email = $auth.email || 'john.doe@test.com';
    try {
      const analytics = await fetch(
        `/api/campaigns/analytics?email=${encodeURIComponent(email)}`
      ).then((r) => r.json());
      total = analytics.total || 0;
      // Count campaigns as active if they exist (since backend doesn't have status yet)
      active = analytics.total || 0;
      budget = analytics.budget || 0;
      ctr = (analytics.ctr ?? 0).toFixed
        ? `${analytics.ctr.toFixed(2)}%`
        : `${Number(analytics.ctr || 0).toFixed(2)}%`;
    } catch {}
    try {
      campaigns = await fetch(
        `/api/campaigns/by-email?email=${encodeURIComponent(email)}`
      ).then((r) => r.json());
    } catch {}
  }

  $: $auth.email, loadData();

  // Build recent images gallery from campaigns' uploaded_files
  $: recentImages = Array.isArray(campaigns)
    ? campaigns
        .flatMap((c) =>
          Array.isArray(c?.uploaded_files)
            ? c.uploaded_files
                .filter((f) => f && f.type === 'image' && typeof f.data_url === 'string')
                .map((f) => ({
                  campaignId: c.id,
                  productName: c.product_name,
                  createdAt: f.created_at || c.created_at,
                  dataUrl: f.data_url,
                  source: f.source || 'generated'
                }))
            : []
        )
        .sort((a, b) => (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime()))
        .slice(0, 8)
    : [];

  function goNew() {
    location.pathname = '/new';
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-cream via-white to-cream">
  <div class="container mx-auto px-4 py-8 max-w-7xl">
    <!-- Header Section -->
    <div class="mb-8">
      <div
        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            class="font-chillax text-3xl sm:text-4xl font-bold text-darkOlive"
          >
            Dashboard
          </h1>
          <p class="text-darkOlive/70 mt-1">
            Welcome to your AI Marketing dashboard
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Button class="" onclick={goNew}>+ New Campaign</Button>
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card class="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader class="pb-3">
          <CardTitle class="text-sm text-darkOlive/70"
            >Total Campaigns</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-darkOlive">{total}</div>
          <p class="text-xs text-darkOlive/60 mt-1">All time campaigns</p>
        </CardContent>
      </Card>

      <Card class="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader class="pb-3">
          <CardTitle class="text-sm text-darkOlive/70"
            >Active Campaigns</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-olive">{active}</div>
          <p class="text-xs text-darkOlive/60 mt-1">Currently running</p>
        </CardContent>
      </Card>

      <Card class="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader class="pb-3">
          <CardTitle class="text-sm text-darkOlive/70"
            >Total Budget</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-ochre">₹{budget}</div>
          <p class="text-xs text-darkOlive/60 mt-1">Total investment</p>
        </CardContent>
      </Card>

      <Card class="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardHeader class="pb-3">
          <CardTitle class="text-sm text-darkOlive/70"
            >Avg. CTR</CardTitle
          >
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-burntSienna">{ctr}</div>
          <p class="text-xs text-darkOlive/60 mt-1">Click-through rate</p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-darkOlive mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          class="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer"
          onclick={goNew}
        >
          <CardHeader>
            <CardTitle class="text-darkOlive flex items-center gap-2">
              <div
                class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center"
              >
                <Plus class="w-4 h-4 text-white" />
              </div>
              Create Campaign
            </CardTitle>
            <CardDescription
              >Start a new marketing campaign with AI assistance</CardDescription
            >
          </CardHeader>
        </Card>

        <Card
          class="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer"
          onclick={() => (location.pathname = '/ai-content')}
        >
          <CardHeader>
            <CardTitle class="text-darkOlive flex items-center gap-2">
              <div
                class="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center"
              >
                <Bot class="w-4 h-4 text-white" />
              </div>
              AI Content Generation
            </CardTitle>
            <CardDescription
              >Generate ad copy and images with AI</CardDescription
            >
          </CardHeader>
        </Card>

        <Card
          class="border-0 shadow-sm bg-white/80 backdrop-blur-sm hover:shadow-md transition-shadow cursor-pointer"
          onclick={() => alert('Coming soon')}
        >
          <CardHeader>
            <CardTitle class="text-darkOlive flex items-center gap-2">
              <div
                class="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center"
              >
                <BarChart3 class="w-4 h-4 text-white" />
              </div>
              Performance Prediction
            </CardTitle>
            <CardDescription
              >Predict campaign performance with ML</CardDescription
            >
          </CardHeader>
        </Card>
      </div>
    </div>

    <!-- Recent Campaigns -->
    <div>
      <h2 class="text-xl font-semibold text-darkOlive mb-4">
        Recent Campaigns
      </h2>
      <Card class="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent class="p-6">
          {#if campaigns.length === 0}
            <div class="text-center py-8">
              <div
                class="w-16 h-16 bg-gradient-to-br from-olive/20 to-ochre/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <TrendingUp class="w-8 h-8 text-olive" />
              </div>
              <h3 class="text-lg font-semibold text-darkOlive mb-2">
                No campaigns yet
              </h3>
              <p class="text-darkOlive/70 mb-4">
                Get started by creating your first campaign.
              </p>
              <Button class="" onclick={goNew}>
                Create Your First Campaign
              </Button>
            </div>
          {:else}
            <div class="space-y-3">
              {#each campaigns as c}
                <div
                  class="p-4 bg-white/50 rounded-lg border border-white/50 hover:bg-white/70 transition-colors"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex-1 flex items-center gap-3">
                    {#if firstCampaignImage(c)}
                      <img
                        src={firstCampaignImage(c)}
                        alt={c.product_name}
                        class="w-12 h-12 rounded-md object-cover border border-white/50"
                      />
                    {/if}
                    <div>
                      <h4 class="font-semibold text-darkOlive">
                        {c.product_name}
                      </h4>
                      <p class="text-sm text-darkOlive/70">
                        {c.product_type} · {c.campaign_style}
                      </p>
                    </div>
                    </div>
                    <div class="text-right">
                    <div class="font-semibold text-ochre">₹{c.budget}</div>
                    <Badge
                      variant="outline"
                      class="border-olive text-olive text-xs"
                    >
                      Active
                    </Badge>
                    </div>
                  </div>
                  {#if getCampaignImages(c).length > 0}
                    <div class="mt-3 grid grid-cols-4 gap-2">
                      {#each getCampaignImages(c) as img, i}
                        <div class="relative group">
                          <img src={img} alt="saved" class="w-full object-contain rounded border border-white/50" />
                          <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-2">
                            <button class="text-white text-xs px-2 py-1 bg-black/50 rounded" onclick={() => downloadDataUrl(img, `${c.product_name}_${i+1}.png`)}>Download</button>
                            <!-- Find file id by matching data_url -->
                            {#if Array.isArray(c.uploaded_files)}
                              {#each c.uploaded_files as f}
                                {#if f?.data_url === img}
                                  <button class="text-white text-xs px-2 py-1 bg-red-600/80 rounded" onclick={() => deleteImage(c.id, f.id)}>Delete</button>
                                {/if}
                              {/each}
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                    <div class="mt-2 text-right">
                      <button class="text-xs text-olive underline" onclick={() => toggleExpand(c)}>
                        {expandedCampaignIds.has(c.id) ? 'Collapse' : 'View all'}
                      </button>
                    </div>
                  {/if}
                </div>
                {#if expandedCampaignIds.has(c.id)}
                  <div class="mt-3">
                    {#if Array.isArray(c.uploaded_files) && c.uploaded_files.length > 0}
                      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {#each c.uploaded_files as f, idx}
                          {#if f?.type === 'image' && typeof f.data_url === 'string'}
                            <div class="space-y-1">
                              <img src={f.data_url} alt="img" class="w-full object-contain rounded border border-white/50" />
                              <div class="flex items-center justify-between text-xs">
                                <button class="px-2 py-1 bg-black/70 text-white rounded" onclick={() => downloadDataUrl(f.data_url, `${c.product_name}_${idx+1}.png`)}>Download</button>
                                <button class="px-2 py-1 bg-red-600 text-white rounded" onclick={() => deleteImage(c.id, f.id)}>Delete</button>
                              </div>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {:else}
                      <p class="text-sm text-darkOlive/70">No images saved.</p>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>

  </div>
</div>
