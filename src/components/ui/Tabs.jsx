import { h } from "preact";
import { useState } from "preact/hooks";
import { cn } from "../../lib/utils";

const Tabs = ({ className, defaultValue, children, ...props }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  // On clone les enfants pour leur passer la valeur active
  const childrenWithProps = children.map((child) => {
    if (child.type === TabsContent) {
      return h(child.type, {
        ...child.props,
        hidden: child.props.value !== activeTab,
      });
    }
    if (child.type === TabsList) {
      return h(child.type, {
        ...child.props,
        activeTab,
        setActiveTab,
      });
    }
    return child;
  });

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      {childrenWithProps}
    </div>
  );
};

const TabsList = ({
  className,
  activeTab,
  setActiveTab,
  children,
  ...props
}) => {
  // On clone les triggers pour leur passer l'état actif
  const triggersWithProps = children.map((child) => {
    if (child.type === TabsTrigger) {
      return h(child.type, {
        ...child.props,
        active: child.props.value === activeTab,
        onClick: () => setActiveTab(child.props.value),
      });
    }
    return child;
  });

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center bg-muted p-1 text-muted-foreground rounded-md",
        className
      )}
      {...props}
    >
      {triggersWithProps}
    </div>
  );
};

const TabsTrigger = ({ className, active, ...props }) => {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active && "bg-background text-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
};

const TabsContent = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    />
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
