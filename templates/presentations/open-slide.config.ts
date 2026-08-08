import type { OpenSlideConfig } from "@open-slide/core";

const config: OpenSlideConfig = {
  build: {
    // A SmallForce presentation opens its default deck instead of a deck
    // browser, while retaining Present and export controls.
    showSlideBrowser: false,
    showSlideUi: true,
    allowHtmlDownload: true,
  },
};

export default config;
