import { View } from "@react-pdf/renderer";

import { breakTitleAtCommaForPdf } from "@/lib/pdf/breakTitleAtComma";

import { PdfLongFormBody } from "../PdfLongFormBody";
import { pdfLongFormProseProps } from "../pdfLongFormSpacing";
import { PdfPageFrame } from "../PdfPageFrame";
import { PdfText as Text } from "../PdfText";
import { pdfStyles } from "../styles";

interface Props {
  label: string;
  title: string;
  body: string;
}

export function CoreNumberGuidePage({ label, title, body }: Props) {
  return (
    <PdfPageFrame title={label} pageType="guide">
      <Text style={pdfStyles.compactHeader}>{label}</Text>
      <Text style={pdfStyles.resultTitle}>{breakTitleAtCommaForPdf(title)}</Text>
      <View style={[pdfStyles.box, { borderColor: "#d8d8d8", marginTop: 10 }]}>
        <PdfLongFormBody text={body} bodyStyle={{ lineHeight: 1.85 }} {...pdfLongFormProseProps} />
      </View>
    </PdfPageFrame>
  );
}
