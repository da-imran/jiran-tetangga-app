
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

type DashboardCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  onSeeMore?: () => void;
  headerActions?: ReactNode;
};

export function DashboardCard({ title, description, icon, children, className, contentClassName, onSeeMore, headerActions }: DashboardCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {icon}
            </div>
            <div>
              <CardTitle data-speakable="true">{title}</CardTitle>
              <CardDescription data-speakable="true">{description}</CardDescription>
            </div>
          </div>
          {headerActions && <div>{headerActions}</div>}
        </div>
      </CardHeader>
      <CardContent className={cn("flex-1", contentClassName)}>
        {children}
      </CardContent>
      {onSeeMore && (
        <CardFooter>
          <Button variant="ghost" className="w-full" onClick={onSeeMore}>
            See more
            <ArrowRight />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
