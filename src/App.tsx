import { lazy, Suspense, useCallback, useMemo, useState } from "react";
import { usePreferences } from "@/app/preferences/usePreferences";
import { setPreference } from "@/app/preferences/preferences";
import { useShellConfig } from "@/app/shell/useShellConfig";
import { NewsDashboard } from "@/features/dashboards/news/NewsDashboard";
import { isDashboardId, type DashboardId } from "@/features/dashboards/dashboards";
import { SettingsDialog } from "@/features/settings/SettingsDialog";

// NewsDashboard is the default; keep it eager so the initial render is synchronous.
const WeatherDashboard = lazy(() =>
  import("@/features/dashboards/weather/WeatherDashboard").then((m) => ({ default: m.WeatherDashboard }))
);
const ProductivityDashboard = lazy(() =>
  import("@/features/dashboards/productivity/ProductivityDashboard").then((m) => ({
    default: m.ProductivityDashboard,
  }))
);
const DesktopDashboard = lazy(() =>
  import("@/features/dashboards/desktop/DesktopDashboard").then((m) => ({ default: m.DesktopDashboard }))
);

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const preferences = usePreferences();
  const [activeDashboard, setActiveDashboard] = useState<DashboardId>(() =>
    isDashboardId(preferences.defaultDashboard) ? preferences.defaultDashboard : "news"
  );
  const { userName, tickerItems } = useShellConfig();

  const displayName = preferences.displayName.trim() || userName;

  const selectDashboard = useCallback((dashboard: DashboardId) => {
    setActiveDashboard(dashboard);
    setPreference("defaultDashboard", dashboard);
  }, []);

  const onOpenSettings = useCallback(() => setIsSettingsOpen(true), []);

  const shellProps = useMemo(
    () => ({
      onOpenSettings,
      userName: displayName,
      profileImage: preferences.profileImage,
      tickerItems,
      activeDashboard,
      onSelectDashboard: selectDashboard,
    }),
    [onOpenSettings, displayName, preferences.profileImage, tickerItems, activeDashboard, selectDashboard]
  );

  const renderDashboard = () => {
    switch (activeDashboard) {
      case "news":
        return <NewsDashboard {...shellProps} />;
      case "weather":
        return <WeatherDashboard {...shellProps} />;
      case "productivity":
        return <ProductivityDashboard {...shellProps} />;
      case "desktop":
        return <DesktopDashboard {...shellProps} />;
      default:
        return <NewsDashboard {...shellProps} />;
    }
  };

  return (
    <main className="dark h-svh overflow-hidden bg-background text-foreground">
      <Suspense>{renderDashboard()}</Suspense>
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        activeDashboard={activeDashboard}
        onSelectDashboard={selectDashboard}
      />
    </main>
  );
}

export default App;
