"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { DonguriFootprintModal } from "@/components/loghouse/DonguriFootprintModal";
import {
  BTN_CLOSE,
  BTN_CONTINUE_DRAFT,
  BTN_DRAFT_WRITE,
  BTN_REWRITE_DRAFT,
  BTN_SKIP_TODAY,
  BTN_VIEW_DONGURI,
  DONGURI_DRAFT_RESET_CONFIRM,
  DONGURI_DRAFT_RESUME_BODY,
  DONGURI_DRAFT_RESUME_TITLE,
  DONGURI_SHORTAGE_PRE_TITLE,
  DONGURI_SHORTAGE_THRESHOLD,
  donguriShortagePreBody,
} from "@/lib/loghouse/donguriFootprintCopy";
import { DONGURI_PAGE_PATH } from "@/lib/loghouse/donguriTypes";

type GatePhase = "idle" | "shortage" | "draftResume" | "draftResetConfirm";

function todayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function withResumeDraft(href: string): string {
  try {
    const url = new URL(href, "https://local.invalid");
    url.searchParams.set("resumeDraft", "1");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

function withPreferDraft(href: string, preferDraft: boolean): string {
  if (!preferDraft) return href;
  try {
    const url = new URL(href, "https://local.invalid");
    url.searchParams.set("preferDraft", "1");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

function withFreshDraft(href: string): string {
  try {
    const url = new URL(href, "https://local.invalid");
    url.searchParams.set("freshDraft", "1");
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return href;
  }
}

export function useDonguriWriteEntryGate(profileId?: string | null) {
  const router = useRouter();
  const [phase, setPhase] = useState<GatePhase>("idle");
  const [balance, setBalance] = useState(0);
  const [checking, setChecking] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [pendingDateKey, setPendingDateKey] = useState(todayDateKey());
  const [pendingPreferDraft, setPendingPreferDraft] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const go = useCallback(
    (href: string, preferDraft: boolean, options?: { fresh?: boolean; resume?: boolean }) => {
      setPhase("idle");
      setPendingHref(null);
      let next = withPreferDraft(href, preferDraft);
      if (options?.fresh) next = withFreshDraft(next);
      if (options?.resume) next = withResumeDraft(next);
      router.push(next);
    },
    [router],
  );

  const continueAfterShortageOrOk = useCallback(
    async (href: string, preferDraft: boolean, dateKey: string) => {
      setPendingPreferDraft(preferDraft);
      try {
        const qs = new URLSearchParams({ dateKey });
        if (profileId) qs.set("profileId", profileId);
        const res = await fetch(`/api/journal/drafts?${qs.toString()}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as { draft?: { id?: string } | null };
        if (res.ok && data.draft?.id) {
          setHasDraft(true);
          setPhase("draftResume");
          return;
        }
      } catch {
        // ignore
      }
      go(href, preferDraft);
    },
    [go, profileId],
  );

  const beginWriteEntry = useCallback(
    async (href: string, dateKey?: string) => {
      if (checking) return;
      const resolvedDateKey =
        dateKey && /^\d{4}-\d{2}-\d{2}$/.test(dateKey) ? dateKey : todayDateKey();
      setPendingHref(href);
      setPendingDateKey(resolvedDateKey);
      setChecking(true);
      try {
        const qs = new URLSearchParams();
        if (profileId) qs.set("profileId", profileId);
        const res = await fetch(`/api/loghouse/donguri/status?${qs.toString()}`, {
          credentials: "same-origin",
        });
        const data = (await res.json()) as { balance?: number };
        const nextBalance = typeof data.balance === "number" ? data.balance : 0;
        setBalance(nextBalance);
        if (nextBalance <= DONGURI_SHORTAGE_THRESHOLD) {
          setPhase("shortage");
          return;
        }
        await continueAfterShortageOrOk(href, false, resolvedDateKey);
      } catch {
        go(href, false);
      } finally {
        setChecking(false);
      }
    },
    [checking, continueAfterShortageOrOk, go, profileId],
  );

  const gateModals = (
    <>
      <DonguriFootprintModal
        open={phase === "shortage"}
        title={DONGURI_SHORTAGE_PRE_TITLE}
        body={donguriShortagePreBody(balance)}
        onDismiss={() => {
          setPhase("idle");
          setPendingHref(null);
        }}
        actions={[
          {
            label: BTN_DRAFT_WRITE,
            variant: "primary",
            onClick: () => {
              if (!pendingHref) return;
              void continueAfterShortageOrOk(pendingHref, true, pendingDateKey);
            },
          },
          {
            label: BTN_VIEW_DONGURI,
            variant: "secondary",
            onClick: () => {
              setPhase("idle");
              setPendingHref(null);
              router.push(DONGURI_PAGE_PATH);
            },
          },
          {
            label: BTN_SKIP_TODAY,
            variant: "ghost",
            onClick: () => {
              setPhase("idle");
              setPendingHref(null);
            },
          },
        ]}
      />

      <DonguriFootprintModal
        open={phase === "draftResume" && hasDraft}
        title={DONGURI_DRAFT_RESUME_TITLE}
        body={DONGURI_DRAFT_RESUME_BODY}
        onDismiss={() => {
          setPhase("idle");
          setPendingHref(null);
        }}
        actions={[
          {
            label: BTN_CONTINUE_DRAFT,
            variant: "primary",
            onClick: () => {
              if (!pendingHref) return;
              go(pendingHref, pendingPreferDraft, { resume: true });
            },
          },
          {
            label: BTN_REWRITE_DRAFT,
            variant: "secondary",
            onClick: () => setPhase("draftResetConfirm"),
          },
          {
            label: BTN_CLOSE,
            variant: "ghost",
            onClick: () => {
              setPhase("idle");
              setPendingHref(null);
            },
          },
        ]}
      />

      <DonguriFootprintModal
        open={phase === "draftResetConfirm"}
        title={BTN_REWRITE_DRAFT}
        body={DONGURI_DRAFT_RESET_CONFIRM}
        onDismiss={() => setPhase("draftResume")}
        actions={[
          {
            label: "書き直す",
            variant: "primary",
            onClick: () => {
              void (async () => {
                try {
                  const qs = new URLSearchParams({ dateKey: pendingDateKey });
                  if (profileId) qs.set("profileId", profileId);
                  await fetch(`/api/journal/drafts?${qs.toString()}`, {
                    method: "DELETE",
                    credentials: "same-origin",
                  });
                } catch {
                  // ignore
                }
                if (pendingHref) go(pendingHref, pendingPreferDraft, { fresh: true });
              })();
            },
          },
          {
            label: BTN_CLOSE,
            variant: "ghost",
            onClick: () => setPhase("draftResume"),
          },
        ]}
      />
    </>
  );

  return { beginWriteEntry, checking, gateModals };
}
