// components/home/AnimatedCounter.jsx

import React, { useState, useEffect } from 'react';

const AnimatedCounter = ({ value, duration = 1000, prefix = "", suffix = "" }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = displayValue;
    const endValue =
      typeof value === "number"
        ? value
        : parseFloat(String(value).replace(/[$,]/g, "")) || 0;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const current = startValue + (endValue - startValue) * progress;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {Math.round(displayValue)}
      {suffix}
    </span>
  );
};

export default AnimatedCounter;