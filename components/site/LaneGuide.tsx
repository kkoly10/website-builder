"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

type Lane = "websites" | "ecommerce" | "workflows";

type Step =
  | { type: "question"; id: string; text: string; options: { label: string; scores: Record<Lane, number> }[] }
  | { type: "result" };

const steps: Step[] = [
  {
    type: "question",
    id: "pain",
    text: "What feels like the biggest bottleneck in your business right now?",
    options: [
      {
        label: "People don't trust us or take us seriously online",
        scores: { websites: 3, ecommerce: 0, workflows: 0 },
      },
      {
        label: "We're losing sales or leads are falling through the cracks",
        scores: { websites: 1, ecommerce: 2, workflows: 1 },
      },
      {
        label: "We sell online but checkout or product flow is clunky",
        scores: { websites: 0, ecommerce: 3, workflows: 0 },
      },
      {
        label: "Too much manual work, messy handoffs, or disconnected tools",
        scores: { websites: 0, ecommerce: 0, workflows: 3 },
      },
    ],
  },
  {
    type: "question",
    id: "goal",
    text: "If you could fix one thing this quarter, what would it be?",
    options: [
      {
        label: "A website that actually converts visitors into clients",
        scores: { websites: 3, ecommerce: 0, workflows: 0 },
      },
      {
        label: "A storefront or checkout that makes buying effortless",
        scores: { websites: 0, ecommerce: 3, workflows: 0 },
      },
      {
        label: "Systems that handle the repetitive stuff automatically",
        scores: { websites: 0, ecommerce: 0, workflows: 3 },
      },
      {
        label: "Honestly not sure yet — I just know something needs to change",
        scores: { websites: 1, ecommerce: 1, workflows: 1 },
      },
    ],
  },
  {
    type: "question",
    id: "context",
    text: "Which of these sounds most like your situation?",
    options: [
      {
        label: "We're a service business that needs a stronger online presence",
        scores: { websites: 3, ecommerce: 0, workflows: 0 },
      },
      {
        label: "We sell products and need a better buying experience",
        scores: { websites: 0, ecommerce: 3, workflows: 0 },
      },
      {
        label: "Our team wastes hours on things that should be automated",
        scores: { websites: 0, ecommerce: 0, workflows: 3 },
      },
      {
        label: "A mix — we need help in more than one area",
        scores: { websites: 1, ecommerce: 1, workflows: 1 },
      },
    ],
  },
  { type: "result" },
];

const laneResults: Record<Lane, {
  name: string;
  tag: string;
  reason: string;
  href: string;
  startHref: string;
  startLabel: string;
}> = {
  websites: {
    name: "Website Building",
    tag: "Grow",
    reason:
      "Your answers point to a trust and conversion problem. A stronger website is the highest-leverage fix — it shapes how people perceive your business before they ever talk to you.",
    href: "/websites",
    startHref: "/build/intro",
    startLabel: "Get Website Quote",
  },
  ecommerce: {
    name: "E-commerce Systems",
    tag: "Sell",
    reason:
      "Your answers point to friction in how people buy from you. A cleaner storefront, better product pages, and smoother checkout will directly impact revenue.",
    href: "/ecommerce",
    startHref: "/ecommerce/intake",
    startLabel: "Start E-commerce Intake",
  },
  workflows: {
    name: "Workflow Automation",
    tag: "Streamline",
    reason:
      "Your answers point to operational drag. Automating the repetitive work, cleaning up handoffs, and connecting your tools will free up hours every week.",
    href: "/systems",
    startHref: "/ops-intake",
    startLabel: "Start Workflow Audit",
  },
};

function getRecommendation(scores: Record<Lane, number>): Lane {
  const entries = Object.entries(scores) as [Lane, number][];
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export default function LaneGuide() {
  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState<Record<Lane, number>>({
    websites: 0,
    ecommerce: 0,
    workflows: 0,
  });
  const [answers, setAnswers] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentStep, started]);

  function handleAnswer(option: { label: string; scores: Record<Lane, number> }) {
    setAnswers((prev) => [...prev, option.label]);
    setScores((prev) => ({
      websites: prev.websites + option.scores.websites,
      ecommerce: prev.ecommerce + option.scores.ecommerce,
      workflows: prev.workflows + option.scores.workflows,
    }));
    setCurrentStep((prev) => prev + 1);
  }

  function reset() {
    setCurrentStep(0);
    setScores({ websites: 0, ecommerce: 0, workflows: 0 });
    setAnswers([]);
    setStarted(false);
  }

  const step = steps[currentStep];
  const recommended = step?.type === "result" ? laneResults[getRecommendation(scores)] : null;

  return (
    <div className="guideShell">
      {!started ? (
        <div className="guideIntro">
          <div className="guideIntroIcon">?</div>
          <h3 className="guideIntroTitle">Not sure where to start?</h3>
          <p className="guideIntroText">
            Answer a few quick questions and we will point you to the right
            service lane — with a clear reason why.
          </p>
          <button
            type="button"
            className="btn btnPrimary"
            onClick={() => setStarted(true)}
          >
            Guide Me <span className="btnArrow">→</span>
          </button>
        </div>
      ) : (
        <div className="guideChat">
          <div className="guideChatScroll">
            {steps.slice(0, currentStep + 1).map((s, i) => {
              if (s.type === "question") {
                const answered = i < currentStep;
                return (
                  <div key={s.id} className="guideTurn">
                    <div className="guideBubbleBot">
                      <div className="guideBotAvatar">CS</div>
                      <div className="guideBubbleText">{s.text}</div>
                    </div>

                    {answered ? (
                      <div className="guideBubbleUser">
                        <div className="guideBubbleText">{answers[i]}</div>
                      </div>
                    ) : (
                      <div className="guideOptions">
                        {s.options.map((opt) => (
                          <button
                            key={opt.label}
                            type="button"
                            className="guideOptionBtn"
                            onClick={() => handleAnswer(opt)}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (s.type === "result" && recommended) {
                return (
                  <div key="result" className="guideTurn">
                    <div className="guideBubbleBot">
                      <div className="guideBotAvatar">CS</div>
                      <div className="guideBubbleText">
                        Based on your answers, here is our recommendation:
                      </div>
                    </div>

                    <div className="guideResult">
                      <div className="guideResultTag">{recommended.tag}</div>
                      <h4 className="guideResultTitle">{recommended.name}</h4>
                      <p className="guideResultReason">{recommended.reason}</p>

                      <div className="guideResultActions">
                        <Link
                          href={recommended.href}
                          className="btn btnGhost"
                        >
                          Learn More
                        </Link>
                        <Link
                          href={recommended.startHref}
                          className="btn btnPrimary"
                        >
                          {recommended.startLabel}{" "}
                          <span className="btnArrow">→</span>
                        </Link>
                      </div>

                      <button
                        type="button"
                        className="guideResetBtn"
                        onClick={reset}
                      >
                        Start over
                      </button>
                    </div>
                  </div>
                );
              }

              return null;
            })}

            <div ref={chatEndRef} />
          </div>
        </div>
      )}
    </div>
  );
}
