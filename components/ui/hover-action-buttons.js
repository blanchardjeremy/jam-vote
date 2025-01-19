export default function HoverActionButtons({ children }) {
  return (
    <div>
      {/* Desktop/Mouse view - show on hover */}
      <div className="hidden [@media(hover:hover)]:flex [@media(hover:hover)]:opacity-0 group-hover:opacity-100 items-center gap-1 md:gap-2">
        {children}
      </div>

      {/* Touch device view - always show */}
      <div className="[@media(hover:hover)]:hidden flex items-center gap-1 md:gap-2">
        {children}
      </div>
    </div>
  );
} 