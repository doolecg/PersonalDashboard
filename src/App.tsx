import { CardGrid } from "@/features/cards/CardGrid";
import { cardRegistry } from "@/features/cards/registry";

function App() {
  return (
    <main className="dark min-h-svh bg-background p-6 text-foreground">
      <CardGrid cards={cardRegistry} />
    </main>
  );
}

export default App;
