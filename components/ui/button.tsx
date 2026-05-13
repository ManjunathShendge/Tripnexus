import Link, { type LinkProps } from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,#ef6f38_0%,#ff9b52_100%)] px-5 py-3 text-white shadow-[0_18px_45px_rgba(239,111,56,0.28)] hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(239,111,56,0.34)]",
        secondary:
          "border border-white/70 bg-white/80 px-5 py-3 text-slate-800 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur hover:-translate-y-0.5 hover:bg-white",
        ghost:
          "border border-slate-200/80 bg-white/70 px-4 py-2.5 text-slate-700 hover:border-slate-300 hover:bg-white",
      },
      size: {
        default: "",
        sm: "px-3.5 py-2 text-xs",
        lg: "px-6 py-3.5 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonLinkProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    children: ReactNode;
    className?: string;
  };

export function ButtonLink({
  className,
  variant,
  size,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </Link>
  );
}

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      type={type}
      {...props}
    />
  );
}
