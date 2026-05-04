"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { Locale } from "@prisma/client";
import { LOCALE_COOKIE, isAppLocale } from "@/lib/i18n/config";
import { prisma } from "@/lib/prisma";
import { getActor } from "@/lib/auth/session";

export async function setLocaleAction(locale: string): Promise<void> {
  if (!isAppLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  });

  // Persist on the user record when authenticated.
  const actor = await getActor();
  if (actor) {
    await prisma.user.update({
      where: { id: actor.id },
      data: { locale: locale === "ar" ? Locale.AR : Locale.EN },
    });
  }

  revalidatePath("/", "layout");
}
