import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type OverlayPosition = "left" | "bottom" | "none";

export interface HeroVideoSource {
  src: string;
  type?: string;
  /** Медиа-запрос, например "(max-width: 767px)": браузер берёт первый подходящий источник. */
  media?: string;
}

export interface FarmHeroSectionProps {
  /** Фоновый кадр фермы. Служит и постером, когда задано видео. */
  imageSrc: string;
  /** Набор ширин для адаптивной загрузки кадра. */
  srcSet?: string;
  /** Подсказка о ширине отрисовки; работает в паре с srcSet. */
  sizes?: string;
  /** Необязательное фоновое видео. Без него секция остаётся статичным кадром. */
  videoSources?: HeroVideoSource[];
  /** object-position кадра: какую часть удерживать в видимой области при кропе. */
  imagePosition?: string;
  /** С какой стороны затемнять кадр, чтобы текст читался. */
  overlay?: OverlayPosition;
  /** Сила затемнения, 0…1. */
  overlayStrength?: number;
  className?: string;
  children?: ReactNode;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

type NetworkInformation = { saveData?: boolean; effectiveType?: string };

/** Видео не грузим, если просили меньше движения, включена экономия трафика или сеть медленная. */
function canAutoplayVideo() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const conn = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType && /(^|-)2g$/.test(conn.effectiveType)) return false;
  return true;
}

/**
 * Полноэкранная подложка героя: кадр фермы, затемнение под текст и контент поверх.
 * Градиенты задаются инлайн-стилями, а не собранными на лету классами Tailwind —
 * динамические имена классов не попадают в сборку.
 */
export function FarmHeroSection({
  imageSrc,
  srcSet,
  sizes,
  videoSources,
  imagePosition = "center",
  overlay = "left",
  overlayStrength = 0.7,
  className,
  children,
}: FarmHeroSectionProps) {
  const s = clamp01(overlayStrength);
  const hasVideo = !!videoSources?.length;
  const [playVideo, setPlayVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!hasVideo) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPlayVideo(canAutoplayVideo());
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [hasVideo]);

  // Не тратим батарею: видео играет, только пока секция видна и вкладка активна.
  useEffect(() => {
    const root = rootRef.current;
    const video = videoRef.current;
    if (!playVideo || !root || !video) return;

    let visible = true;
    const sync = () => {
      if (visible && !document.hidden) void video.play().catch(() => {});
      else video.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    io.observe(root);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [playVideo]);

  // До lg текст занимает почти всю ширину кадра — затемняем равномерно.
  // С lg блок текста уходит влево, и достаточно притенить только эту сторону.
  const mobileScrim =
    overlay === "none"
      ? null
      : `linear-gradient(to bottom, rgb(0 0 0 / ${s * 0.58}) 0%, rgb(0 0 0 / ${s * 0.84}) 50%, rgb(0 0 0 / ${s * 0.94}) 100%)`;

  const desktopScrim =
    overlay === "none"
      ? null
      : overlay === "bottom"
        ? `linear-gradient(to top, rgb(0 0 0 / ${s * 0.9}) 0%, rgb(0 0 0 / ${s * 0.45}) 45%, rgb(0 0 0 / 0.08) 100%)`
        : `linear-gradient(to right, rgb(0 0 0 / ${s}) 0%, rgb(0 0 0 / ${s * 0.9}) 48%, rgb(0 0 0 / ${s * 0.5}) 76%, rgb(0 0 0 / 0.08) 100%)`;

  // Прозрачный хедер лежит поверх кадра — притеняем верх, чтобы меню читалось.
  const topScrim = "linear-gradient(to bottom, rgb(0 0 0 / 0.45) 0%, rgb(0 0 0 / 0) 100%)";

  const crop: CSSProperties = { objectPosition: imagePosition };

  return (
    <div ref={rootRef} className={cn("relative isolate w-full overflow-hidden", className)}>
      <img
        src={imageSrc}
        srcSet={srcSet}
        sizes={sizes}
        alt=""
        aria-hidden
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        style={crop}
      />

      {hasVideo && playVideo && (
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster={imageSrc}
          aria-hidden
          onPlaying={() => setVideoReady(true)}
          className={cn(
            "absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700",
            videoReady ? "opacity-100" : "opacity-0",
          )}
          style={crop}
        >
          {videoSources!.map((v) => (
            <source key={v.src} src={v.src} type={v.type ?? "video/mp4"} media={v.media} />
          ))}
        </video>
      )}

      {mobileScrim && (
        <div aria-hidden className="absolute inset-0 -z-10 lg:hidden" style={{ background: mobileScrim }} />
      )}
      {desktopScrim && (
        <div aria-hidden className="absolute inset-0 -z-10 hidden lg:block" style={{ background: desktopScrim }} />
      )}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-32" style={{ background: topScrim }} />

      {children}
    </div>
  );
}
