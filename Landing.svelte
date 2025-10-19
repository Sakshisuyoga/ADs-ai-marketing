<script>
  import { Button } from '$ui/button';
  import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
  } from '$ui/card';
  import { Badge } from '$ui/badge';
  import {
    Bot,
    BarChart3,
    Zap,
    Target,
    DollarSign,
    RefreshCw,
    Rocket,
    Sparkles,
    MessageCircle,
    TrendingUp
  } from 'lucide-svelte';

  const features = [
    {
      icon: Bot,
      title: 'AI-Powered Campaigns',
      description:
        'Generate compelling ad copy, visuals, and strategies using advanced AI algorithms that understand your brand and audience.'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description:
        'Get real-time insights and performance predictions to optimize your campaigns and maximize ROI.'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description:
        'Create professional marketing campaigns in minutes, not weeks. Launch faster and stay ahead of the competition.'
    },
    {
      icon: Target,
      title: 'Targeted Precision',
      description:
        'Reach the right audience with precision targeting and personalized content that converts.'
    },
    {
      icon: DollarSign,
      title: 'Cost Effective',
      description:
        'Reduce marketing costs by up to 70% while increasing conversion rates with AI-optimized campaigns.'
    },
    {
      icon: RefreshCw,
      title: 'Continuous Learning',
      description:
        'Our AI learns from every campaign, constantly improving and adapting to market trends and user behavior.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Marketing Director',
      company: 'TechStart Inc.',
      content:
        'AdFusion increased our campaign performance by 300%. The AI-generated content outperforms our manual campaigns every time.',
      avatar: 'SC'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Founder',
      company: 'EcoGoods',
      content:
        'We went from spending weeks on campaign creation to minutes. The ROI improvement has been incredible.',
      avatar: 'MR'
    },
    {
      name: 'Emily Watson',
      role: 'CEO',
      company: 'HealthTech Solutions',
      content:
        'The predictive analytics helped us avoid costly mistakes and focus on what actually works. Game changer!',
      avatar: 'EW'
    }
  ];
</script>

<!-- Hero Section -->
<section
  class="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
>
  <div class="relative z-[1] px-4 max-w-7xl mx-auto">
    <div class="grid lg:grid-cols-2 gap-12 items-center">
      <!-- Left Content -->
      <div class="text-center lg:text-left">
        <Badge class="bg-primary text-primary-foreground mb-6">
          <Rocket class="w-4 h-4 mr-2" />
          AI-Powered Marketing Platform
        </Badge>
        <h1
          class="font-chillax font-black text-4xl sm:text-5xl lg:text-6xl text-foreground leading-tight mb-6"
        >
          Transform Your Marketing with
          <span class="text-accent">AI&nbsp;Intelligence</span>
        </h1>
        <p
          class="font-sans text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed"
        >
          Create, optimize, and scale marketing campaigns 10x faster with our
          advanced AI. From ad copy to analytics, we handle everything so you
          can focus on growing your business.
        </p>
        <div
          class="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
        >
          <Button
            size="lg"
            class=""
            onclick={() => (location.pathname = '/new')}
          >
            Start Free Trial
          </Button>
          <Button
            size="lg"
            class=""
            variant="outline"
            onclick={() => (location.pathname = '/signin')}
          >
            Sign In
          </Button>
        </div>
      </div>

      <!-- Right Content - Visual -->
      <div class="relative">
        <div
          class="relative z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/50"
        >
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <div class="w-3 h-3 bg-red-500 rounded-full"></div>
              <div class="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span class="text-sm text-muted-foreground ml-4"
                >AdFusion Dashboard</span
              >
            </div>
            <div
              class="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4"
            >
              <div class="flex items-center gap-2 mb-2">
                <Bot class="w-4 h-4 text-primary" />
                <div class="text-sm font-semibold text-foreground">
                  AI Campaign Generator
                </div>
              </div>
              <div class="text-xs text-muted-foreground">
                Creating optimized ad copy for your product...
              </div>
              <div class="mt-3 flex gap-2">
                <div
                  class="w-2 h-2 bg-primary rounded-full animate-pulse"
                ></div>
                <div
                  class="w-2 h-2 bg-secondary rounded-full animate-pulse"
                  style="animation-delay: 0.2s"
                ></div>
                <div
                  class="w-2 h-2 bg-accent rounded-full animate-pulse"
                  style="animation-delay: 0.4s"
                ></div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-card rounded-lg p-3 border border-primary/20">
                <div class="flex items-center gap-1 mb-1">
                  <BarChart3 class="w-3 h-3 text-muted-foreground" />
                  <div class="text-xs text-muted-foreground">Campaigns</div>
                </div>
                <div class="text-lg font-bold text-primary">24</div>
              </div>
              <div class="bg-card rounded-lg p-3 border border-secondary/20">
                <div class="flex items-center gap-1 mb-1">
                  <TrendingUp class="w-3 h-3 text-muted-foreground" />
                  <div class="text-xs text-muted-foreground">ROI</div>
                </div>
                <div class="text-lg font-bold text-secondary">+340%</div>
              </div>
            </div>
          </div>
        </div>
        <!-- Floating elements -->
        <div
          class="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-xl"
        ></div>
        <div
          class="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-accent/30 to-secondary/30 rounded-full blur-xl"
        ></div>
        <div
          class="absolute top-1/2 -right-8 w-12 h-12 bg-gradient-to-br from-secondary/25 to-accent/25 rounded-full blur-lg"
        ></div>
      </div>
    </div>
  </div>

  <!-- Background Elements -->
  <div class="absolute inset-0 -z-0 pointer-events-none">
    <div
      class="absolute top-[10%] left-[8%] w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-primary/15 blur-3xl"
    ></div>
    <div
      class="absolute bottom-[15%] right-[10%] w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-secondary/15 blur-3xl"
    ></div>
    <div
      class="absolute top-[55%] left-[65%] w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-accent/15 blur-3xl"
    ></div>
    <div
      class="absolute top-[25%] right-[20%] w-32 h-32 rounded-full bg-secondary/20 blur-2xl"
    ></div>
    <div
      class="absolute bottom-[30%] left-[15%] w-40 h-40 rounded-full bg-accent/12 blur-2xl"
    ></div>
  </div>
</section>

<!-- Features Section -->
<section
  class="py-20 bg-gradient-to-br from-muted/30 via-background to-secondary/5"
>
  <div class="max-w-7xl mx-auto px-4">
    <div class="text-center mb-16">
      <Badge class="bg-gradient-to-r from-accent to-secondary text-white mb-4">
        <Sparkles class="w-4 h-4 mr-2" />
        Features
      </Badge>
      <h2
        class="font-chillax text-3xl sm:text-4xl font-bold text-foreground mb-4"
      >
        Everything you need to scale your marketing
      </h2>
      <p class="font-sans text-muted-foreground text-lg max-w-3xl mx-auto">
        Our AI-powered platform combines cutting-edge technology with intuitive
        design to deliver marketing results that exceed expectations.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {#each features as feature}
        <Card
          class="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/90 backdrop-blur-sm group hover:bg-card"
        >
        <CardHeader>
            <div
              class="w-16 h-16 bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/20 rounded-2xl flex items-center justify-center mb-4 transition-transform duration-300"
            >
              <svelte:component
                this={feature.icon}
                class="w-8 h-8 text-primary"
              />
            </div>
            <CardTitle class="font-chillax text-foreground text-xl"
              >{feature.title}</CardTitle
            >
            <CardDescription
              class="font-sans text-muted-foreground leading-relaxed"
            >
              {feature.description}
            </CardDescription>
        </CardHeader>
      </Card>
      {/each}
    </div>
  </div>
</section>

<!-- Testimonials Section -->
<section
  class="py-20 bg-gradient-to-br from-secondary/10 via-muted/40 to-accent/10"
>
  <div class="max-w-7xl mx-auto px-4">
    <div class="text-center mb-16">
      <Badge class="bg-gradient-to-r from-primary to-accent text-white mb-4">
        <MessageCircle class="w-4 h-4 mr-2" />
        Testimonials
      </Badge>
      <h2
        class="font-chillax text-3xl sm:text-4xl font-bold text-foreground mb-4"
      >
        Loved by marketers worldwide
      </h2>
      <p class="font-sans text-muted-foreground text-lg max-w-3xl mx-auto">
        See how businesses are transforming their marketing with AdFusion
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      {#each testimonials as testimonial}
        <Card
          class="border-0 shadow-lg bg-card/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
        >
          <CardContent class="p-6">
            <div class="flex items-center gap-4 mb-4">
              <div
                class="w-12 h-12 bg-gradient-to-br from-primary via-secondary to-accent rounded-full flex items-center justify-center text-white font-semibold"
              >
                {testimonial.avatar}
              </div>
              <div>
                <div class="font-chillax font-semibold text-foreground">
                  {testimonial.name}
                </div>
                <div class="font-sans text-sm text-muted-foreground">
                  {testimonial.role}
                </div>
                <div class="font-sans text-sm text-primary">
                  {testimonial.company}
                </div>
              </div>
            </div>
            <p class="font-sans text-foreground/80 italic">
              "{testimonial.content}"
            </p>
            <div class="flex text-secondary mt-4">
              {#each Array(5) as _}
                <span>★</span>
              {/each}
            </div>
        </CardContent>
      </Card>
      {/each}
    </div>
  </div>
</section>

<!-- CTA Section -->
<section
  class="py-20 bg-gradient-to-r from-primary via-secondary to-accent relative overflow-hidden"
>
  <div
    class="absolute inset-0 bg-gradient-to-r from-primary/90 via-secondary/90 to-accent/90"
  ></div>
  <div class="relative z-10 max-w-4xl mx-auto px-4 text-center">
    <h2 class="font-chillax text-3xl sm:text-4xl font-bold text-white mb-4">
      Ready to transform your marketing?
    </h2>
    <p class="font-sans text-white/90 text-lg mb-8 max-w-2xl mx-auto">
      Join thousands of businesses already using AdFusion to create, optimize,
      and scale their marketing campaigns.
    </p>
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg" class="" onclick={() => (location.pathname = '/new')}>
        Start Your Free Trial
      </Button>
      <Button
        size="lg"
        variant="outline"
        class=""
        onclick={() => (location.pathname = '/signin')}
      >
        Sign In
      </Button>
    </div>
  </div>
  <!-- Decorative elements -->
  <div
    class="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
  ></div>
  <div
    class="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl"
  ></div>
</section>
