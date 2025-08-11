import { useEffect, useRef, useState } from 'react';

export function useHorizontalScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrollable, setIsScrollable] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    // Function to check if horizontal scrolling is needed
    const checkScrollable = () => {
      const hasHorizontalOverflow = element.scrollWidth > element.clientWidth;
      console.log('🔍 Table Scroll Check:', {
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
        hasOverflow: hasHorizontalOverflow,
        screenWidth: window.innerWidth,
        difference: element.scrollWidth - element.clientWidth
      });
      setIsScrollable(hasHorizontalOverflow);

      // Update the data attribute for CSS styling
      element.setAttribute('data-scrollable', hasHorizontalOverflow.toString());

      return hasHorizontalOverflow;
    };

    // Initial check
    checkScrollable();

    const handleWheel = (e: WheelEvent) => {
      // Only enable horizontal scrolling if content actually overflows
      const hasHorizontalOverflow = checkScrollable();

      if (hasHorizontalOverflow) {
        // Check if we're scrolling vertically and there's no vertical scroll needed
        const isVerticalScroll = Math.abs(e.deltaY) > Math.abs(e.deltaX);

        if (isVerticalScroll) {
          // Check if the page can scroll vertically
          const canScrollVertically = document.documentElement.scrollHeight > window.innerHeight;
          const isAtTop = window.scrollY <= 0;
          const isAtBottom = window.scrollY >= document.documentElement.scrollHeight - window.innerHeight;

          // Only hijack vertical scroll if:
          // 1. We can't scroll vertically, OR
          // 2. We're at the top/bottom of the page
          if (!canScrollVertically || isAtTop || isAtBottom) {
            e.preventDefault();

            // Convert vertical scroll to horizontal scroll
            const scrollAmount = e.deltaY;
            element.scrollLeft += scrollAmount;
          }
        } else {
          // For horizontal scroll, always allow it
          e.preventDefault();
          const scrollAmount = e.deltaX || e.deltaY;
          element.scrollLeft += scrollAmount;
        }
      }
    };

    // Add event listener with passive: false to allow preventDefault
    element.addEventListener('wheel', handleWheel, { passive: false });

    // Enhanced touch support for mobile devices
    let touchStartX = 0;
    let touchStartY = 0;
    let isHorizontalSwipe = false;
    let hasScrolled = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (checkScrollable()) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isHorizontalSwipe = false;
        hasScrolled = false;

        // Add visual feedback for small screens
        if (window.innerWidth <= 480) {
          element.style.cursor = 'grabbing';
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!checkScrollable()) return;

      const touchCurrentX = e.touches[0].clientX;
      const touchCurrentY = e.touches[0].clientY;
      const deltaX = touchStartX - touchCurrentX;
      const deltaY = touchStartY - touchCurrentY;

      // More sensitive horizontal swipe detection for small screens
      const threshold = window.innerWidth <= 480 ? 5 : 10;

      // Determine if this is a horizontal swipe
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        isHorizontalSwipe = true;
        hasScrolled = true;
        e.preventDefault(); // Prevent vertical scrolling

        // Provide haptic feedback on supported devices
        if ('vibrate' in navigator && window.innerWidth <= 480) {
          navigator.vibrate(10);
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (checkScrollable()) {
        element.style.cursor = '';

        // Hide scroll arrows after first interaction on small screens
        if (hasScrolled && window.innerWidth <= 480) {
          element.setAttribute('data-user-scrolled', 'true');
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Add resize observer to check scrollable state when container size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollable();
    });

    resizeObserver.observe(element);

    // Cleanup
    return () => {
      element.removeEventListener('wheel', handleWheel);
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      resizeObserver.disconnect();
    };
  }, []);

  return { scrollRef, isScrollable };
}
