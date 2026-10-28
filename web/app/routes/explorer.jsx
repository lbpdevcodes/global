import { useNavigate, useParams } from "react-router";
import { Explorer } from "../explorer/Explorer.jsx";
import { createSnapshotData } from "../lib/data.js";

const data = createSnapshotData();

export function meta() {
  return [
    { title: "Geopolitical Globe" },
    { name: "description", content: "Spin the globe and open any country's sourced, dated geopolitical profile." },
  ];
}

export default function ExplorerRoute() {
  const { code } = useParams();
  const navigate = useNavigate();
  return <Explorer code={code} navigate={navigate} data={data} />;
}
