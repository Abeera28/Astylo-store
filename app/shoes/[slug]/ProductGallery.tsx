"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Navigation, Pagination, Zoom } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/zoom";

export default function ProductGallery({
  images,
  name,
  selected,
  onSelect,
}: {
  images: string[];
  name: string;
  selected: number;
  onSelect: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selected);
  const activeRef = useRef(selected);
  const swiperRef = useRef<SwiperType | null>(null);

  function openAt(index: number) {
    activeRef.current = index;
    setActive(index);
    setOpen(true);
  }

  const close = useCallback(() => {
    onSelect(activeRef.current);
    setOpen(false);
  }, [onSelect]);

  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return (
    <div>
      <button
        type="button"
        className="gallery-main"
        onClick={() => openAt(selected)}
        aria-label="Open photo viewer"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[selected]}
          alt={name}
          className="w-full aspect-square object-cover rounded-xl border"
        />
        <span className="gallery-hint" aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
          </svg>
          Tap to zoom
        </span>
      </button>

      <div className="gallery-thumbs flex gap-2 mt-3 overflow-x-auto">
        {images.map((img, index) => (
          <button
            key={img}
            type="button"
            onClick={() => onSelect(index)}
            className={`shrink-0 rounded-lg overflow-hidden border-2 ${
              index === selected ? "border-black" : "border-transparent"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img}
              alt={`${name} view ${index + 1}`}
              className="w-20 h-20 object-cover"
            />
          </button>
        ))}
      </div>

      {open &&
        createPortal(
          <div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${name} photos`}
          >
            <div className="lightbox-top">
              <span className="lightbox-count">
                {active + 1} / {images.length}
              </span>
              <div className="lightbox-tools">
                <button
                  type="button"
                  className="lightbox-btn"
                  aria-label="Zoom out"
                  onClick={() => swiperRef.current?.zoom.out()}
                >
                  −
                </button>
                <button
                  type="button"
                  className="lightbox-btn"
                  aria-label="Zoom in"
                  onClick={() => swiperRef.current?.zoom.in()}
                >
                  +
                </button>
                <button
                  type="button"
                  className="lightbox-btn"
                  aria-label="Close"
                  onClick={close}
                >
                  ✕
                </button>
              </div>
            </div>

            <Swiper
              className="lightbox-swiper"
              modules={[Zoom, Pagination, Navigation, Keyboard]}
              zoom={{ maxRatio: 3 }}
              pagination={{ clickable: true }}
              navigation
              keyboard={{ enabled: true }}
              initialSlide={active}
              slidesPerView={1}
              onSwiper={(s) => {
                swiperRef.current = s;
              }}
              onSlideChange={(s) => {
                activeRef.current = s.activeIndex;
                setActive(s.activeIndex);
              }}
            >
              {images.map((src, i) => (
                <SwiperSlide key={src}>
                  <div className="swiper-zoom-container">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${name} view ${i + 1}`} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>,
          document.body
        )}
    </div>
  );
}