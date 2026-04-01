import { useState, useEffect, useRef } from 'react';

const useLipSync = (visemeTimeline) => {
  const [currentViseme, setCurrentViseme] = useState("Neutral");
  const audioRef = useRef(null);

  useEffect(() => {
    if (!visemeTimeline || visemeTimeline.length === 0) return;

    let timeoutIds = [];

    // Reset viseme
    setCurrentViseme("Neutral");

    // Schedule viseme changes based on the timeline
    visemeTimeline.forEach((item) => {
      const id = setTimeout(() => {
        setCurrentViseme(item.viseme);
      }, item.time * 1000);
      timeoutIds.push(id);
    });

    // Cleanup timeouts
    return () => timeoutIds.forEach(clearTimeout);
  }, [visemeTimeline]);

  return { currentViseme, setCurrentViseme };
};

export default useLipSync;
