import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        brand: "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        success: "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        warning: "border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
        danger: "border-transparent bg-red-100 text-red-800 hover:bg-red-200",
        info: "border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200",
        muted: "border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </div>
  )
}

interface StatusBadgeProps {
  status: string;
  label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; defaultLabel: string }> = {
    published: { variant: 'success', defaultLabel: 'Published' },
    results_released: { variant: 'info', defaultLabel: 'Results Released' },
    closed: { variant: 'muted', defaultLabel: 'Closed' },
    draft: { variant: 'warning', defaultLabel: 'Draft' },
    approved: { variant: 'brand', defaultLabel: 'Approved' },
    active: { variant: 'success', defaultLabel: 'Active' },
    pending: { variant: 'warning', defaultLabel: 'Pending' },
    error: { variant: 'danger', defaultLabel: 'Error' },
    locked: { variant: 'danger', defaultLabel: 'Locked' },
    unlocked: { variant: 'success', defaultLabel: 'Unlocked' },
  };

  const config = statusConfig[status] || { variant: 'muted', defaultLabel: status };
  const displayLabel = label || config.defaultLabel;

  return <Badge variant={config.variant}>{displayLabel}</Badge>;
};

export { Badge, badgeVariants }
