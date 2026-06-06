import { ShellFooter } from "@/app/shell/ShellFooter";
import { ShellHeader } from "@/app/shell/ShellHeader";
import { useConnectionStatus } from "@/app/shell/useConnectionStatus";
import { useShellClock } from "@/app/shell/useShellClock";
import { useShellConfig } from "@/app/shell/useShellConfig";
import { CardGrid } from "@/features/cards/CardGrid";
import { cardRegistry } from "@/features/cards/registry";

function App() {
  const { userName, tickerItems } = useShellConfig();
  const { dateText, timeText } = useShellClock();
  const connection = useConnectionStatus();

  return (
    <main className="dark min-h-svh bg-background px-4 py-4 text-foreground md:px-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] max-w-7xl flex-col gap-4">
        <ShellHeader userName={userName} timeText={timeText} dateText={dateText} />
        <div className="flex flex-1 justify-center py-1">
          <CardGrid cards={cardRegistry} />
        </div>
        <ShellFooter tickerItems={tickerItems} connection={connection} />
      </div>
    </main>
  );
}

export default App;
