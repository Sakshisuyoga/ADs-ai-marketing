<script module>
  import { cn } from '$lib/utils.js';
  import { tv } from 'tailwind-variants';

  export const buttonVariants = tv({
    base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm outline-none transition-all duration-300 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-lg',
        destructive:
          'bg-destructive text-white shadow-lg focus-visible:ring-destructive/20',
        outline:
          'bg-card/80 backdrop-blur-sm border-2 border-primary text-primary shadow-lg',
        secondary: 'bg-secondary text-white shadow-lg',
        ghost: 'text-primary',
        link: 'text-primary underline-offset-4 hover:underline',
        cream: 'bg-muted text-foreground border border-secondary/30 shadow-lg',
        vibrant: 'bg-accent text-white shadow-xl'
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-12 gap-2 rounded-lg px-8 has-[>svg]:px-6 text-base font-semibold',
        xl: 'h-14 gap-3 rounded-xl px-10 has-[>svg]:px-8 text-lg font-bold',
        icon: 'size-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  });
</script>

<script>
  let {
    class: className,
    variant = /** @type {"default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "cream" | "vibrant"} */ (
      'default'
    ),
    size = /** @type {"default" | "sm" | "lg" | "xl" | "icon"} */ ('default'),
    ref = $bindable(null),
    href = undefined,
    type = /** @type {"button" | "submit" | "reset"} */ ('button'),
    disabled = false,
    children,
    ...restProps
  } = $props();
</script>

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? 'link' : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
