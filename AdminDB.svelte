<script>
  import { onMount } from 'svelte';
  import { Button } from '$ui/button';
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '$ui/card';

  let tables = [];
  let selected = '';
  let columns = [];
  let rows = [];
  let limit = 50;
  let offset = 0;
  let loading = false;
  let error = '';

  function truncateText(text, max = 200) {
    if (typeof text !== 'string') return text;
    if (text.length <= max) return text;
    return text.slice(0, max) + '…';
  }

  async function fetchTables() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/db/tables');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load tables');
      tables = data.tables || [];
      if (!selected && tables.length) {
        selected = tables[0];
        await fetchTable(selected);
      }
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function fetchTable(name) {
    if (!name) return;
    loading = true;
    error = '';
    try {
      // columns
      const colsRes = await fetch(`/api/db/table/${encodeURIComponent(name)}/columns`);
      const cols = await colsRes.json();
      if (!colsRes.ok) throw new Error(cols.message || 'Failed to load columns');
      columns = cols.columns || [];

      // rows
      const rowsRes = await fetch(`/api/db/table/${encodeURIComponent(name)}?limit=${limit}&offset=${offset}`);
      const body = await rowsRes.json();
      if (!rowsRes.ok) throw new Error(body.message || 'Failed to load rows');
      rows = body.rows || [];
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  function setTable(name) {
    selected = name;
    offset = 0;
    fetchTable(name);
  }

  function nextPage() {
    offset += limit;
    fetchTable(selected);
  }

  function prevPage() {
    offset = Math.max(0, offset - limit);
    fetchTable(selected);
  }

  onMount(fetchTables);
</script>

<div class="min-h-screen bg-background py-8">
  <div class="container mx-auto px-4 max-w-7xl">
    <div class="mb-6">
      <h1 class="font-chillax text-3xl font-bold">Database Browser</h1>
      <p class="text-muted-foreground">View tables and inspect rows.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card class="md:col-span-1">
        <CardHeader>
          <CardTitle class="text-base">Tables</CardTitle>
          <CardDescription>Click to view rows</CardDescription>
        </CardHeader>
        <CardContent class="space-y-2">
          {#if loading && tables.length === 0}
            <p class="text-sm text-muted-foreground">Loading...</p>
          {/if}
          {#each tables as t}
            <Button class="w-full justify-start" size="sm" variant={t === selected ? 'secondary' : 'outline'} onclick={() => setTable(t)}>
              {t}
            </Button>
          {/each}
        </CardContent>
      </Card>

      <Card class="md:col-span-3">
        <CardHeader>
          <div class="flex items-center justify-between">
            <div>
              <CardTitle class="text-base">{selected || 'Select a table'}</CardTitle>
              <CardDescription>{rows.length} rows shown</CardDescription>
            </div>
            <div class="flex items-center gap-2">
              <Button class="" size="sm" variant="outline" onclick={prevPage} disabled={offset === 0 || loading}>Prev</Button>
              <Button class="" size="sm" variant="outline" onclick={nextPage} disabled={loading}>Next</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {#if error}
            <div class="p-3 bg-destructive/10 border border-destructive/20 rounded">
              <p class="text-sm text-destructive">{error}</p>
            </div>
          {:else if loading && rows.length === 0}
            <p class="text-sm text-muted-foreground">Loading...</p>
          {:else if !selected}
            <p class="text-sm text-muted-foreground">Select a table on the left.</p>
          {:else if rows.length === 0}
            <p class="text-sm text-muted-foreground">No rows found.</p>
          {:else}
            <div class="w-full overflow-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-left border-b">
                    {#each columns as col}
                      <th class="py-2 pr-4 whitespace-nowrap">{col.name}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each rows as r}
                    <tr class="border-b hover:bg-muted/30">
                      {#each columns as col}
                        <td class="py-2 pr-4 align-top">
                          {#if typeof r[col.name] === 'object'}
                            {#if r[col.name] === null}
                              null
                            {:else}
                              <pre class="text-xs whitespace-pre-wrap">{truncateText(JSON.stringify(r[col.name]))}</pre>
                            {/if}
                          {:else if typeof r[col.name] === 'string'}
                            {truncateText(r[col.name])}
                          {:else}
                            {r[col.name]}
                          {/if}
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </CardContent>
      </Card>
    </div>
  </div>
  </div>


