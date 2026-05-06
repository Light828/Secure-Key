import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxItem {
  title: string;
  category: string;
  desc: string;
  imageUrl?: string;
}

interface GalleryLightboxProps {
  items: LightboxItem[];
  initialIndex: number;
  onClose: () => void;
}

export default function GalleryLightbox({
  items,
  initialIndex,
  onClose,
}: GalleryLightboxProps) {
  const [current, setCurrent] = useState(initialIndex);
  const item = items[current];

  const goNext = useCallback(() => {
    setCurrent((i) => (i + 1) % items.length);
  }, [items.length]);

  const goPrev = useCallback(() => {
    setCurrent((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md"
        onClick={onClose}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-card border border-border text-foreground hover:text-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Counter */}
        <div className="absolute top-4 left-4 text-sm text-muted-foreground">
          {current + 1} / {items.length}
        </div>

        {/* Previous */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card border border-border text-foreground hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        {/* Next */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card border border-border text-foreground hover:text-primary transition-colors"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Content */}
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="max-w-3xl w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image area */}
          <div className="h-72 sm:h-96 bg-card rounded-t-2xl border border-border border-b-0 flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <div className="h-16 w-16 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <span className="text-primary text-2xl font-bold">
                    {item.category.charAt(0)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground tracking-wider uppercase">
                  {item.category}
                </span>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="p-6 bg-card rounded-b-2xl border border-border border-t-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary tracking-wider uppercase">
                {item.category}
              </span>
            </div>
            <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {item.desc}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
