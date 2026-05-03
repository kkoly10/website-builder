import { Font } from "@react-pdf/renderer";
import path from "path";

const base = path.join(
  process.cwd(),
  "node_modules/@fontsource/playfair-display/files"
);

Font.register({
  family: "Playfair Display",
  fonts: [
    {
      src: path.join(base, "playfair-display-latin-400-normal.woff"),
      fontWeight: 400,
    },
    {
      src: path.join(base, "playfair-display-latin-700-normal.woff"),
      fontWeight: 700,
    },
  ],
});
