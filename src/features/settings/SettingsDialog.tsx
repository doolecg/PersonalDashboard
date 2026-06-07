import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Clock, Image, LayoutGrid, MapPin, Newspaper, RotateCcw, Search, Upload, User } from "lucide-react";
import { geocodeLocation, type GeocodeLocationResult } from "@/app/apiClient";
import { setPreference, type DashboardLocation } from "@/app/preferences/preferences";
import { usePreferences } from "@/app/preferences/usePreferences";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { readImageFile } from "./imageFile";

const layoutStorageKey = "dashboard-card-layout";
export const settingsDialogContentClassName = "dark max-h-[85vh] overflow-y-auto bg-background/95 text-foreground";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditingCards: boolean;
  onToggleEditingCards: () => void;
};

function resetLayout() {
  try {
    window.localStorage.removeItem(layoutStorageKey);
  } catch {
    // ignore storage access errors
  }
  window.location.reload();
}

export function SettingsDialog({
  open,
  onOpenChange,
  isEditingCards,
  onToggleEditingCards,
}: SettingsDialogProps) {
  const preferences = usePreferences();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={settingsDialogContentClassName}>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Personalise your dashboard.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <SettingRow
            icon={<User className="h-4 w-4" />}
            title="Display name"
            description="Shown in the header. Leave blank to use the default."
          >
            <Input
              className="w-44"
              value={preferences.displayName}
              placeholder="Your name"
              onChange={(event) => setPreference("displayName", event.target.value)}
              aria-label="Display name"
            />
          </SettingRow>

          <SettingRow
            icon={<User className="h-4 w-4" />}
            title="Profile picture"
            description="Browse for an image to show in the header."
          >
            <ImagePicker
              value={preferences.profileImage}
              onSelect={(dataUrl) => setPreference("profileImage", dataUrl)}
              maxDim={256}
              previewClassName="rounded-full"
              ariaLabel="Profile picture"
            />
          </SettingRow>

          <SettingRow
            icon={<Image className="h-4 w-4" />}
            title="Background picture"
            description="Browse for a photo to use as the dashboard background."
          >
            <ImagePicker
              value={preferences.backgroundImage}
              onSelect={(dataUrl) => setPreference("backgroundImage", dataUrl)}
              maxDim={1920}
              previewClassName="rounded-lg"
              ariaLabel="Background picture"
            />
          </SettingRow>

          <SettingRow
            icon={<MapPin className="h-4 w-4" />}
            title="Location"
            description="Used for weather cards and AI weather reports."
          >
            <LocationPicker
              value={preferences.location}
              onSelect={(location) => setPreference("location", location)}
            />
          </SettingRow>

          <SettingRow
            icon={<Clock className="h-4 w-4" />}
            title="24-hour clock"
            description="Show the time in 24-hour format."
          >
            <Switch
              checked={preferences.clock24h}
              onCheckedChange={(checked) => setPreference("clock24h", checked)}
              aria-label="Toggle 24-hour clock"
            />
          </SettingRow>

          <SettingRow
            icon={<Image className="h-4 w-4" />}
            title="Background image"
            description="Show the blurred background photo behind the dashboard."
          >
            <Switch
              checked={preferences.showBackground}
              onCheckedChange={(checked) => setPreference("showBackground", checked)}
              aria-label="Toggle background image"
            />
          </SettingRow>

          <SettingRow
            icon={<Newspaper className="h-4 w-4" />}
            title="News ticker"
            description="Show the scrolling headlines in the footer."
          >
            <Switch
              checked={preferences.showTicker}
              onCheckedChange={(checked) => setPreference("showTicker", checked)}
              aria-label="Toggle news ticker"
            />
          </SettingRow>

          <SettingRow
            icon={<LayoutGrid className="h-4 w-4" />}
            title="Edit dashboard layout"
            description="Drag, resize and reorder cards on the grid."
          >
            <Switch
              checked={isEditingCards}
              onCheckedChange={onToggleEditingCards}
              aria-label="Toggle card editing"
            />
          </SettingRow>

          <SettingRow
            icon={<RotateCcw className="h-4 w-4" />}
            title="Reset layout"
            description="Restore every card to its default position and size."
          >
            <Button variant="outline" size="sm" type="button" onClick={resetLayout}>
              Reset
            </Button>
          </SettingRow>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type SettingRowProps = {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
};

type ImagePickerProps = {
  value: string;
  onSelect: (dataUrl: string) => void;
  maxDim: number;
  previewClassName?: string;
  ariaLabel: string;
};

type LocationPickerProps = {
  value: DashboardLocation | null;
  onSelect: (location: DashboardLocation | null) => void;
};

function LocationPicker({ value, onSelect }: LocationPickerProps) {
  const [query, setQuery] = useState(value?.name ?? "");
  const [results, setResults] = useState<GeocodeLocationResult[]>([]);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setQuery(value?.name ?? "");
  }, [value?.name]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError("");
    try {
      const nextResults = await geocodeLocation(trimmed);
      setResults(nextResults);
      if (!nextResults.length) setError("No matching locations found.");
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Location search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="flex w-72 max-w-[48vw] flex-col gap-2">
      <form className="flex items-center gap-2" onSubmit={handleSearch}>
        <Input
          className="min-w-0"
          value={query}
          placeholder="Search place"
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Weather location"
        />
        <Button variant="outline" size="sm" type="submit" disabled={isSearching}>
          <Search className="h-3.5 w-3.5" />
          {isSearching ? "Finding" : "Find"}
        </Button>
      </form>

      {value ? (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">Active: {value.name}</span>
          <Button variant="ghost" size="xs" type="button" onClick={() => {
            onSelect(null);
            setResults([]);
            setQuery("");
          }}>
            Clear
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-xs text-destructive">{error}</p> : null}

      {results.length > 0 ? (
        <div className="flex max-h-36 flex-col gap-1 overflow-y-auto rounded-xl border border-border/60 bg-background/40 p-1">
          {results.map((result) => (
            <button
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-foreground hover:bg-muted/70"
              key={`${result.latitude}-${result.longitude}-${result.label}`}
              type="button"
              onClick={() => {
                onSelect({
                  name: result.label,
                  latitude: result.latitude,
                  longitude: result.longitude
                });
                setResults([]);
              }}
            >
              <span className="min-w-0 truncate">{result.label}</span>
              <span className="shrink-0 font-semibold uppercase text-muted-foreground">Use</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ImagePicker({ value, onSelect, maxDim, previewClassName, ariaLabel }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setIsBusy(true);
    try {
      const dataUrl = await readImageFile(file, maxDim);
      onSelect(dataUrl);
    } catch {
      // ignore decode/read failures and leave the previous image in place
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {value ? (
        <img
          src={value}
          alt=""
          className={`h-9 w-9 shrink-0 border border-border/60 object-cover ${previewClassName ?? "rounded-lg"}`}
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        aria-label={ariaLabel}
      />
      <Button
        variant="outline"
        size="sm"
        type="button"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-3.5 w-3.5" />
        {isBusy ? "Loading…" : "Browse"}
      </Button>
      {value ? (
        <Button variant="ghost" size="sm" type="button" onClick={() => onSelect("")}>
          Remove
        </Button>
      ) : null}
    </div>
  );
}

function SettingRow({ icon, title, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-background/40 px-4 py-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/60 text-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
