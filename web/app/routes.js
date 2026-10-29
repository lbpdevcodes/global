import { index, layout, route } from "@react-router/dev/routes";

// One layout owns the globe so it stays mounted while the URL changes; the
// child routes only carry the selected code.
export default [
  layout("routes/explorer.jsx", [
    index("routes/blank.jsx"),
    route("country/:code", "routes/country.jsx", { id: "country" }),
  ]),
];
