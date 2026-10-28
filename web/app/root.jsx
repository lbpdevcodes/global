import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./app.css";

// Start the data the globe and panel need while the JavaScript downloads.
export function links() {
  return [
    { rel: "preload", href: "/data/v1/index.json", as: "fetch", crossOrigin: "anonymous" },
    { rel: "preload", href: "/borders-50m.topo.json", as: "fetch", crossOrigin: "anonymous" },
  ];
}

const PRELOAD_COUNTRY = `(function(){var m=location.pathname.match(/^\\/country\\/([A-Za-z]{3})\\/?$/);if(!m)return;var l=document.createElement("link");l.rel="preload";l.as="fetch";l.crossOrigin="anonymous";l.href="/data/v1/countries/"+m[1].toUpperCase()+".json";document.head.appendChild(l)})()`;

export function Layout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: PRELOAD_COUNTRY }} />
      </head>
      <body className="bg-[#05070d] font-sans text-[15px] text-neutral-100 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
