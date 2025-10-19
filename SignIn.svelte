<script>
  import { createEventDispatcher } from 'svelte';
  import { signInDemo } from '../lib/stores';
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

  const dispatch = createEventDispatcher();
  let email = 'john.doe@test.com';
  let password = 'Test@123';

  async function submit(e) {
    e.preventDefault();
    if (!email || password.length < 6) return;

    const result = await signInDemo(email);
    if (result.success) {
      dispatch('signed-in');
    } else {
      console.error('Login failed:', result.error);
      // You could show an error message to the user here
    }
  }
</script>

<div class="min-h-screen bg-background flex items-center justify-center px-4">
  <Card class="w-full max-w-md">
    <CardHeader class="text-center">
      <CardTitle class="font-chillax text-2xl text-foreground"
        >Welcome Back</CardTitle
      >
      <CardDescription class="font-sans text-muted-foreground">
        Sign in to your AdFusion account
      </CardDescription>
    </CardHeader>
    <CardContent>
      <form on:submit|preventDefault={submit} class="space-y-4">
        <div class="space-y-2">
          <Label for="email" class="font-sans text-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            bind:value={email}
            required
            class="w-full"
            placeholder="Enter your email"
          />
        </div>
        <div class="space-y-2">
          <Label for="password" class="font-sans text-foreground"
            >Password</Label
          >
          <Input
            id="password"
            type="password"
            bind:value={password}
            required
            minlength="6"
            class="w-full"
            placeholder="Enter your password"
          />
        </div>
        <Button type="submit" class="w-full" size="lg">Sign In</Button>
      </form>
    </CardContent>
  </Card>
</div>
