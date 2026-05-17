import Link from "next/link";
import { Compass, MapPinned, Store, CarFront, BedDouble } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const footerLinks = [
  {
    title: "Discover",
    items: [
      { href: "/explore", label: "Places", icon: Compass },
      { href: "/restaurants", label: "Food", icon: Store },
      { href: "/transport", label: "Transport", icon: CarFront },
      { href: "/stays", label: "Stays", icon: BedDouble },
    ],
  },
  {
    title: "Plan",
    items: [
      { href: "/trip", label: "My Trip", icon: MapPinned },
      { href: "/cart", label: "Cart", icon: Store },
      { href: "/account/orders", label: "Orders", icon: Compass },
      { href: "/account/profile", label: "Profile", icon: MapPinned },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-white/60 bg-[linear-gradient(180deg,rgba(255,248,241,0.82),rgba(246,250,255,0.96))]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(239,111,56,0.45),transparent)]"
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="space-y-4">
          <Badge tone="neutral" className="w-fit">
            Trip-first local discovery
          </Badge>
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ef6f38_0%,#ffaf56_100%)] text-base font-bold text-white shadow-[0_14px_35px_rgba(239,111,56,0.28)]">
                TN
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-[0.2em] text-slate-500">
                  TRIPNEXUS
                </div>
                <div className="text-sm text-slate-700 sm:truncate">
                  Nearby planning with better flow and stronger context.
                </div>
              </div>
            </Link>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Explore places, compare transport, discover food, and manage stay intent from a
              single travel-focused product experience.
            </p>
          </div>
        </div>

        {footerLinks.map((group) => (
          <div key={group.title} className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              {group.title}
            </h2>
            <nav className="grid gap-2">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-white/70 hover:bg-white/70 hover:text-slate-950"
                  >
                    <span className="inline-flex rounded-xl bg-white/80 p-2 text-slate-500 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="border-t border-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>&copy; 2026 TripNexus. Built for smoother tourist discovery and trip planning.</p>
          <p>Designed to keep restaurants, rides, stays, and local places in one journey.</p>
        </div>
      </div>
    </footer>
  );
}
