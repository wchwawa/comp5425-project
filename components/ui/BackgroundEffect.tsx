'use client';

import React, { useState, useEffect } from 'react';

// Function to generate random float between min and max
const random = (min: number, max: number) => Math.random() * (max - min) + min;

export default function BackgroundEffect() {
  const numDustMotes = 199; // Reduced again for performance
  const [isClient, setIsClient] = useState(false);

  // 只在客户端渲染后再显示随机元素
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
      {/* Basic black background */}
      {/* Removed the separate bg-black div as it's now on the parent */}
      {/* <div className="absolute inset-0 bg-black" /> */}

      {/* Dawn effect - enhanced animation & dust motes */}
      <div className="absolute top-0 left-0 w-full h-full animate-pulse-light">
        {/* Main light cone */}
        <div
          className="absolute top-0 left-0 w-[100%] h-[100%]"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 0% 0%, #6366F1 0%, rgba(99, 102, 241, 0.2) 35%, rgba(0,0,0,0) 60%)',
            opacity: 0.6,
            transform: 'translateZ(0)'
          }}
        />
        {/* Secondary halo - adds softness */}
        <div
          className="absolute top-0 left-0 w-[115%] h-1/2"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 0% 0%, rgba(126, 107, 250, 0.15) 0%, rgba(147, 51, 234, 0.03) 45%, rgba(0,0,0,0) 65%)',
            opacity: 0.7,
            transform: 'translateZ(0)'
          }}
        />

        {/* Dust mote container - limited to light effect area */}
        {isClient && (
          <div className="absolute top-0 left-0 w-[100%] h-[100%] overflow-hidden">
            {[...Array(numDustMotes)].map((_, i) => {
              const size = random(1.5, 2.5); // Increased size range
              const duration = random(15, 30);
              const delay = random(0, 15);
              // Concentrate particles towards top-left
              const initialTop = random(0, 60);
              const initialLeft = random(0, 60);
              // Adjust initial opacity for visibility
              const initialOpacity = random(0.4, 0.8);

              return (
                <div
                  key={i}
                  // Changed color to match new theme
                  className="absolute rounded-full bg-indigo-300 animate-drift"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    top: `${initialTop}%`,
                    left: `${initialLeft}%`,
                    opacity: initialOpacity,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    transform: 'translateZ(0)'
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes pulse-light {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6; /* Increased peak opacity */
            transform: scale(1.03);
          }
        }

        @keyframes drift {
          0% {
            transform: translate(0px, 0px);
            opacity: inherit; /* Start with random initial opacity */
          }
          /* Attraction Phase */
          50% {
            /* Move towards top-left relative to start */
            transform: translate(-15px, -20px);
            opacity: 0.7; /* Slightly increase opacity */
          }
          /* Falling Phase */
          100% {
            /* Move downwards relative to 50% position, fade out */
            /* Net Y move from start = -20px + 45px = +25px */
            /* Net X move from start = -15px + 3px = -12px (example) */
            transform: translate(-12px, 25px); /* Downward drift */
            opacity: 0; /* Fade out */
          }
        }

        .animate-pulse-light {
          animation: pulse-light 12s ease-in-out infinite;
        }

        .animate-drift {
          animation-name: drift;
          animation-timing-function: ease-in-out; /* Use ease-in-out for smoother transitions */
          animation-iteration-count: infinite;
          /* Duration and delay are set inline */
        }
      `}</style>
    </div>
  );
}
