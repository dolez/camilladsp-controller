import { h } from "preact";
import { cn } from "../../lib/utils";

const Alert = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "bg-background text-foreground",
    destructive:
      "border-destructive/50 text-destructive dark:border-destructive",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

const AlertTitle = ({ className, ...props }) => (
  <h5
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
);

const AlertDescription = ({ className, ...props }) => (
  <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
);

export { Alert, AlertTitle, AlertDescription };
