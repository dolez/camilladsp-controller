import { h } from "preact";
import { cn } from "../../lib/utils";

const Dialog = ({ className, children, open, onClose, ...props }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "fixed z-50 grid w-full max-w-lg scale-100 gap-4 border bg-background p-6 shadow-lg duration-200 rounded-lg",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
};

const DialogTrigger = ({ className, ...props }) => {
  return <button className={cn(className)} {...props} />;
};

const DialogContent = ({ className, ...props }) => {
  return <div className={cn("grid gap-4", className)} {...props} />;
};

const DialogHeader = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className
      )}
      {...props}
    />
  );
};

const DialogFooter = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  );
};

const DialogTitle = ({ className, ...props }) => {
  return <h3 className={cn("text-lg font-semibold", className)} {...props} />;
};

const DialogDescription = ({ className, ...props }) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
