import { useCallback, useEffect, useRef, useState } from "react";

const LEAVE_AT = 3800;
const REMOVE_AT = 4450;
const LEAVE_DURATION = 520;

// Заставка привязана к загрузке документа, а не к навигации внутри SPA.
// Значение вычисляется один раз при выполнении модуля, то есть ровно один раз
// на загрузку страницы: при первом заходе и при каждом обновлении (F5) модуль
// выполняется заново и флаг снова становится true. Переход на «/» с другой
// страницы идёт через history API, без перезагрузки — модуль не переисполняется,
// флаг уже снят, и заставка не повторяется.
let introPending = typeof window !== "undefined" && window.location.pathname === "/";

export function SiteIntro() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (!introPending) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    return true;
  });
  const [leaving, setLeaving] = useState(false);

  // Точный указатель + hover = десктоп, значит есть физическая клавиатура.
  // На телефоне подсказку про Enter не показываем — там остаётся только кнопка.
  const [hasKeyboard] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  });

  const leavingRef = useRef(false);
  const dismissTimer = useRef<number | undefined>(undefined);

  // Снимаем флаг после монтирования, а не в инициализаторе useState:
  // под StrictMode инициализатор вызывается дважды и сам себя бы погасил.
  useEffect(() => {
    introPending = false;
  }, []);

  const dismiss = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    dismissTimer.current = window.setTimeout(() => setVisible(false), LEAVE_DURATION);
  }, []);

  useEffect(() => {
    if (!visible) return;

    document.documentElement.classList.add("ferma-intro-active");
    const leaveTimer = window.setTimeout(() => {
      leavingRef.current = true;
      setLeaving(true);
    }, LEAVE_AT);
    const removeTimer = window.setTimeout(() => setVisible(false), REMOVE_AT);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
      document.documentElement.classList.remove("ferma-intro-active");
    };
  }, [visible]);

  // Enter пропускает заставку на десктопе.
  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.repeat) return;
      e.preventDefault();
      dismiss();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, dismiss]);

  useEffect(() => () => window.clearTimeout(dismissTimer.current), []);

  if (!visible) return null;

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
          <img className="ferma-intro__logo ferma-intro__logo--dark" src="/brand/logo-192.webp" alt="" />
          <img className="ferma-intro__logo ferma-intro__logo--light" src="/brand/logo-light-192.webp" alt="" />
        </div>
        <svg className="ferma-intro__field" viewBox="0 0 720 110" fill="none">
          <path d="M8 94C174 25 354 20 712 82" />
          <path d="M62 106C224 52 391 48 665 94" />
          <path d="M145 110C284 76 430 74 590 102" />
        </svg>
      </div>
      <button className="ferma-intro__skip" type="button" onClick={dismiss}>
        Пропустить
        {hasKeyboard && <kbd className="ferma-intro__key">Enter</kbd>}
      </button>
    </div>
  );
}
