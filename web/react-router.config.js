// Static output only: no server at read time. Country pages are pre-rendered
// from the published index once the pipeline exists (M1).
export default {
  ssr: false,
  prerender: ["/"],
};
