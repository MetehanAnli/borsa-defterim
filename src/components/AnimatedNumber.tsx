import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';

interface AnimatedNumberProps {
  value: number;
  formatter: (val: number) => string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, formatter, className }) => {
  const springValue = useSpring(0, { bounce: 0, duration: 1500 });
  
  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  const display = useTransform(springValue, (current) => formatter(current));

  return <motion.span className={className}>{display}</motion.span>;
};
