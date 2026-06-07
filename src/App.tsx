import { useState } from "react";
import { usePreferences } from "@/app/preferences/usePreferences";
import { shellBackgroundClassName, shellBackgroundImageClassName } from "@/app/shell/background";
import { ShellFooter } from "@/app/shell/ShellFooter";
import { useConnectionStatus } from "@/app/shell/useConnectionStatus";
import { useShellClock } from "@/app/shell/useShellClock";
import { useShellConfig } from "@/app/shell/useShellConfig";
import bgImage from "@/assets/bg.png";
import { CardGrid } from "@/features/cards/CardGrid";
import { cardRegistry } from "@/features/cards/registry";
import { PlannerDashboard } from "@/features/dashboards/planner/PlannerDashboard";
import { type DashboardId } from "@/features/dashboards/dashboards";
import { SettingsDialog } from "@/features/settings/SettingsDialog";

function App() {
  const [isEditingCards, setIsEditingCards] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const preferences = usePreferences();
  const [activeDashboard, setActiveDashboard] = useState<DashboardId>(() => preferences.defaultDashboard);
  const { userName, tickerItems } = useShellConfig();
  const { dateText, timeText } = useShellClock(!preferences.clock24h);
  const connection = useConnectionStatus();

  const displayName = preferences.displayName.trim() || userName;
  const backgroundSource = preferences.backgroundImage || bgImage;
  const isHome = activeDashboard === "home";

  if (!isHome) {
    return (
      <main className="dark h-svh overflow-hidden bg-background text-foreground">
        <PlannerDashboard
          onOpenSettings={() => setIsSettingsOpen(true)}
          userName={displayName}
          profileImage={preferences.profileImage}
          tickerItems={tickerItems}
        />
        <SettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          isEditingCards={isEditingCards}
          onToggleEditingCards={() => setIsEditingCards((editing) => !editing)}
          activeDashboard={activeDashboard}
          onSelectDashboard={setActiveDashboard}
        />
      </main>
    );
  }

  return (
    <main className="dark h-svh overflow-hidden bg-background text-foreground">
      <div className={shellBackgroundClassName}>
        {preferences.showBackground ? (
          <div className={shellBackgroundImageClassName} style={{ backgroundImage: `url(${backgroundSource})` }} />
        ) : null}
      </div>
      <div className="relative z-10 flex h-full flex-col gap-3 px-4 py-3">
        <div className="flex min-h-0 flex-1 justify-center">
          <CardGrid cards={cardRegistry} isEditing={isEditingCards} />
        </div>
        <ShellFooter
          tickerItems={tickerItems}
          connection={connection}
          showTicker={preferences.showTicker}
          dateText={dateText}
          timeText={timeText}
          userName={displayName}
          profileImage={preferences.profileImage}
          isEditingCards={isHome && isEditingCards}
          canEdit={isHome}
          onToggleEditingCards={() => setIsEditingCards((editing) => !editing)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          activeDashboard={activeDashboard}
          onSelectDashboard={setActiveDashboard}
        />
      </div>
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        isEditingCards={isEditingCards}
        onToggleEditingCards={() => setIsEditingCards((editing) => !editing)}
        activeDashboard={activeDashboard}
        onSelectDashboard={setActiveDashboard}
      />
    </main>
  );
}

export default App;
