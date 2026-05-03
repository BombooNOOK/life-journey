import { StyleSheet } from "@react-pdf/renderer";

/** コア本文1枚目ヒーロー resultTitle の上余白（上端から約 2/3）。LP・ディスティニー等で共通。 */
export const CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP = 350;

/** バースデー1枚目のみ。全体を約2行分だけ上げる（他コアの `CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP` より小さい）。 */
export const BIRTHDAY_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP =
  CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP - 44;

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansJP",
    fontSize: 11,
    paddingTop: 30,
    paddingBottom: 48,
    paddingHorizontal: 40,
    lineHeight: 1.5,
    textAlign: "left",
    color: "#222",
  },
  pageHeader: {
    marginTop: 0,
    marginBottom: 10,
    zIndex: 10,
  },
  pageHeaderTitleRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    /** ページ番号（絶対配置）と横線が重ならないよう右に空け */
    paddingRight: 56,
  },
  /**
   * ページ番号（表紙を読者向け総ページに含めない運用。`PdfPageFrame` と目次の手入力番号と揃える）。
   * 全面画像でヘッダーが無いときのみ absolute。ヘッダーありのときは `pageHeaderPageNumber` をタイトル行右に置く。
   */
  pageNumberOverlay: {
    position: "absolute",
    top: 30,
    right: 40,
    width: 96,
    fontSize: 9,
    lineHeight: 1.35,
    color: "#333",
    fontFamily: "NotoSansJP",
    textAlign: "right",
    zIndex: 100,
  },
  /** 全面画像（padding 0）ページ用 */
  pageNumberOverlayFullBleed: {
    position: "absolute",
    top: 10,
    right: 14,
    width: 96,
    fontSize: 9,
    lineHeight: 1.35,
    color: "#222",
    fontFamily: "NotoSansJP",
    textAlign: "right",
    zIndex: 100,
  },
  /** 左寄せタイトル＋右へ伸びるライン */
  pageHeaderTitle: {
    fontSize: 10,
    letterSpacing: 0.4,
    color: "#444",
    textAlign: "left",
    flexShrink: 0,
  },
  pageHeaderRule: {
    flexGrow: 1,
    flexShrink: 1,
    height: 1,
    backgroundColor: "#e6e6e6",
    marginLeft: 8,
    marginTop: 1,
  },
  /** タイトル行右端。`RawText` に `fixed` を付けるとページ座標に固定されてしまうためラップする */
  pageHeaderPageNumberWrap: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 52,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  pageHeaderPageNumber: {
    fontSize: 9,
    lineHeight: 1.35,
    color: "#333",
    fontFamily: "NotoSansJP",
    textAlign: "right",
    width: "100%",
  },
  pageHeaderSubtitle: {
    marginTop: 4,
    fontSize: 9,
    color: "#666",
    textAlign: "left",
  },
  pageBody: {
    marginTop: 10,
    marginBottom: 18,
  },
  /** 本文ページ背面（全面・`PdfPageFrame` の先頭子要素） */
  pageBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -10,
  },
  /**
   * コア章の装飾画像用。全面 `fixed` だとページ番号（フッター）を画像が上から塗りつぶし、
   * ブラウザ表示では見えないことがある（テキスト抽出では残る）ため、下端を空ける。
   */
  pageBackgroundLeaveFooter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -10,
  },
  /** 見開き左／右／裏表紙の全面背景（デザイン画像側で濃さ調整推奨） */
  pageBindingBackgroundImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  h1: {
    fontSize: 20,
    marginBottom: 16,
    color: "#1a1a1a",
    textAlign: "center",
  },
  h2: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  compactHeader: {
    fontSize: 10,
    color: "#525252",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  resultTitle: {
    fontSize: 17,
    color: "#2f2f2f",
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 1.5,
    textAlign: "center",
  },
  bodySectionEyebrow: {
    fontSize: 10,
    color: "#666",
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.4,
  },
  /** ライフパス等のサブタイトル（基本・恋愛…） */
  lifePathSectionSubtitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#333",
    marginTop: 10,
    marginBottom: 4,
    letterSpacing: 0.4,
    textAlign: "center",
  },
  subtleDivider: {
    marginTop: 10,
    marginBottom: 8,
    borderBottomWidth: 0.6,
    borderBottomColor: "#ddd",
  },
  softLead: {
    fontSize: 10,
    color: "#4d4d4d",
    lineHeight: 1.7,
  },
  muted: {
    fontSize: 9,
    color: "#666",
    marginTop: 24,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 120,
    color: "#555",
  },
  value: {
    flex: 1,
  },
  box: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 8,
    marginTop: 8,
  },
  sectionBlock: {
    marginTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  /** ライフパス2枚目以降：枠線なし、余白でセクションを区切る */
  lifePathSectionBlock: {
    marginTop: -4,
    paddingTop: 6,
    paddingBottom: 4,
  },
  /**
   * コア本文1枚目のヒーロー開始位置（ディスティニー・ソウル等と共通）。
   * ライフパスだけ別調整する場合は `lifePathNumberFirstPageHero` を使う。
   */
  lifePathFirstPageContent: {
    marginTop: 220,
  },
  /**
   * ライフパス・ナンバー本文1枚目のみ。全面背景は `assets/haikei-lp.png`。
   * 上端から約 2/3に中見出し。`CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP` で他コアと揃える。
   */
  lifePathNumberFirstPageHero: {
    marginTop: CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP,
  },
  /** ディスティニー本文1枚目ヒーロー。全面背景は `assets/destiny-first-page.png`。 */
  destinyNumberFirstPageHero: {
    marginTop: CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP,
  },
  /** ソウル本文1枚目ヒーロー。全面背景は `assets/soul-first-page.png`。 */
  soulNumberFirstPageHero: {
    marginTop: CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP,
  },
  /** パーソナリティ本文1枚目ヒーロー。全面背景は `assets/personality-first-page.png`。 */
  personalityNumberFirstPageHero: {
    marginTop: CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP,
  },
  /** マチュリティ本文1枚目ヒーロー。全面背景は `assets/maturity-first-page.png`。 */
  maturityNumberFirstPageHero: {
    marginTop: CORE_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP,
  },
  /**
   * バースデー本文1枚目ヒーロー（中見出し＋テーマ本文をまとめる）。
   * 上余白は `BIRTHDAY_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP`（他コアよりやや上）。
   */
  birthdayNumberFirstPageHero: {
    marginTop: BIRTHDAY_NUMBER_FIRST_PAGE_HERO_MARGIN_TOP,
  },
  /** 「テーマ」ラベル削除後も resultTitle とテーマ本文の間隔を eyebrow 相当で維持するスペーサー */
  birthdayThemeEyebrowSpacer: {
    marginTop: 10,
    marginBottom: 4,
    height: 12,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 4,
    color: "#222",
    textAlign: "center",
  },
  /** ライフパス各セクション見出し（恋愛・仕事…） */
  lifePathSectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
    color: "#222",
    textAlign: "center",
  },
  sectionBody: {
    fontSize: 10,
    lineHeight: 1.9,
    color: "#333",
    textAlign: "left",
  },
  /** 星記号も日本語フォントで統一（標準フォント使用を避ける） */
  starsHelvetica: {
    fontFamily: "NotoSansJP",
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 1.5,
    color: "#111",
  },
  /** ASCII フォールバックも同じ日本語フォントで統一 */
  starsCourier: {
    fontFamily: "NotoSansJP",
    fontSize: 10,
    marginTop: 2,
    color: "#333",
  },
  /** ブリッジ「一致度」：左に星・右に％のみ（2カラム） */
  bridgeAgreementRow: {
    flexDirection: "row",
    marginTop: 4,
    width: "100%",
    alignItems: "center",
  },
  bridgeAgreementStarsCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bridgeAgreementPercentCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bridgeAgreementPercentText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
  },
  coreTableSection: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
  },
  coreTableTitle: {
    fontSize: 10,
    color: "#444",
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 8,
    paddingVertical: 6,
    letterSpacing: 0.3,
  },
  coreTableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  coreTableLabel: {
    width: "76%",
    fontSize: 10,
    color: "#333",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  coreTableValue: {
    width: "24%",
    fontSize: 11,
    fontWeight: 700,
    color: "#111",
    textAlign: "right",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  coreBridgeTwoColRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  coreBridgeCell: {
    width: "50%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  coreBridgeCellDivider: {
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  coreBridgeLabel: {
    fontSize: 9.2,
    color: "#333",
  },
  coreBridgeValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111",
    textAlign: "right",
  },
  numberKeywordTable: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    overflow: "hidden",
  },
  numberKeywordLead: {
    marginTop: 2,
    marginBottom: 2,
    fontSize: 9.6,
    color: "#4a4a4a",
    lineHeight: 1.7,
    textAlign: "left",
  },
  numberKeywordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  numberKeywordRowAlt: {
    backgroundColor: "#fafafa",
  },
  numberKeywordRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  numberKeywordNumber: {
    width: 34,
    fontSize: 10,
    fontWeight: 700,
    color: "#222",
  },
  numberKeywordWords: {
    flex: 1,
    fontSize: 9,
    color: "#333",
  },
  numberKeywordClosing: {
    marginTop: 10,
    fontSize: 10,
    color: "#444",
    textAlign: "center",
  },
});
