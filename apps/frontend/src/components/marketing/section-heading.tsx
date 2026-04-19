import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <p className="text-[11px] uppercase tracking-[0.26em] text-white/36">
        {eyebrow}
      </p>
      <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.045em] text-white sm:text-4xl">
        {title}
      </h2>
      <p className="max-w-2xl text-base leading-8 text-white/58">
        {description}
      </p>
    </div>
  );
}
