/*
 * Markers for the in-page editor. Spread them on elements that show a piece of content:
 *   <h2 {...edit("home.quote")}>{home.quote}</h2>
 * They are plain data attributes, so they cost nothing for visitors.
 * A text marker must sit on an element whose only content is that text.
 */

/** Editable text (the element's whole text). */
export const edit = (path: string) => ({ "data-edit": path });

/** Editable link destination (on an <a>). */
export const editLink = (path: string) => ({ "data-edit-link": path });

/** Replaceable image (on the element that wraps the <img>). */
export const editImage = (path: string) => ({ "data-edit-image": path });

/** Lets the admin pick words of this text (by selecting them) to store at `path`. */
export const editHighlight = (path: string) => ({ "data-edit-highlight": path });

/**
 * A button the admin can hide. Put it on a wrapper, together with `hidden={link.hidden}`;
 * `path` is the LinkItem ("contact.directions"), the flag is stored at `${path}.hidden`.
 */
export const editHide = (path: string) => ({ "data-edit-hide": path });

/** Photo list editor (slides, gallery). */
export const editPhotos = (path: string, label: string) => ({ "data-edit-photos": path, "data-edit-label": label });
