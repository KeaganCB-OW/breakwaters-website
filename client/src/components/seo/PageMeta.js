import { useEffect } from "react";

function ensureTag(selector, create) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = create();
    document.head.appendChild(tag);
  }
  return tag;
}

export default function PageMeta({ title, description, canonical }) {
  useEffect(() => {
    if (typeof document === "undefined") return;

    if (title) {
      document.title = title;
    }

    if (description) {
      const descriptionMeta = ensureTag(
        "meta[name='description']",
        () => {
          const meta = document.createElement("meta");
          meta.setAttribute("name", "description");
          return meta;
        }
      );
      descriptionMeta.setAttribute("content", description);
    }

    const resolvedCanonical = canonical ?? (
      typeof window !== "undefined"
        ? `${window.location.origin}${window.location.pathname}`
        : undefined
    );

    if (resolvedCanonical) {
      const canonicalLink = ensureTag(
        "link[rel='canonical']",
        () => {
          const link = document.createElement("link");
          link.setAttribute("rel", "canonical");
          return link;
        }
      );
      canonicalLink.setAttribute("href", resolvedCanonical);
    }
  }, [title, description, canonical]);

  return null;
}
