import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BedDouble,
  Car,
  Compass,
  Menu,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardGlow, CardMetric, CardText, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/ui/reveal";

type FeaturedPlace = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  estimatedVisitTime: string | null;
};

type FeaturedTransport = {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  description: string | null;
  pricingNotes: string | null;
};

type HomePageProps = {
  counts: {
    restaurants: number;
    places: number;
    transport: number;
    stays: number;
  };
  featuredPlaces: FeaturedPlace[];
  featuredTransport: FeaturedTransport[];
};

const quickLinks = [
  { href: "/nearby", label: "Nearby" },
  { href: "/explore", label: "Explore" },
  { href: "/transport", label: "Transport" },
  { href: "/trip", label: "My Trip" },
  { href: "/stays", label: "Stays" },
  { href: "/restaurants", label: "Food" },
];

const experienceHighlights: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}> = [
  {
    icon: Compass,
    title: "Smarter discovery",
    description: "Browse attractions, local gems, and essential stops without opening multiple apps.",
    tone: "from-cyan-100 to-sky-50 text-cyan-900",
  },
  {
    icon: Car,
    title: "Transport in context",
    description: "Keep rides, airport transfer options, and city movement aligned with your route.",
    tone: "from-sky-100 to-white text-sky-900",
  },
  {
    icon: UtensilsCrossed,
    title: "Food inside the journey",
    description: "Restaurants feel like part of the itinerary, not a disconnected catalog.",
    tone: "from-orange-100 to-amber-50 text-orange-900",
  },
  {
    icon: BedDouble,
    title: "Stay booking flow",
    description: "Let guests explore properties and send booking requests directly to partners.",
    tone: "from-emerald-100 to-lime-50 text-emerald-900",
  },
];

const metrics = [
  {
    href: "/explore",
    value: "places",
    icon: Compass,
    label: "Curated local places",
    tone: "bg-cyan-100 text-cyan-700",
  },
  {
    href: "/transport",
    value: "transport",
    icon: Car,
    label: "Mobility options",
    tone: "bg-sky-100 text-sky-700",
  },
  {
    href: "/restaurants",
    value: "restaurants",
    icon: Store,
    label: "Food partners",
    tone: "bg-orange-100 text-orange-700",
  },
  {
    href: "/stays",
    value: "stays",
    icon: BedDouble,
    label: "Stay partners",
    tone: "bg-emerald-100 text-emerald-700",
  },
] as const;

export function HomePage({ counts, featuredPlaces, featuredTransport }: HomePageProps) {
  return (
    <main className="min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top_left,rgba(61,185,172,0.18),transparent_30%),radial-gradient(circle_at_95%_5%,rgba(255,168,76,0.22),transparent_26%),linear-gradient(180deg,#fff9f3_0%,#f7fbff_48%,#fdfefe_100%)] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_62%)]"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-30 mb-10">
          <div className="relative rounded-[2rem] border border-white/65 bg-white/72 px-4 py-3 shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex min-w-0 flex-1 items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ef6f38_0%,#ffaf56_100%)] text-base font-bold text-white shadow-[0_14px_35px_rgba(239,111,56,0.32)]">
                  TN
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold tracking-[0.2em] text-slate-500">
                    TRIPNEXUS
                  </div>
                  <div className="hidden truncate text-sm text-slate-700 sm:block">
                    Plan nearby, move easy, eat better.
                  </div>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 lg:flex">
                {quickLinks.map((item) => (
                  <ButtonLink key={item.href} href={item.href} variant="ghost" size="sm">
                    {item.label}
                  </ButtonLink>
                ))}
              </nav>

              <div className="flex shrink-0 items-center gap-2">
                <details className="relative lg:hidden">
                  <summary className="flex list-none items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white">
                    <Menu className="h-4 w-4" />
                    <span>Menu</span>
                  </summary>
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] w-64 rounded-[1.5rem] border border-white/70 bg-white/95 p-3 shadow-[0_22px_55px_rgba(15,23,42,0.14)] backdrop-blur-xl">
                    <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Navigate
                    </p>
                    <nav className="grid gap-2">
                      {quickLinks.map((item) => (
                        <ButtonLink
                          key={item.href}
                          href={item.href}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start rounded-2xl"
                        >
                          {item.label}
                        </ButtonLink>
                      ))}
                    </nav>
                  </div>
                </details>
                <UserNav />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-8 pb-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <Reveal className="space-y-7">
            <Badge tone="neutral" className="w-fit">
              <ShieldCheck className="h-3.5 w-3.5" />
              Local travel, food, rides, and stays in one flow
            </Badge>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                A cleaner travel homepage that helps visitors decide faster.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                TripNexus brings exploration, transport, restaurants, and stay discovery into a
                single trip-first experience so travelers spend less time jumping between routes.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/nearby" size="lg">
                Open nearby hub
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/explore" variant="secondary" size="lg">
                Browse places
              </ButtonLink>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <HeroPulse label="Trip planning" value="one saved flow" />
              <HeroPulse label="Stay requests" value="owner-directed" />
              <HeroPulse label="Nearby search" value="fast decision UX" />
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Card tone="glass" className="p-5 sm:p-6">
              <CardGlow />
              <div className="relative grid gap-4">
                <Card tone="soft" className="overflow-hidden border-slate-200/70 p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <Badge tone="warm" className="mb-3 w-fit">
                        <Sparkles className="h-3.5 w-3.5" />
                        New homepage flow
                      </Badge>
                      <CardTitle className="text-2xl">Designed around the traveler journey</CardTitle>
                      <CardText className="mt-2 max-w-md text-base">
                        Better hierarchy, stronger CTA placement, and softer motion cues make the
                        page feel more premium without overwhelming the user.
                      </CardText>
                    </div>
                    <div className="hidden rounded-[24px] bg-[linear-gradient(180deg,#fff1e6_0%,#ffffff_100%)] p-4 shadow-inner sm:block">
                      <MapPinned className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {experienceHighlights.map((item, index) => (
                      <Reveal key={item.title} delay={160 + index * 90} y={18}>
                        <div
                          className={`rounded-[24px] border border-white/70 bg-gradient-to-br ${item.tone} p-4 shadow-[0_14px_35px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-1`}
                        >
                          <item.icon className="mb-3 h-5 w-5" />
                          <div className="text-sm font-semibold tracking-tight">{item.title}</div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </Card>
              </div>
            </Card>
          </Reveal>
        </section>

        <Reveal className="pb-14" delay={60}>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((item, index) => {
              const Icon = item.icon;
              const value = counts[item.value];

              return (
                <Reveal key={item.href} delay={index * 80} y={22}>
                  <Link href={item.href} className="block">
                    <Card className="h-full p-6 hover:-translate-y-1.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                      <CardGlow className="top-2" />
                      <div className="relative flex h-full flex-col gap-6">
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex rounded-2xl p-3 ${item.tone}`}>
                            <Icon className="h-5 w-5" />
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400 transition duration-300 group-hover:translate-x-1 group-hover:text-slate-700" />
                        </div>
                        <CardMetric value={value} label={item.label} />
                        <CardText>
                          Explore the latest entries in this category and move straight into
                          planning from the next screen.
                        </CardText>
                      </div>
                    </Card>
                  </Link>
                </Reveal>
              );
            })}
          </section>
        </Reveal>

        <Reveal className="pb-6" delay={80}>
          <SectionHeading
            badge="Featured places"
            title="High-intent stops for the itinerary"
            description="The page now exposes a clearer preview of what a traveler can actually act on next."
            href="/explore"
            cta="See all places"
          />
        </Reveal>

        <section className="grid gap-4 pb-16 md:grid-cols-2 xl:grid-cols-3">
          {featuredPlaces.map((place, index) => (
            <Reveal key={place.id} delay={80 + index * 90} y={24}>
              <Card className="h-full p-6 hover:-translate-y-1">
                <CardGlow />
                <div className="relative flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{place.name}</CardTitle>
                      <CardText className="mt-1 text-slate-500">
                        {formatLocation(place.city, place.state)}
                      </CardText>
                    </div>
                    <Badge tone="ocean">Explore</Badge>
                  </div>
                  <CardText className="line-clamp-3">
                    {place.description ?? "Useful local stop for your itinerary."}
                  </CardText>
                  <div className="mt-auto rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Best visit window:{" "}
                    <span className="font-semibold text-slate-950">
                      {place.estimatedVisitTime ?? "Flexible"}
                    </span>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </section>

        <Reveal className="pb-6" delay={100}>
          <SectionHeading
            badge="Featured transport"
            title="Movement options without a separate search mindset"
            description="Transport previews stay lightweight but still actionable, which helps users keep momentum."
            href="/transport"
            cta="See all transport"
          />
        </Reveal>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredTransport.map((option, index) => (
            <Reveal key={option.id} delay={120 + index * 90} y={24}>
              <Card className="h-full p-6 hover:-translate-y-1">
                <CardGlow />
                <div className="relative flex h-full flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle>{option.name}</CardTitle>
                      <CardText className="mt-1 text-slate-500">
                        {formatLocation(option.city, option.state)}
                      </CardText>
                    </div>
                    <Badge tone="neutral">Transit</Badge>
                  </div>
                  <CardText className="line-clamp-3">
                    {option.description ?? "Useful local transport support for travelers."}
                  </CardText>
                  <div className="mt-auto rounded-[22px] bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Pricing notes:{" "}
                    <span className="font-semibold text-slate-950">
                      {option.pricingNotes ?? "Contact provider"}
                    </span>
                  </div>
                </div>
              </Card>
            </Reveal>
          ))}
        </section>
      </div>
    </main>
  );
}

function SectionHeading({
  badge,
  title,
  description,
  href,
  cta,
}: {
  badge: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-3">
        <Badge tone="neutral">{badge}</Badge>
        <div className="space-y-2">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-slate-600">{description}</p>
        </div>
      </div>
      <ButtonLink href={href} variant="secondary">
        {cta}
      </ButtonLink>
    </div>
  );
}

function formatLocation(city: string | null, state: string | null) {
  const parts = [city, state].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Location updates coming soon";
}

function HeroPulse({ label, value }: { label: string; value: string }) {
  return (
    <div className="group rounded-[24px] border border-white/70 bg-white/70 px-4 py-4 shadow-[0_16px_45px_rgba(15,23,42,0.06)] backdrop-blur transition duration-300 hover:-translate-y-1">
      <div className="mb-3 h-2 w-16 rounded-full bg-[linear-gradient(90deg,#ef6f38_0%,#ffb267_100%)] transition duration-500 group-hover:w-20" />
      <div className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{value}</div>
    </div>
  );
}
