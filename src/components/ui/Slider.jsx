import { h } from "preact";
import { useRef, useState, useEffect } from "preact/hooks";
import { cn } from "../../lib/utils";

const Slider = ({
  className,
  min = 0,
  max = 100,
  step = 1,
  value = 0,
  onValueChange,
  disabled = false,
  ...props
}) => {
  const [currentValue, setCurrentValue] = useState(value);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  const updateValue = (clientX) => {
    if (!sliderRef.current || disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = (clientX - rect.left) / rect.width;
    const newValue = Math.min(
      max,
      Math.max(min, min + (max - min) * percentage)
    );
    const steppedValue = Math.round(newValue / step) * step;

    setCurrentValue(steppedValue);
    onValueChange?.(steppedValue);
  };

  const handleMouseDown = (e) => {
    if (disabled) return;
    isDragging.current = true;
    updateValue(e.clientX);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      updateValue(e.clientX);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const percentage = ((currentValue - min) / (max - min)) * 100;

  return (
    <div
      ref={sliderRef}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    >
      <div className="relative h-2 w-full rounded-full bg-secondary">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
        <div
          className={cn(
            "absolute left-0 h-4 w-4 -translate-y-1/2 cursor-pointer rounded-full bg-primary ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none",
            disabled && "cursor-not-allowed"
          )}
          style={{ left: `${percentage}%` }}
          onMouseDown={handleMouseDown}
        />
      </div>
    </div>
  );
};

export { Slider };
