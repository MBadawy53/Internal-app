"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";
import { ProfileInfoForm, type ProfileInfoInitial } from "@/components/portal/ProfileInfoForm";

type TabId = "info" | "password";

interface Tab {
  id: TabId;
  labelKey: string;
}

const TABS: Tab[] = [
  { id: "info", labelKey: "info.title" },
  { id: "password", labelKey: "password.title" },
];

export function ProfileTabs({ initial }: { initial: ProfileInfoInitial }) {
  const t = useTranslations("profile");
  const [active, setActive] = useState<TabId>("info");

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

      <div role="tabpanel">
        {active === "info" ? <ProfileInfoForm initial={initial} /> : <ChangePasswordForm />}
      </div>
    </div>
  );
}
