import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WalkthroughStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

interface WalkthroughProps {
  steps: WalkthroughStep[];
  storageKey: string;
}

export const Walkthrough = ({ steps, storageKey }: WalkthroughProps) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elementPosition, setElementPosition] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    const hasSeenWalkthrough = localStorage.getItem(storageKey);
    if (!hasSeenWalkthrough) {
      setTimeout(() => setIsActive(true), 500);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const element = document.getElementById(steps[currentStep].target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setElementPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isActive, currentStep, steps]);

  const handleClose = () => {
    setIsActive(false);
    localStorage.setItem(storageKey, "true");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  if (!isActive || !steps[currentStep]) return null;

  const step = steps[currentStep];
  const getTooltipPosition = () => {
    const padding = 20;
    switch (step.position) {
      case "top":
        return {
          top: elementPosition.top - padding,
          left: elementPosition.left + elementPosition.width / 2,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          top: elementPosition.top + elementPosition.height + padding,
          left: elementPosition.left + elementPosition.width / 2,
          transform: "translate(-50%, 0)",
        };
      case "left":
        return {
          top: elementPosition.top + elementPosition.height / 2,
          left: elementPosition.left - padding,
          transform: "translate(-100%, -50%)",
        };
      case "right":
        return {
          top: elementPosition.top + elementPosition.height / 2,
          left: elementPosition.left + elementPosition.width + padding,
          transform: "translate(0, -50%)",
        };
    }
  };

  const Arrow = step.position === "top" || step.position === "left" ? ArrowRight : ArrowDown;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
          onClick={handleClose}
        />

        {/* Highlight */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute pointer-events-none"
          style={{
            top: elementPosition.top - 8,
            left: elementPosition.left - 8,
            width: elementPosition.width + 16,
            height: elementPosition.height + 16,
            border: "3px solid hsl(var(--primary))",
            borderRadius: "12px",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
        />

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute pointer-events-auto"
          style={getTooltipPosition()}
        >
          <div className="bg-card border border-border rounded-lg p-6 shadow-2xl max-w-sm">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Arrow className="w-5 h-5 text-primary animate-pulse" />
                {step.title}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-6 w-6 -mt-1 -mr-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {step.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <Button onClick={handleNext} size="sm">
                {currentStep < steps.length - 1 ? "Next" : "Got it!"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
