import { useEffect, useRef } from "react";

const placementToSide = (placement) => {
  switch (placement) {
    case "left":
      return "left";
    case "right":
      return "right";
    case "bottom":
      return "bottom";
    case "top":
    default:
      return "top";
  }
};

/**
 * Lightweight tour component using driver.js (no React peer deps).
 *
 * Props:
 * - run: boolean
 * - steps: [{ target: string(css selector), content: string, placement?: 'top'|'bottom'|'left'|'right' }]
 * - onFinished: () => void  (called when tour is closed/completed)
 */
export default function DriverTour({ run, steps, onFinished }) {
  const driverRef = useRef(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const cleanup = () => {
      if (driverRef.current) {
        try {
          driverRef.current.destroy();
        } catch {
          // ignore
        }
        driverRef.current = null;
      }
    };

    const start = async () => {
      if (!run || !steps?.length) return;
      finishedRef.current = false;

      const mod = await import("driver.js");
      if (cancelled) return;

      const { driver } = mod;
      const drv = driver({
        showProgress: true,
        allowClose: true,
        overlayClickNext: false,
        onDestroyed: () => {
          if (finishedRef.current) return;
          finishedRef.current = true;
          onFinished?.();
        },
      });

      drv.setSteps(
        steps.map((s) => ({
          element: s.target,
          popover: {
            description: s.content,
            side: placementToSide(s.placement),
            align: "center",
          },
        }))
      );

      driverRef.current = drv;
      drv.drive();
    };

    if (!run) {
      cleanup();
      return () => {};
    }

    start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [onFinished, run, steps]);

  return null;
}

