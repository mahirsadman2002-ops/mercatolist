"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BarChart3, MapPin, Users, Building2 } from "lucide-react";

interface StatItem {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
}

interface AnimatedStatsProps {
  listingCount: number;
  neighborhoodCount: number;
  userCount: number;
  boroughCount: number;
}

function AnimatedNumber({ target, inView }: { target: number; inView: boolean }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [target, inView]);

  return <>{current.toLocaleString()}</>;
}

export function AnimatedStats({
  listingCount,
  neighborhoodCount,
  userCount,
  boroughCount,
}: AnimatedStatsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const stats: StatItem[] = [
    {
      label: "Active Listings",
      value: listingCount,
      suffix: "+",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      label: "Neighborhoods",
      value: neighborhoodCount,
      icon: <MapPin className="h-5 w-5" />,
    },
    {
      label: "Registered Users",
      value: userCount,
      suffix: "+",
      icon: <Users className="h-5 w-5" />,
    },
    {
      label: "NYC Boroughs",
      value: boroughCount,
      icon: <Building2 className="h-5 w-5" />,
    },
  ];

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6"
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center rounded-xl border bg-card p-6 text-center shadow-sm"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            {stat.icon}
          </div>
          <span className="font-heading text-3xl font-bold tracking-tight text-foreground">
            <AnimatedNumber target={stat.value} inView={inView} />
            {stat.suffix}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
