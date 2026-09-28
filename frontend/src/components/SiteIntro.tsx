import { useEffect, useState } from "react";

export function SiteIntro() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return true;
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    document.documentElement.classList.add("ferma-intro-active");
    const leaveTimer = window.setTimeout(() => setLeaving(true), 2800);
    const removeTimer = window.setTimeout(() => {
      setVisible(false);
    }, 3450);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
      document.documentElement.classList.remove("ferma-intro-active");
    };
  }, [visible]);

  useEffect(() => {
    if (!visible) document.documentElement.classList.remove("ferma-intro-active");
  }, [visible]);

  if (!visible) return null;

  const dismiss = () => {
    setLeaving(true);
    window.setTimeout(() => setVisible(false), 520);
  };

  return (
    <div
      className={`ferma-intro${leaving ? " ferma-intro--leaving" : ""}`}
      role="dialog"
      aria-label="Добро пожаловать в Ferma KZ"
    >
      <div className="ferma-intro__grain" aria-hidden="true" />
      <div className="ferma-intro__sun" aria-hidden="true" />
      <div className="ferma-intro__stage" aria-hidden="true">
        <span className="ferma-intro__eyebrow">ПРЯМО ОТ ФЕРМЕРОВ КАЗАХСТАНА</span>
        <div className="ferma-intro__wordmark">
          <span className="ferma-intro__ferma">ferma</span>
          <span className="ferma-intro__kz">kz</span>
        </div>
        <svg className="ferma-intro__field" viewBox="0 0 720 110" fill="none">
          <path d="M8 94C174 25 354 20 712 82" />
          <path d="M62 106C224 52 391 48 665 94" />
          <path d="M145 110C284 76 430 74 590 102" />
        </svg>
      </div>
      <button className="ferma-intro__skip" type="button" onClick={dismiss}>
        Пропустить
      </button>
    </div>
  );
}
