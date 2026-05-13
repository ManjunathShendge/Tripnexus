import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  "group relative overflow-hidden rounded-[30px] border transition-all duration-300",
  {
    variants: {
      tone: {
        soft: "border-white/70 bg-white/78 shadow-[0_22px_65px_rgba(15,23,42,0.08)] backdrop-blur",
        glass:
          "border-white/45 bg-white/18 shadow-[0_26px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl",
        accent:
          "border-orange-200/70 bg-[linear-gradient(180deg,rgba(255,250,245,0.98),rgba(255,255,255,0.96))] shadow-[0_22px_65px_rgba(239,111,56,0.12)]",
      },
    },
    defaultVariants: {
      tone: "soft",
    },
  },
);

type CardProps = ComponentPropsWithoutRef<"div"> &
  VariantProps<typeof cardVariants>;

export function Card({ className, tone, ...props }: CardProps) {
  return <div className={cn(cardVariants({ tone }), className)} {...props} />;
}

export function CardGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-8 top-0 h-24 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_70%)] opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100",
        className,
      )}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<"h3">) {
  return (
    <h3
      className={cn("text-lg font-semibold tracking-tight text-slate-950", className)}
      {...props}
    />
  );
}

export function CardText({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return <p className={cn("text-sm leading-6 text-slate-600", className)} {...props} />;
}

export function CardMetric({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-3xl font-semibold tracking-tight text-slate-950">{value}</div>
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
    </div>
  );
}
