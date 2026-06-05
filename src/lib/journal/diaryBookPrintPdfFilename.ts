export function diaryBookPrintPdfFilename(bindingCode: string): string {
  const safe = bindingCode.replace(/[^\w-]+/g, "_");
  return `LifeJourney_DiaryBook_${safe}_print.pdf`;
}
