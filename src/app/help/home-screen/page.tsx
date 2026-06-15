import type { Metadata } from "next";

import {
  IphoneChromeHomeScreenDiagram,
  IphoneSafariHomeScreenDiagram,
  NumberedSteps,
} from "@/components/help/homeScreen/HomeScreenGuideDiagrams";
import { HomeScreenHelpPageHeader } from "@/components/help/homeScreen/HomeScreenHelpPageHeader";
import { OptionalHelpScreenshot } from "@/components/help/homeScreen/OptionalHelpScreenshot";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "ホーム画面に追加する方法",
};

const IPHONE_SAFARI_STEPS = [
  "SafariでLife Journey Diaryを開きます",
  "画面下の「···」メニューを押します",
  "「共有」を選びます",
  "共有メニューの一覧から「ホーム画面に追加」を選びます",
  "表示名を確認して「追加」を押します",
  "ホーム画面のアイコンからLJDを開けるようになります",
] as const;

const IPHONE_CHROME_STEPS = [
  "ChromeでLife Journey Diaryを開きます",
  "アドレスバー右の共有ボタン（□↑）を押します",
  "メニューから「ホーム画面に追加」を選びます",
  "表示名を確認して「追加」を押します",
  "ホーム画面のアイコンからLJDを開けるようになります",
] as const;

function PlatformSection({
  title,
  diagram,
  steps,
  note,
  screenshotSrc,
  screenshotAlt,
}: {
  title: string;
  diagram: React.ReactNode;
  steps: readonly string[];
  note: string;
  screenshotSrc: string;
  screenshotAlt: string;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-semibold text-stone-900 sm:text-lg">{title}</h2>
      {diagram}
      <NumberedSteps steps={[...steps]} />
      <p className="text-xs leading-relaxed text-stone-500">{note}</p>
      <OptionalHelpScreenshot src={screenshotSrc} alt={screenshotAlt} />
    </section>
  );
}

export default function HomeScreenHelpPage() {
  return (
    <div className="space-y-6">
      <HomeScreenHelpPageHeader />

      <PlatformSection
        title="iPhoneの場合（Safari）"
        diagram={<IphoneSafariHomeScreenDiagram />}
        steps={IPHONE_SAFARI_STEPS}
        note="※Safariでは、画面下の「···」の中に「共有」があります。共有メニューの一覧が長い場合は、下へスクロールしてください。iOSのバージョンによって表示が少し異なる場合があります。"
        screenshotSrc="/images/help/home-screen/iphone-safari-home-screen-steps.png"
        screenshotAlt="iPhone Safariでホーム画面に追加する手順の図解"
      />

      <PlatformSection
        title="iPhoneの場合（Chrome）"
        diagram={<IphoneChromeHomeScreenDiagram />}
        steps={IPHONE_CHROME_STEPS}
        note="※Chromeでは、アドレスバー右の共有ボタンから「ホーム画面に追加」を選びます。メニューが長い場合は、下の方へスクロールしてください。"
        screenshotSrc="/images/help/home-screen/iphone-chrome-home-screen-steps.png"
        screenshotAlt="iPhone Chromeでホーム画面に追加する手順の図解"
      />
    </div>
  );
}
