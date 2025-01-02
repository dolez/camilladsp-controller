import { h } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import { cn } from "../../lib/utils";

const Select = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={selectRef} className="relative inline-block text-left">
      {h(
        "div",
        {},
        children.map((child) => {
          if (child.type === SelectTrigger) {
            return h(child.type, {
              ...child.props,
              onClick: () => setIsOpen(!isOpen),
              isOpen,
            });
          }
          if (child.type === SelectContent && isOpen) {
            return h(child.type, {
              ...child.props,
              value,
              onValueChange: (newValue) => {
                onValueChange(newValue);
                setIsOpen(false);
              },
            });
          }
          return null;
        })
      )}
    </div>
  );
};

const SelectTrigger = ({ className, children, onClick, isOpen, ...props }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

const SelectContent = ({
  className,
  children,
  value,
  onValueChange,
  ...props
}) => {
  return (
    <div
      className={cn(
        "absolute z-50 mt-2 min-w-[8rem] overflow-hidden rounded-md border bg-black text-white shadow-lg",
        className
      )}
      {...props}
    >
      <div className="flex flex-col py-1">
        {h(
          "div",
          {},
          Array.isArray(children)
            ? children.map((child) =>
                h(child.type, {
                  ...child.props,
                  isSelected: child.props.value === value,
                  onSelect: () => onValueChange(child.props.value),
                })
              )
            : h(children.type, {
                ...children.props,
                isSelected: children.props.value === value,
                onSelect: () => onValueChange(children.props.value),
              })
        )}
      </div>
    </div>
  );
};

const SelectItem = ({
  className,
  children,
  isSelected,
  onSelect,
  ...props
}) => {
  return (
    <button
      className={cn(
        "relative flex w-full cursor-default select-none items-center px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-800 hover:text-white",
        isSelected && "bg-gray-800 text-white",
        className
      )}
      onClick={onSelect}
      {...props}
    >
      {children}
    </button>
  );
};

const SelectValue = ({ className, children, placeholder, ...props }) => {
  return (
    <span className={cn("flex items-center gap-2", className)} {...props}>
      {children || <span className="text-muted-foreground">{placeholder}</span>}
    </span>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
