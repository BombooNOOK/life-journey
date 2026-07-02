import type { MoodId } from "@/lib/journal/meta";

import { formatMoodForDiary } from "./messages";
import type { CompanionWritingFeedbackId } from "./types";

export type BuildCompanionWritingContentInput = {
  mood: MoodId;
  feedback: CompanionWritingFeedbackId;
  /** 今日の数字からの読み解き（先頭1文）。未鑑定などで無いときは null */
  readingFirstSentence: string | null;
  userAnswer: string;
};

function readingBlock(readingFirstSentence: string): string[] {
  return ["今日の数字から届いたことば：", `「${readingFirstSentence.trim()}」`, ""];
}

/** 既存 JournalEntry.content にそのまま保存できる自然な日記文 */
export function buildCompanionWritingEntryContent(
  input: BuildCompanionWritingContentInput,
): string {
  const moodPhrase = formatMoodForDiary(input.mood);
  const answer = input.userAnswer.trim();
  const reading = input.readingFirstSentence?.trim() ?? "";

  const paragraphs: string[] = [`今日は、${moodPhrase}気分。`, ""];

  if (reading) {
    paragraphs.push(...readingBlock(reading));
  }

  switch (input.feedback) {
    case "perfect_fit":
      paragraphs.push("このことばは、今日の自分に近く感じた。");
      break;
    case "somewhat":
      paragraphs.push("すべてではないけれど、少し心に残るところがあった。");
      break;
    case "different":
      paragraphs.push(
        "今の自分には、少し違うように感じた。",
        "でも、こういう見方もあるのかもしれない。",
        "",
        "今日は、自分ではこんな一日だった気がする。",
      );
      break;
    case "unsure":
      paragraphs.push(
        reading
          ? "今はまだ、このことばが自分に近いかどうかはわからない。"
          : "今はまだ、自分に近いかどうかはわからない。",
        "あとから読み返したときに、響き方が変わるかもしれない。",
      );
      break;
    default:
      break;
  }

  paragraphs.push("", answer);
  return paragraphs.join("\n").trim();
}
