"use client";

import type { ComponentPropsWithoutRef, CSSProperties, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealProps = ComponentPropsWithoutRef<"div"> & {
  children: ReactNode;
  delay?: number;
  y?: number;
  once?: boolean;
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  once = true,
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(entry.target);
        } else if (!once) {
          setVisible(false);
        }
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [once]);

  return (
    <div
      ref={ref}
      className={cn(
        "motion-safe:transition-[opacity,transform,filter] motion-safe:duration-700 motion-safe:ease-out",
        visible
          ? "opacity-100 blur-0 translate-y-0"
          : "opacity-0 blur-sm translate-y-[var(--reveal-y)]",
        className,
      )}
      style={
        {
          ...style,
          transitionDelay: `${delay}ms`,
          "--reveal-y": `${y}px`,
        } as CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  );
}
