import { shellBackgroundClassName, shellBackgroundImageClassName, shellForegroundClassName } from "@/app/shell/background";
import { ShellFooter } from "@/app/shell/ShellFooter";
import { ShellHeader } from "@/app/shell/ShellHeader";
import { useConnectionStatus } from "@/app/shell/useConnectionStatus";
import { useShellClock } from "@/app/shell/useShellClock";
import { useShellConfig } from "@/app/shell/useShellConfig";
import bgImage from "@/assets/bg.png";
import { CardGrid } from "@/features/cards/CardGrid";
import { cardRegistry } from "@/features/cards/registry";

function App() {
  const { userName, tickerItems } = useShellConfig();
  const { dateText, timeText } = useShellClock();
  const connection = useConnectionStatus();

  return (
    <main className="dark min-h-svh bg-background text-foreground">
      <div className={shellBackgroundClassName}>
        <div className={shellBackgroundImageClassName} style={{ backgroundImage: `url(${bgImage})` }} />
      </div>
      <div className={shellForegroundClassName}>
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
