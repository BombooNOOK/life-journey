import { View } from "@react-pdf/renderer";

import { PdfPageFrame } from "../PdfPageFrame";
import { PdfText as Text } from "../PdfText";
import { pdfStyles } from "../styles";

type KeywordRow = {
  number: string;
  keywords: string[];
};

const NUMBER_KEYWORDS: KeywordRow[] = [
  { number: "1", keywords: ["自立", "行動力", "創造性", "決断力", "先駆性"] },
  { number: "2", keywords: ["協調性", "受容力", "共感力", "繊細さ", "調和"] },
  { number: "3", keywords: ["表現力", "明るさ", "創造力", "社交性", "柔軟さ"] },
  { number: "4", keywords: ["安定感", "継続力", "誠実さ", "計画性", "基盤づくり"] },
  { number: "5", keywords: ["自由", "変化対応力", "好奇心", "冒険心"] },
  { number: "6", keywords: ["愛情", "責任感", "育成力", "献身性", "美意識"] },
  { number: "7", keywords: ["探究心", "洞察力", "分析力", "知性"] },
  { number: "8", keywords: ["実現力", "統率力", "影響力", "達成力", "現実感覚"] },
  { number: "9", keywords: ["包容力", "博愛性", "理想性", "奉仕性", "完成力"] },
  { number: "11", keywords: ["直観力", "感受性", "ひらめき", "インスピレーション", "啓発力"] },
  { number: "22", keywords: ["構築力", "実行力", "大局観", "社会性", "具現化力"] },
  { number: "33", keywords: ["無償の愛", "癒し力", "受容力", "導き", "調和創造"] },
];

export function NumberKeywordsPage() {
  return (
    <PdfPageFrame title="数のキーワード">
      <Text style={pdfStyles.h1}>数のキーワード</Text>
      <Text style={pdfStyles.numberKeywordLead}>
        「数」には、ひとつひとつに固有の性質があり、特別な意味があります。{"\n"}
        まずはそれぞれのキーワードから、数字の個性をつかんでみましょう。
      </Text>

      <View style={pdfStyles.numberKeywordTable}>
        {NUMBER_KEYWORDS.map((row, i) => (
          <View
            key={row.number}
            style={[
              pdfStyles.numberKeywordRow,
              ...(i % 2 === 1 ? [pdfStyles.numberKeywordRowAlt] : []),
              ...(i === NUMBER_KEYWORDS.length - 1 ? [] : [pdfStyles.numberKeywordRowBorder]),
            ]}
          >
            <Text style={pdfStyles.numberKeywordNumber}>{row.number}</Text>
            <Text style={pdfStyles.numberKeywordWords}>{row.keywords.join(" / ")}</Text>
          </View>
        ))}
      </View>

      <Text style={pdfStyles.numberKeywordClosing}>
        それでは、あなたの持つ数字を読み解いてみましょう
      </Text>
    </PdfPageFrame>
  );
}
