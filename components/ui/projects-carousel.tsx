"use client";

import type React from "react";

import { useCallback, useEffect, useRef, useState } from "react";

import type { EmblaCarouselType, EmblaOptionsType } from "embla-carousel";

import useEmblaCarousel from "embla-carousel-react";

import Autoplay from "embla-carousel-autoplay";

import { ChevronLeft, ChevronRight } from "lucide-react";

type PropType = {
  slides: React.ReactNode[];
  options?: EmblaOptionsType;
};

const ProjectsCarousel: React.FC<PropType> = (props) => {
  const { slides, options } = props;
  const progressNode = useRef<HTMLDivElement>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      ...options,
      duration: 25,
      startIndex: 0,
      watchDrag: options?.watchDrag !== undefined ? options.watchDrag : true,
      dragFree: options?.dragFree !== undefined ? options.dragFree : false,
      axis: options?.axis || 'x',
    },
    [
      Autoplay({
        playOnInit: true,
        delay: 4000,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
        stopOnFocusIn: false,
      }),
    ]
  );

  const { showAutoplayProgress } = useAutoplayProgress(
    emblaApi,
    progressNode as React.RefObject<HTMLElement>
  );

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const scrollPrev = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollPrev();
    }
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (emblaApi) {
      emblaApi.scrollNext();
    }
  }, [emblaApi]);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on("select", onSelect).on("reInit", onSelect);
    onSelect();
  }, [emblaApi]);

  return (
    <div className="w-full group relative">
      <div className="relative overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="flex touch-pan-x touch-pinch-zoom will-change-transform">
          {slides.map((slideContent, index) => (
            <div className="flex-[0_0_78%] md:flex-[0_0_62%] lg:flex-[0_0_52%] pl-4 md:pl-6 transform-gpu min-w-0 select-none" key={index}>
              {slideContent}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows - Outside drag container, only visible on hover */}
      <button
        onClick={scrollPrev}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        disabled={!canScrollPrev}
        className="absolute left-1 sm:left-2 md:left-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90 hover:border-white/40 hover:scale-110 disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Anterior"
        type="button"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 pointer-events-none" />
      </button>
      <button
        onClick={scrollNext}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        disabled={!canScrollNext}
        className="absolute right-1 sm:right-2 md:right-3 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/90 hover:border-white/40 hover:scale-110 disabled:opacity-0 disabled:cursor-not-allowed cursor-pointer"
        aria-label="Siguiente"
        type="button"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white flex-shrink-0 pointer-events-none" />
      </button>
      <div className="flex flex-col items-center justify-center w-full mt-7">
        <div className="flex justify-center items-center gap-1.5 sm:gap-2">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={`h-1.5 sm:h-2 rounded-full border border-white/20 transition-all duration-300 ease-out ${index === selectedIndex
                  ? "w-8 sm:w-10 bg-gray-500 border-gray-500 shadow-lg shadow-gray-500/30"
                  : "w-1.5 sm:w-2 bg-transparent hover:bg-white/10 hover:border-white/40"
                }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

type UseDotButtonType = {
  selectedIndex: number;
  scrollSnaps: number[];
  onDotButtonClick: (index: number) => void;
};

export const useDotButton = (
  emblaApi: EmblaCarouselType | undefined
): UseDotButtonType => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const onDotButtonClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  const onInit = useCallback((emblaApi: EmblaCarouselType) => {
    setScrollSnaps(emblaApi.scrollSnapList());
  }, []);

  const onSelect = useCallback((emblaApi: EmblaCarouselType) => {
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    onInit(emblaApi);
    onSelect(emblaApi);

    emblaApi.on("reInit", onInit).on("reInit", onSelect).on("select", onSelect);
  }, [emblaApi, onInit, onSelect]);

  return {
    selectedIndex,
    scrollSnaps,
    onDotButtonClick,
  };
};

type PropTypeButton = React.PropsWithChildren<
  React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
>;

export const DotButton: React.FC<PropTypeButton> = (props) => {
  const { children, ...restProps } = props;

  return (
    <button type="button" {...restProps}>
      {children}
    </button>
  );
};

type UseAutoplayProgressType = {
  showAutoplayProgress: boolean;
};

export const useAutoplayProgress = <ProgressElement extends HTMLElement>(
  emblaApi: EmblaCarouselType | undefined,
  progressNode: React.RefObject<ProgressElement>
): UseAutoplayProgressType => {
  const [showAutoplayProgress, setShowAutoplayProgress] = useState(false);
  const animationName = useRef("");
  const timeoutId = useRef(0);
  const rafId = useRef(0);

  const startProgress = useCallback((timeUntilNext: number | null) => {
    const node = progressNode.current;
    if (!node) return;
    if (timeUntilNext === null) return;

    if (!animationName.current) {
      const style = window.getComputedStyle(node);
      animationName.current = style.animationName;
    }

    node.style.animationName = "none";
    node.style.transform = "translate3d(0,0,0)";

    rafId.current = window.requestAnimationFrame(() => {
      timeoutId.current = window.setTimeout(() => {
        node.style.animationName = animationName.current;
        node.style.animationDuration = `${timeUntilNext}ms`;
      }, 0);
    });

    setShowAutoplayProgress(true);
  }, []);

  useEffect(() => {
    const autoplay = emblaApi?.plugins()?.autoplay;

    if (!autoplay) return;

    emblaApi
      .on("autoplay:timerset", () => startProgress(autoplay.timeUntilNext()))
      .on("autoplay:timerstopped", () => setShowAutoplayProgress(false));
  }, [emblaApi]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafId.current);
      clearTimeout(timeoutId.current);
    };
  }, []);

  return {
    showAutoplayProgress,
  };
};

export { ProjectsCarousel };
