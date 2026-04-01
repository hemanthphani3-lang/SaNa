import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Avatar = ({ viseme = "Neutral", expression = "Neutral", customization = {} }) => {
  // customization: { skinColor, hairColor, clothesColor }
  
  const visemePaths = {
    "Neutral": "M 40 65 Q 50 65 60 65",
    "A": "M 40 65 Q 50 80 60 65", // Wide open
    "E": "M 35 65 Q 50 70 65 65", // Slight wide
    "O": "M 45 65 Q 50 75 55 65", // Round
    "M": "M 40 68 L 60 68",       // Closed line
    "F": "M 40 65 Q 50 62 60 65", // Upper teeth
    "T": "M 38 65 L 62 65"        // Teeth line
  };

  const eyePaths = {
    "Neutral": <><circle cx="35" cy="45" r="3" fill="#333" /><circle cx="65" cy="45" r="3" fill="#333" /></>,
    "Blink": <><line x1="32" y1="45" x2="38" y2="45" stroke="#333" strokeWidth="2" /><line x1="62" y1="45" x2="68" y2="45" stroke="#333" strokeWidth="2" /></>,
    "Happy": <><path d="M 32 47 Q 35 42 38 47" stroke="#333" fill="none" strokeWidth="2" /><path d="M 62 47 Q 65 42 68 47" stroke="#333" fill="none" strokeWidth="2" /></>
  };

  const [currentEyes, setCurrentEyes] = useState("Neutral");

  // Random blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCurrentEyes("Blink");
      setTimeout(() => setCurrentEyes(expression === "Happy" ? "Happy" : "Neutral"), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, [expression]);

  return (
    <div className="avatar-container" style={{ width: '300px', height: '300px' }}>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* Face Base */}
        <circle cx="50" cy="50" r="45" fill={customization.skinColor || "#FFE0BD"} stroke="#333" strokeWidth="1" />
        
        {/* Hair (Placeholder for layers) */}
        <path d="M 10 40 Q 50 0 90 40 L 95 60 Q 50 30 5 60 Z" fill={customization.hairColor || "#4A3728"} />

        {/* Eyes */}
        <motion.g animate={{ scaleY: currentEyes === "Blink" ? 0.1 : 1 }}>
          {eyePaths[currentEyes]}
        </motion.g>

        {/* Mouth (Lip Sync) */}
        <motion.path
          d={visemePaths[viseme] || visemePaths["Neutral"]}
          stroke="#333"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{ d: visemePaths[viseme] }}
          transition={{ duration: 0.1, ease: "easeInOut" }}
        />

        {/* Clothes */}
        <path d="M 20 90 Q 50 110 80 90 L 85 100 L 15 100 Z" fill={customization.clothesColor || "#3498db"} />
      </svg>
    </div>
  );
};

export default Avatar;
