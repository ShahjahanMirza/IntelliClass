import React, { useState, useEffect } from 'react';
import { ChevronUpIcon } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  // Show button when page is scrolled down
  

  // Scroll to top smoothly
  const scrollToTop = () => {
    // Check if we're in a layout with scrollable main content
    const mainElement = document.querySelector('main.flex-1.overflow-y-auto');
    
    if (mainElement) {
      // We're in the Layout component, scroll the main element
      mainElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      // We're on Landing page or other pages without Layout, scroll the window
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      // Check if we're in a layout with scrollable main content
      const mainElement = document.querySelector('main.flex-1.overflow-y-auto');
      let scrollY = 0;
      
      if (mainElement) {
        // We're in the Layout component, use main element's scroll
        scrollY = mainElement.scrollTop;
      } else {
        // We're on Landing page or other pages without Layout, use window scroll
        scrollY = window.scrollY;
      }
      
      const shouldBeVisible = scrollY > 150;
      setIsVisible(shouldBeVisible);
    };

    // Add listeners to both window and main element
    const mainElement = document.querySelector('main.flex-1.overflow-y-auto');
    
    window.addEventListener('scroll', handleScroll);
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [location.pathname]);

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-[9999] bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          <ChevronUpIcon className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default ScrollToTopButton;