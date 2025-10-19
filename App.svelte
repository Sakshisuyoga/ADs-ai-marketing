<script>
  import './app.css';
  import { onMount } from 'svelte';
  import { auth, loadAuthFromStorage, signOut } from '$lib/stores';
  import SignIn from '$pages/SignIn.svelte';
  import Dashboard from '$pages/Dashboard.svelte';
  import NewCampaign from '$pages/NewCampaign.svelte';
  import AIContent from '$pages/AIContent.svelte';
  import AdminDB from '$pages/AdminDB.svelte';
  import Header from '$lib/components/shared/Header.svelte';
  import Landing from '$pages/Landing.svelte';

  let route = '/';

  function navigate(path) {
    route = path;
    history.pushState({}, '', path);
  }

  onMount(() => {
    loadAuthFromStorage();

    const updateRoute = () => (route = location.pathname + location.search);

    updateRoute();
    window.addEventListener('popstate', updateRoute);
    return () => window.removeEventListener('popstate', updateRoute);
  });

  $: current = route;
  $: currentPath = route.split('?')[0]; // Extract path without query params
</script>

<Header {navigate} />

{#if currentPath === '/signin'}
  <SignIn on:signed-in={() => navigate('/dashboard')} />
{:else if currentPath === '/dashboard'}
  {#if $auth.token}
    <Dashboard />
  {:else}
    <SignIn on:signed-in={() => navigate('/dashboard')} />
  {/if}
{:else if currentPath === '/new'}
  {#if $auth.token}
    <NewCampaign on:created={() => navigate('/dashboard')} />
  {:else}
    <SignIn on:signed-in={() => navigate('/new')} />
  {/if}
{:else if currentPath === '/ai-content'}
  {#if $auth.token}
    <AIContent />
  {:else}
    <SignIn on:signed-in={() => navigate('/ai-content')} />
  {/if}
{:else if currentPath === '/db'}
  {#if $auth.token}
    <AdminDB />
  {:else}
    <SignIn on:signed-in={() => navigate('/db')} />
  {/if}
{:else}
  <Landing />
{/if}

<style></style>
