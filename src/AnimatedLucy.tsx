/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useEffect, useMemo, useState } from "react";
import { motion, useCycle, useReducedMotion, useTransform, Variants } from "framer-motion";
import { useFollowCursor } from "./hooks/useFollowCursor";

const IS_DEV =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === "string" &&
  (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === "development";

type LucyMood = "cunning" | "sarcastic" | "excited" | "curious" | "idle" | "success";

type AnimatedLucyProps = {
  showMoodPanel?: boolean;
};

type LucyQuotes = {
  idle: string[];
  hover_nav: string[];
  qpay_hover: string[];
  success: string[];
  sarcastic_random: string[];
};

const defaultMoodBubbleText: Record<LucyMood, string> = {
  idle: "Чи ер нь хөдлөх үү, эсвэл би ингээд л хөвөөд байх уу?",
  cunning: "Миний зальжин ухаан чиний дараагийн алхмыг хэдийнэ таачихсан шүү.",
  sarcastic: "Өө, ямар хурдан юм бэ... Бараг л яст мэлхий шиг.",
  excited: "Би чамайг 'Тийм' гэж хэлнэ гэдгийг аль эрт мэдэрсэн юм!",
  curious: "Тэр хаалганы цаана юу байгааг харах гээ юу? Сонирхолтой л юм.",
  success: "Хөөх, чи амжилттай дуусгасан байна! Би чамайг сэтгэл хангалуун харж байна.",
};

const moodCategory: Record<LucyMood, keyof LucyQuotes> = {
  idle: "idle",
  cunning: "sarcastic_random",
  sarcastic: "sarcastic_random",
  excited: "qpay_hover",
  curious: "hover_nav",
  success: "success",
};

const lucyVariants: Variants = {
  idle: {
    scale: 1,
    rotate: 0,
    y: [0, -6, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  cunning: {
    scale: 1.02,
    rotate: -1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
  sarcastic: {
    scale: 1,
    rotate: 2,
    transition: { duration: 0.5, ease: "easeInOut" },
  },
  excited: {
    scale: 1.12,
    rotate: 0,
    y: [0, -12, 0],
    transition: {
      duration: 0.5,
      repeat: 2,
      repeatType: "reverse",
      ease: "easeInOut",
    },
  },
  curious: {
    scale: 1.04,
    rotate: 0.8,
    transition: { duration: 0.35, ease: "easeOut" },
  },
  success: {
    scale: 1.18,
    rotate: 0,
    y: [0, -16, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut",
    },
    boxShadow: "0 0 26px rgba(255, 220, 80, 0.8)",
  },
};

const moodOrder: LucyMood[] = ["cunning", "excited", "sarcastic", "curious", "idle", "success"];

export const AnimatedLucy: React.FC<AnimatedLucyProps> = ({ showMoodPanel = false }) => {
  const prefersReducedMotion = useReducedMotion();
  const { x: cursorX, y: cursorY } = useFollowCursor();
  const [mood, setMood] = useState<LucyMood>("cunning");
  const [bubble, setBubble] = useState<string>(defaultMoodBubbleText.cunning);
  const [quoteLibrary, setQuoteLibrary] = useState<Partial<LucyQuotes>>({});
  const [manualMoodIndex, cycleMood] = useCycle(0, 1, 2, 3, 4);

  const bodyX = useTransform(cursorX, (value: number) => (prefersReducedMotion ? 0 : value * 8));
  const bodyY = useTransform(cursorY, (value: number) => (prefersReducedMotion ? 0 : value * 6));
  const eyeX = useTransform(cursorX, (value: number) => (prefersReducedMotion ? 0 : value * 3));
  const eyeY = useTransform(cursorY, (value: number) => (prefersReducedMotion ? 0 : value * 2));

  const getRandomItem = React.useCallback((list: string[]) => list[Math.floor(Math.random() * list.length)], []);

  const getMoodQuote = React.useCallback(
    (targetMood: LucyMood) => {
      const category = moodCategory[targetMood];
      const entries = quoteLibrary[category];
      if (entries && entries.length > 0) {
        return getRandomItem(entries);
      }
      return defaultMoodBubbleText[targetMood] ?? defaultMoodBubbleText.cunning;
    },
    [quoteLibrary, getRandomItem],
  );

  const setMoodQuote = React.useCallback(
    (newMood: LucyMood) => {
      setMood(newMood);
      setBubble(getMoodQuote(newMood));
    },
    [getMoodQuote],
  );

  useEffect(() => {
    setBubble(getMoodQuote(mood));
  }, [mood, quoteLibrary]);

  useEffect(() => {
    let successTimer: number | undefined;

    fetch("/data/lucy-storyboard.json")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.lucy_quotes) {
          setQuoteLibrary(data.lucy_quotes);
        }
      })
      .catch(() => {
        // silent failover to hardcoded defaults
      });

    const params = new URLSearchParams(window.location.search);
    if (params.get("status") === "success") {
      setMoodQuote("success");
      successTimer = window.setTimeout(() => setMoodQuote("idle"), 10000);
    }

    const qpayButton = document.querySelector("[data-action='qpay-buy']");
    const navLinks = Array.from(document.querySelectorAll("[data-action='nav-link']"));

    const handleQpayHover = () => {
      setMoodQuote("excited");
    };
    const handleQpayLeave = () => {
      setMoodQuote("cunning");
    };

    const handleNavHover = () => {
      setMoodQuote("curious");
    };
    const handleNavLeave = () => {
      setMoodQuote("cunning");
    };

    if (qpayButton) {
      qpayButton.addEventListener("mouseenter", handleQpayHover);
      qpayButton.addEventListener("mouseleave", handleQpayLeave);
    }

    navLinks.forEach((link) => {
      link.addEventListener("mouseenter", handleNavHover);
      link.addEventListener("mouseleave", handleNavLeave);
    });

    return () => {
      if (successTimer) {
        window.clearTimeout(successTimer);
      }
      if (qpayButton) {
        qpayButton.removeEventListener("mouseenter", handleQpayHover);
        qpayButton.removeEventListener("mouseleave", handleQpayLeave);
      }
      navLinks.forEach((link) => {
        link.removeEventListener("mouseenter", handleNavHover);
        link.removeEventListener("mouseleave", handleNavLeave);
      });
    };
  }, [setMoodQuote]);

  useEffect(() => {
    const hotkeyHandler = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key.toLowerCase() === "k") {
        setMoodQuote("excited");
      }
    };

    window.addEventListener("keydown", hotkeyHandler);
    return () => window.removeEventListener("keydown", hotkeyHandler);
  }, [setMoodQuote]);

  useEffect(() => {
    const idx = manualMoodIndex as number;
    setMoodQuote(moodOrder[idx]);
  }, [manualMoodIndex]);

  const activeVariant = prefersReducedMotion ? "cunning" : mood;
  const showPanel = showMoodPanel || IS_DEV;

  const moodPanel = useMemo(() => {
    if (!showPanel) return null;

    return React.createElement(
      "div",
      { className: "lucy-mood-selector", "aria-label": "Lucy mood selector" },
      ...moodOrder.map((entry) =>
        React.createElement(
          "button",
          {
            key: entry,
            type: "button",
            onClick: () => {
              setMoodQuote(entry);
            },
            className: `lucy-mood-btn ${entry === mood ? "active" : ""}`,
          },
          entry
        )
      ),
      React.createElement(
        "button",
        {
          type: "button",
          className: "lucy-mood-btn",
          onClick: () => cycleMood(),
        },
        "Cycle mood"
      )
    );
  }, [mood, cycleMood, showPanel]);

  const successEffect = mood === "success"
    ? React.createElement(
        motion.div,
        {
          className: "lucy-confetti" ,
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: 0.6, ease: "easeOut" },
        },
        React.createElement("div", { className: "confetti-dot c1" }),
        React.createElement("div", { className: "confetti-dot c2" }),
        React.createElement("div", { className: "confetti-dot c3" }),
        React.createElement("div", { className: "confetti-dot c4" }),
        React.createElement("div", { className: "confetti-dot c5" })
      )
    : null;

  const pointingCallout = mood === "success"
    ? React.createElement(
        "div",
        { className: "lucy-pointer" },
        "→ Download/Access"
      )
    : null;

  return React.createElement(
    "section",
    { className: "lucy-wrapper", "aria-live": "polite" },
    React.createElement(
      motion.div,
      {
        className: "lucy-body",
        initial: "idle",
        animate: activeVariant,
        variants: lucyVariants,
        style: { x: bodyX, y: bodyY },
      },
      React.createElement("img", {
        src: "/lucy-character.png",
        alt: "Lucy Gray R interactive character",
        className: "lucy-image",
        loading: "lazy",
        style: { imageRendering: "auto" },
      }),
      React.createElement(
        "svg",
        { className: "lucy-eye-overlay", viewBox: "0 0 140 70", fill: "none", "aria-hidden": "true" },
        React.createElement(
          "g",
          { className: "lucy-eye-group", style: { x: eyeX, y: eyeY } },
          React.createElement("ellipse", {
            cx: "70",
            cy: "35",
            rx: "26",
            ry: "14",
            fill: "#ffffff",
            stroke: "#4a5d23",
            strokeWidth: "2",
          }),
          React.createElement("circle", { cx: "70", cy: "35", r: "8", fill: "#0077b6" }),
          React.createElement("circle", { cx: "72", cy: "33", r: "3", fill: "#ffffff", opacity: 0.8 })
        )
      )
    ),
    React.createElement(
      motion.div,
      {
        className: "lucy-bubble",
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.25, ease: "easeOut" },
      },
      React.createElement("p", null, bubble)
    ),
    moodPanel,
    successEffect,
    pointingCallout,
    React.createElement(
      "style",
      null,
      `
        :root {
          --color-moss-green: #4a5d23;
          --color-water-blue: #0077b6;
          --color-sand: #f7f5eb;
          --color-smoke: #1f2a34;
          --font-handwriting: "Patrick Hand", "Indie Flower", cursive;
        }

        .lucy-wrapper {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 1rem;
          justify-items: center;
          align-items: center;
          padding: 1.25rem;
          background: linear-gradient(135deg, rgba(0, 119, 182, 0.1), rgba(74, 93, 35, 0.08));
          color: var(--color-smoke);
        }

        .lucy-body {
          grid-column: 4 / span 6;
          position: relative;
          display: flex;
          justify-content: center;
          will-change: transform;
          animation: lucyFloat 6s ease-in-out infinite;
        }

        .lucy-confetti {
          position: absolute;
          top: -20px;
          left: -20px;
          width: 520px;
          height: 520px;
          pointer-events: none;
          z-index: 10;
          transform-origin: center;
        }

        .confetti-dot {
          position: absolute;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          animation: confettiDrop 1.2s ease-in-out infinite;
        }

        .confetti-dot.c1 { background: #f9d342; top: 10%; left: 17%; animation-delay: 0.1s; }
        .confetti-dot.c2 { background: #ff5a5f; top: 30%; left: 60%; animation-delay: 0.2s; }
        .confetti-dot.c3 { background: #0077b6; top: 55%; left: 25%; animation-delay: 0.35s; }
        .confetti-dot.c4 { background: #4a5d23; top: 68%; left: 77%; animation-delay: 0.5s; }
        .confetti-dot.c5 { background: #36b6a2; top: 80%; left: 40%; animation-delay: 0.7s; }

        .lucy-pointer {
          position: absolute;
          right: 20px;
          top: 0;
          padding: 0.35rem 0.8rem;
          background: rgba(0, 119, 182, 0.92);
          border-radius: 999px;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 8px 18px rgba(0,0,0,.24);
        }

        @keyframes confettiDrop {
          0% { opacity: 0; transform: translateY(-8px) scale(0.7); }
          40% { opacity: 1; transform: translateY(4px) scale(1); }
          100% { opacity: 0; transform: translateY(24px) scale(0.7); }
        }

        .lucy-image {
          width: 100%;
          height: auto;
          max-width: 480px;
          border-radius: 1rem;
          box-shadow: 0 12px 33px rgba(0, 0, 0, 0.2);
          image-rendering: high-quality;
        }

        .lucy-eye-overlay {
          position: absolute;
          top: 34%;
          left: 50%;
          width: 140px;
          height: 70px;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }

        .lucy-bubble {
          grid-column: 3 / span 8;
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid var(--color-moss-green);
          border-radius: 24px;
          padding: 1rem 1.25rem;
          font-family: var(--font-handwriting);
          font-size: 1.05rem;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
          max-width: 600px;
          text-align: center;
        }

        .lucy-mood-selector {
          position: fixed;
          bottom: 1rem;
          right: 1rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          max-width: min(80vw, 420px);
          justify-content: center;
          z-index: 999;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(74, 93, 35, 0.38);
          border-radius: 12px;
          padding: 0.65rem;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .lucy-mood-btn {
          background: linear-gradient(135deg, var(--color-water-blue), var(--color-moss-green));
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 999px;
          padding: 0.45rem 0.9rem;
          font-size: 0.88rem;
          cursor: pointer;
          outline: none;
          transform: translateZ(0);
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .lucy-mood-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 16px rgba(0, 0, 0, 0.2);
        }

        .lucy-mood-btn::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 140%;
          height: 140%;
          background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 50%);
          transform: translate(-50%, -50%) scale(0);
          opacity: 0;
          transition: transform 0.45s ease, opacity 0.45s ease;
          border-radius: 999px;
        }

        .lucy-mood-btn:hover::before {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }

        .lucy-mood-btn.active {
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6), inset 0 0 0 0.6px rgba(0, 0, 0, 0.3);
        }

        @keyframes lucyFloat {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .lucy-body { animation: none !important; }
          .lucy-mood-btn { transition: none; }
        }
      `
    ),
  );
};
