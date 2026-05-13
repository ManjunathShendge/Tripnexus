import type { ComponentPropsWithoutRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em]",
  {
    variants: {
      tone: {
        warm: "border-orange-200/80 bg-orange-50/90 text-orange-700",
        ocean: "border-cyan-200/80 bg-cyan-50/90 text-cyan-800",
        neutral: "border-white/70 bg-white/75 text-slate-700 backdrop-blur",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

type BadgeProps = ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
