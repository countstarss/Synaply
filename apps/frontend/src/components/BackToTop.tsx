"use client"

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > window.innerHeight) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 transition-opacity duration-300
        ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      <div className='relative p-3 rounded-full bg-indigo-500 text-white shadow-lg
        hover:bg-indigo-600 hover:shadow-xl transform-gpu hover:scale-95
        transition-[background-color,box-shadow] duration-300 ease-in-out
        group'>
        <div className='transform-gpu transition-transform duration-300 ease-in-out group-hover:scale-95'>
          <ArrowUp className='w-5 h-5' />
        </div>
      </div>
    </div>
  );
} 