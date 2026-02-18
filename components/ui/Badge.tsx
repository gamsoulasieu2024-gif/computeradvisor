import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "error";

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success:
    "bg-success text-success-foreground dark:bg-success dark:text-success-foreground",
  warning:
    "bg-warning text-warning-foreground dark:bg-warning dark:text-warning-foreground",
  error: "bg-error text-error-foreground dark:bg-error dark:text-error-foreground",
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
