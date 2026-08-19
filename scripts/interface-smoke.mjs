#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();

const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = (message) => {
  console.error(`[WXM interface smoke] ERROR: ${message}`);
  process.exit(1);
};
const ok = (message) => console.log(`[WXM interface smoke] ${message}`);

const assert = (condition, message) => {
  if (!condition) fail(message);
};

const hash = (file) => crypto.createHash("sha256").update(read(file)).digest("hex");
const assertSameFile = (left, right) => {
  assert(hash(left) === hash(right), `Legacy CMS mirror is out of sync: ${left} != ${right}`);
};

const attrValues = (html, attr) => {
  const matches = [...html.matchAll(new RegExp(`${attr}="([^"]+)"`, "g"))];
  return matches.map((match) => match[1]);
};

const requiredIds = (html, file, ids) => {
  ids.forEach((id) => assert(html.includes(`id="${id}"`), `${file} is missing #${id}`));
};

const appHtml = read("v2/index.html");
const cmsHtml = read("v2/cms/index.html");
const cmsCss = read("v2/cms/assets/css/cms.css");
const atlasRuntime = read("v2/cms/assets/react/WxmWorldAtlasMap.runtime.js");

ok("Checking mobile app interface contract");
requiredIds(appHtml, "v2/index.html", [
  "view-home",
  "view-live",
  "view-programs",
  "view-explore",
  "view-me",
  "homePlayBtn",
  "playBtn",
  "stopBtn",
  "syncBtn",
  "miniPlayer",
  "miniPlayBtn",
  "historySheet",
  "appModal",
]);

const appViews = new Set(attrValues(appHtml, "data-view"));
const navTargets = attrValues(appHtml, "data-target-view");
navTargets.forEach((target) => assert(appViews.has(target), `Bottom nav target has no app view: ${target}`));
assert(appHtml.includes("maximum-scale=1.0"), "Mobile viewport must prevent accidental page zoom in Android WebView");
assert(appHtml.includes('aria-label="Reproductor WXM"'), "Mini player needs an accessible label");

ok("Checking CMS analytics/system contract");
requiredIds(cmsHtml, "v2/cms/index.html", [
  "dashboardAnalyticsMap",
  "dashboardLiveConnectionsList",
  "analyticsMap",
  "liveConnectionsList",
  "countriesDonut",
  "playersDonut",
  "remoteEndpoint",
  "analyticsIngestEndpoint",
  "analyticsDashboardEndpoint",
  "validationList",
]);

const analyticsTabs = attrValues(cmsHtml, "data-analytics-tab");
const analyticsPanels = new Set(attrValues(cmsHtml, "data-analytics-panel"));
analyticsTabs.forEach((tab) => assert(analyticsPanels.has(tab), `Analytics tab has no panel: ${tab}`));

const systemTabs = attrValues(cmsHtml, "data-system-tab");
const systemPanels = new Set(attrValues(cmsHtml, "data-system-panel"));
systemTabs.forEach((tab) => assert(systemPanels.has(tab), `System tab has no panel: ${tab}`));

assert(cmsHtml.includes('role="tablist"'), "CMS must expose tablists for keyboard/screen-reader navigation");
assert(cmsHtml.includes('accept="image/png,image/jpeg,image/webp"'), "CMS image inputs must restrict accepted image formats");

ok("Checking World Atlas regression guards");
[
  "inverseZoomScale",
  "isZoomedInspection",
  "routePulseRadius",
  "destinationMarkerRadius",
  "originCoreRadius",
  "originHaloRadius",
  "wxm-atlas-country",
  "wxm-atlas-caribbean-node",
  "showLabel = selected",
  "tooltip",
].forEach((token) => assert(atlasRuntime.includes(token), `Atlas runtime is missing regression guard: ${token}`));

[
  ".wxm-atlas-shell.is-zoomed-atlas .wxm-atlas-route-pulse",
  ".wxm-atlas-shell.is-zoomed-atlas .wxm-atlas-origin-halo",
  ".wxm-atlas-shell.is-zoomed-atlas .wxm-atlas-caribbean-node.is-active circle",
  ".wxm-atlas-country.is-selected",
  ".wxm-atlas-tooltip",
].forEach((selector) => assert(cmsCss.includes(selector), `CMS CSS is missing Atlas selector: ${selector}`));

assert(cmsCss.includes("@media (max-width: 1180px)"), "CMS CSS must include desktop/tablet responsive rules");
assert(cmsCss.includes("@media (max-width: 760px)"), "CMS CSS must include tablet/mobile responsive rules");
assert(cmsCss.includes("@media (max-width: 480px)"), "CMS CSS must include narrow mobile responsive rules");
assert(cmsCss.includes("@media (prefers-reduced-motion: reduce)"), "CMS CSS must respect reduced-motion users");

ok("Checking active CMS and legacy mirror parity");
[
  ["v2/cms/index.html", "v2/cms/cms/index.html"],
  ["v2/cms/assets/js/cms.js", "v2/cms/cms/assets/js/cms.js"],
  ["v2/cms/assets/css/cms.css", "v2/cms/cms/assets/css/cms.css"],
  ["v2/cms/assets/react/WxmWorldAtlasMap.runtime.js", "v2/cms/cms/assets/react/WxmWorldAtlasMap.runtime.js"],
].forEach(([left, right]) => assertSameFile(left, right));

ok("OK");
