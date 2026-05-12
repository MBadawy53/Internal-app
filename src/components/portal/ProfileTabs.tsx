"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";

type TabId = "password";

interface Tab {
  id: TabId;
  labelKey: string;
}

const TABS: Tab[] = [
  // Add more tabs here (e.g. profile info) and route them in the switch below.
  { id: "password", labelKey: "password.title" },
];

export function ProfileTabs() {
  const t = useTranslations("profile");
  const [active, setActive] = useState<TabId>("password");

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex gap-2 border-b">
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors " +
                (selected
                  ? "border-brand-700 text-brand-700"
                  : "border-transparent text-muted-foreground hover:text-foreground")
              }
            >
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">{active === "password" ? <ChangePasswordForm /> : null}</div>
    </div>
  );
}
