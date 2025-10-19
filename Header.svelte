<script>
  import { Button } from '$ui/button';
  import { auth } from '$lib/stores';

  let { navigate, ...restProps } = $props();

  function handleSignOut() {
    // Import signOut function dynamically to avoid circular dependency
    import('$lib/stores').then(({ signOut }) => {
      signOut();
      navigate('/');
    });
  }
</script>

<header
  class="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60"
>
  <div class="container flex h-16 items-center justify-between px-4 mx-auto">
    <!-- Logo/Brand -->
    <div class="flex items-center space-x-2">
      <button
        onclick={() => navigate('/')}
        class="flex items-center space-x-2 hover:opacity-80 transition-opacity"
      >
        <span class="font-chillax font-bold text-xl text-foreground"
          >ADFUSION</span
        >
      </button>
    </div>

    <!-- Navigation -->
    <nav class="hidden md:flex items-center space-x-6">
      <Button onclick={() => navigate('/')} class="" variant="link">
        Home
      </Button>
      {#if $auth.token}
        <Button onclick={() => navigate('/dashboard')} class="" variant="link">
          Dashboard
        </Button>
        <Button onclick={() => navigate('/new')} class="" variant="link">
          New Campaign
        </Button>
      {/if}
    </nav>

    <!-- Auth Actions -->
    <div class="flex items-center space-x-3">
      {#if $auth.token}
        <div class="flex items-center space-x-3">
          <span class="text-sm text-muted-foreground"
            >Welcome, {$auth.name || 'User'}</span
          >
          <Button class="" variant="outline" size="sm" onclick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      {:else}
        <Button
          class=""
          variant="outline"
          size="sm"
          onclick={() => navigate('/signin')}
        >
          Sign In
        </Button>
        <Button class="" size="sm" onclick={() => navigate('/new')}>
          Get Started
        </Button>
      {/if}
    </div>
  </div>
</header>
