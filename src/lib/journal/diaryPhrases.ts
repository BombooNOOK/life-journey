/** 月次カード・製本の振り返りページで共有する短文（既存 Life Journey Diary と同じトーン） */

export function phraseForMonth(entryCount: number, moodId: string): string {
  if (entryCount === 0) return "一歩目を待っています。気づいたことを、短く残してみましょう。";
  if (entryCount < 4) return "少しずつ、自分のリズムが見えてきましたね。";
  if (moodId === "happy") return "明るい流れが育っています。心地よい感覚を大切に。";
  if (moodId === "calm") return "穏やかさが土台になっています。今のペースで大丈夫です。";
  if (moodId === "tired") return "よく頑張りました。小さく休む時間を先に置いてみましょう。";
  if (moodId === "moody") return "揺れを記録できていること自体が前進です。焦らず整えましょう。";
  return "日々の積み重ねが、あなたの物語をしっかり育てています。";
}

export function phraseForYear(entryCount: number, distinctDays: number, year: number): string {
  if (entryCount === 0) {
    return `${year}年のページは、まだ静かです。最初の一行を書いてみましょう。`;
  }
  if (entryCount < 7) {
    return `${year}年は、小さな印が重なり始めた頃。このペースがあなたの型になります。`;
  }
  if (distinctDays >= 40) {
    return `${year}年は、多くの日に手を伸ばせた年でした。次の息継ぎも大切に。`;
  }
  return `${year}年の足跡がはっきり見えてきました。残りの日々も、自分の言葉で整えていきましょう。`;
}
