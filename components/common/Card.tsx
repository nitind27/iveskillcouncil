"use client";

import React, { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const cardVariants = cva(
  "rounded-2xl transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-card border border-border shadow-sm",
        bordered: "bg-card border-2 border-border shadow-sm",
        elevated: "bg-card border border-border shadow-md hover:shadow-lg",
        gradient: "bg-gradient-to-br from-primary/10 via-background to-background border border-border shadow-sm",
        stats: "bg-card border border-border shadow-sm hover:shadow-md hover:scale-[1.02]",
      },
      clickable: {
        true: "cursor-pointer hover:shadow-md active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      clickable: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  loading?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, clickable, loading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, clickable }), className)}
        {...props}
      >
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          children
        )}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between px-6 pt-6", className)}
      {...props}
    />
  );
});
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

const CardSubtitle = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-muted-foreground mt-1", className)}
      {...props}
    />
  );
});
CardSubtitle.displayName = "CardSubtitle";

const CardAction = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  );
});
CardAction.displayName = "CardAction";

const CardContent = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("px-6 py-4", className)}
      {...props}
    />
  );
});
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between px-6 pb-6 pt-4 border-t border-border",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardSubtitle,
  CardAction,
  CardContent,
  CardFooter,
};

/* 
Example Usage:

// Basic Card
<Card>
  <CardHeader>
    <CardTitle>Revenue</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">$12,400</p>
  </CardContent>
</Card>

// Card with Action
<Card variant="elevated">
  <CardHeader>
    <div>
      <CardTitle>Users</CardTitle>
      <CardSubtitle>Total active users</CardSubtitle>
    </div>
    <CardAction>
      <button className="text-sm text-primary hover:underline">View all</button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p className="text-3xl font-bold">2,350</p>
    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
      +15.3% from last month
    </p>
  </CardContent>
</Card>

// Stats Card
<Card variant="stats" clickable>
  <CardContent className="pt-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">Total Orders</p>
        <p className="text-2xl font-bold mt-1">1,234</p>
      </div>
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
        <ShoppingCart className="w-6 h-6 text-primary" />
      </div>
    </div>
  </CardContent>
</Card>

// Card with Footer
<Card variant="bordered">
  <CardHeader>
    <CardTitle>Settings</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Configure your preferences</p>
  </CardContent>
  <CardFooter>
    <button className="text-sm text-primary hover:underline">Save changes</button>
  </CardFooter>
</Card>

// Loading Card
<Card loading={isLoading}>
  <CardContent>Content here</CardContent>
</Card>
*/

