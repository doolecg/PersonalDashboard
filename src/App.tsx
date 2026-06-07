import { useState } from "react";
import { shellBackgroundClassName, shellBackgroundImageClassName } from "@/app/shell/background";
import { ShellFooter } from "@/app/shell/ShellFooter";
import { ShellHeader } from "@/app/shell/ShellHeader";
import { useConnectionStatus } from "@/app/shell/useConnectionStatus";
import { useShellClock } from "@/app/shell/useShellClock";
import { useShellConfig } from "@/app/shell/useShellConfig";
import bgImage from "@/assets/bg.png";
import { CardGrid } from "@/features/cards/CardGrid";
import { cardRegistry } from "@/features/cards/registry";
import { WeatherDevPanel } from "@/features/cards/weather/WeatherDevPanel";

function App() {
  const [isEditingCards, setIsEditingCards] = useState(false);
  const { userName, tickerItems } = useShellConfig();
  const { dateText, timeText } = useShellClock();
  const connection = useConnectionStatus();

  return (
    <main className="dark h-svh overflow-hidden bg-background text-foreground">
      <div className={shellBackgroundClassName}>
        <div className={shellBackgroundImageClassName} style={{ backgroundImage: `url(${bgImage})` }} />
      </div>
      <div className="relative z-10 flex h-full flex-col gap-3 px-4 py-3">
        {import.meta.env.DEV ? (
          <div className="pointer-events-none absolute right-4 top-4 z-30 flex justify-end md:right-6 md:top-5">
            <WeatherDevPanel />
          </div>
        ) : null}
        <ShellHeader
          dateText={dateText}
          isEditingCards={isEditingCards}
          onToggleEditingCards={() => setIsEditingCards((editing) => !editing)}
          timeText={timeText}
          userName={userName}
        />
        <div className="flex min-h-0 flex-1 justify-center">
          <CardGrid cards={cardRegistry} isEditing={isEditingCards} />
        </div>
        <ShellFooter tickerItems={tickerItems} connection={connection} />
      </div>
    </main>
  );
}

export default App;
