export type App = {
  name: string;
  /** One short line shown under the name */
  description: string;
  /** The app's path on this site, e.g. "/todo" */
  url: string;
};

// Each app lives in its own repo and Vercel project, served under a path of
// kevincho.ca (e.g. kevincho.ca/todo). Add an entry here to list it on the
// home page.
export const apps: App[] = [
  {
    name: "MapleStory Classic Tools",
    description: "Calculators and simulators for MapleStory Classic World",
    url: "/maplestory",
  },
];
