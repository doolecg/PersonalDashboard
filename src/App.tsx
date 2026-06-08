import { useCallback, useState } from "react";
import { usePreferences } from "@/app/preferences/usePreferences";
import { setPreference } from "@/app/preferences/preferences";
import { useShellConfig } from "@/app/shell/useShellConfig";
import { NewsDashboard } from "@/features/dashboards/news/NewsDashboard";
import { WeatherDashboard } from "@/features/dashboards/weather/WeatherDashboard";
import { ProductivityDashboard } from "@/features/dashboards/productivity/ProductivityDashboard";
import { DesktopDashboard } from "@/features/dashboards/desktop/DesktopDashboard";
import { isDashboardId, type DashboardId } from "@/features/dashboards/dashboards";
import { SettingsDialog } from "@/features/settings/SettingsDialog";

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const preferences = usePreferences();
  const [activeDashboard, setActiveDashboard] = useState<DashboardId>(() =>
    isDashboardId(preferences.defaultDashboard) ? preferences.defaultDashboard : "news"
  );
  const { userName, tickerItems } = useShellConfig();

  const displayName = preferences.displayName.trim() || userName;

  // Switch the active dashboard and remember it so a reload restores the same page.
  const selectDashboard = useCallback((dashboard: DashboardId) => {
    setActiveDashboard(dashboard);
    setPreference("defaultDashboard", dashboard);
  }, []);

  const shellProps = {
    onOpenSettings: () => setIsSettingsOpen(true),
    userName: displayName,
    profileImage: preferences.profileImage,
    tickerItems,
    activeDashboard,
    onSelectDashboard: selectDashboard
  };

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
    }
  };

  return (
    <main className="dark h-svh overflow-hidden bg-background text-foreground">
      {renderDashboard()}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        isEditingCards={false}
        onToggleEditingCards={() => {}}
        activeDashboard={activeDashboard}
        onSelectDashboard={selectDashboard}
      />
    </main>
  );
}

export default App;
