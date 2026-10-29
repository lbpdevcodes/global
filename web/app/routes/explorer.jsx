import { useNavigate, useParams } from "react-router";
import { siteUrl } from "virtual:share-cards";
import { Explorer } from "../explorer/Explorer.jsx";
import { createSnapshotData } from "../lib/data.js";
import { shareMeta } from "../lib/share.js";

const data = createSnapshotData();

export function meta() {
  return shareMeta(undefined, {}, siteUrl);
}

export default function ExplorerRoute() {
  const { code } = useParams();
  const navigate = useNavigate();
  return <Explorer code={code} navigate={navigate} data={data} />;
}
