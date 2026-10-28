// What a /country/{code} URL means: the profile to open, the shape to focus,
// and the territory the user picked when it folds into a parent's profile.
export function resolveSelection(entities, code) {
  const focus = entities.find((entity) => entity.code === code?.toUpperCase());
  if (!focus) return null;
  if (focus.kind !== "territory") return { profile: focus, focus, territory: null };
  const profile = entities.find((entity) => entity.code === focus.parent);
  return profile ? { profile, focus, territory: focus } : null;
}
