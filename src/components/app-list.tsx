import { apps } from "@/data/apps";

/** Lists Kevin's apps as cards. Renders nothing until there's at least one app. */
export function AppList() {
  if (apps.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="apps-heading" className="w-full max-w-2xl my-4">
      <h2 id="apps-heading" className="mb-4 text-xl font-semibold">
        Apps
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {apps.map((app) => (
          <li key={app.url}>
            <a
              href={app.url}
              className="block h-full rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
            >
              <span className="block font-medium">{app.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {app.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
