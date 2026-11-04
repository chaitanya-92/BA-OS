import type { ReactNode } from "react";
import {
  LightBulbIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CalculatorIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

type CalloutKind = "note" | "trap" | "shortcut" | "formula" | "remember";

const styles: Record<CalloutKind, {
  label: string;
  icon: typeof LightBulbIcon;
  className: string;
}> = {
  note: {
    label: "Study note",
    icon: InformationCircleIcon,
    className: "learning-callout--note",
  },
  trap: {
    label: "Common trap",
    icon: ExclamationTriangleIcon,
    className: "learning-callout--trap",
  },
  shortcut: {
    label: "Shortcut",
    icon: BoltIcon,
    className: "learning-callout--shortcut",
  },
  formula: {
    label: "Formula",
    icon: CalculatorIcon,
    className: "learning-callout--formula",
  },
  remember: {
    label: "Remember",
    icon: LightBulbIcon,
    className: "learning-callout--remember",
  },
};

export function LearningCallout({
  kind = "note",
  title,
  children,
}: {
  kind?: CalloutKind;
  title?: string;
  children: ReactNode;
}) {
  const style = styles[kind];
  const Icon = style.icon;

  return (
    <aside className={`learning-callout ${style.className}`} aria-label={title ?? style.label}>
      <div className="learning-callout__heading">
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        <span>{title ?? style.label}</span>
      </div>
      <div className="learning-callout__content">{children}</div>
    </aside>
  );
}
