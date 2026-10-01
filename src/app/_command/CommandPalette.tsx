"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { useCommandState } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { Icon } from "@/components/Icon";
import { Kbd } from "@/components/Kbd";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/shadcn/ui/command";
import { useSidebar } from "@/shadcn/ui/sidebar";
import { copyToClipboard } from "@/utils/clipboard";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";
import { NAV_ITEMS } from "../_sidebar/nav";

const OPEN_SHORTCUT_KEY = "k";

type PaletteCommand = {
  id: string;
  label: string;
  icon: IconSvgElement;
  // muted text on the right, also searchable
  hint?: string;
  shortcut?: string[];
  run: () => void;
};

type ShowcaseEntry = { name: string; section: string; slug: string };

const CommandPaletteContext = createContext<(() => void) | null>(null);

export function useOpenCommandPalette() {
  const open = useContext(CommandPaletteContext);
  if (!open)
    throw new Error("useOpenCommandPalette needs a CommandPaletteProvider");
  return open;
}

// the showcase is heavy (charts and all), so its card list only loads the
// first time the palette opens instead of shipping with every page
async function loadShowcaseEntries(): Promise<ShowcaseEntry[]> {
  const { SHOWCASE_SECTIONS, getShowcaseSlug } = await import(
    "../showcase/sections"
  );
  return SHOWCASE_SECTIONS.flatMap(({ title, items }) =>
    items.map(({ name }) => ({
      name,
      section: title,
      slug: getShowcaseSlug(name),
    })),
  );
}

// cmdk's default fuzzy match lets random letters hit long labels like
// "Copy link to this page", so gibberish never came back empty
function matchesEveryWord(value: string, search: string, keywords?: string[]) {
  const searchableText = [value, ...(keywords ?? [])].join(" ").toLowerCase();
  const words = search.toLowerCase().split(/\s+/).filter(Boolean);
  return words.every((word) => searchableText.includes(word)) ? 1 : 0;
}

function NoMatchTitle() {
  const search = useCommandState((state) => state.search);
  return (
    <span className="max-w-full truncate px-4 text-sm font-medium">
      nothing matches "{search}"
    </span>
  );
}

const FOOTER_HINTS = [
  { keys: ["up", "down"], label: "move" },
  { keys: ["enter"], label: "open" },
  { keys: ["esc"], label: "close" },
];

// ⌘K / Ctrl+K from anywhere: jump to a page, run an action, or find any
// showcase component. the sidebar and phone menu open it too
export function CommandPaletteProvider({ children }: PropsWithChildren) {
  const [open, setOpen] = useState(false);
  const [showcaseEntries, setShowcaseEntries] = useState<ShowcaseEntry[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { toggleSidebar, isMobile } = useSidebar();

  useEffect(() => {
    const toggleOnShortcut = (event: KeyboardEvent) => {
      const isShortcut =
        event.key === OPEN_SHORTCUT_KEY && (event.metaKey || event.ctrlKey);
      if (!isShortcut || event.repeat) return;
      event.preventDefault();
      setOpen((isOpen) => !isOpen);
    };
    window.addEventListener("keydown", toggleOnShortcut);
    return () => window.removeEventListener("keydown", toggleOnShortcut);
  }, []);

  useEffect(() => {
    if (!open || showcaseEntries.length > 0) return;
    loadShowcaseEntries().then(setShowcaseEntries);
  }, [open, showcaseEntries.length]);

  const runAndClose = (run: () => void) => {
    triggerHaptic("selection");
    setOpen(false);
    run();
  };

  const jumpToShowcaseCard = async (slug: string) => {
    if (pathname !== "/showcase") return router.push(`/showcase#${slug}`);
    const { flashShowcaseCard } = await import("../showcase/sections");
    window.history.replaceState(null, "", `#${slug}`);
    flashShowcaseCard(slug);
  };

  const pageCommands: PaletteCommand[] = NAV_ITEMS.map(
    ({ href, label, icon }) => ({
      id: href,
      label,
      icon,
      hint: href,
      run: () => router.push(href),
    }),
  );

  // phones have no sidebar to toggle and pull down to reload
  const desktopOnlyActionCommands: PaletteCommand[] = [
    {
      id: "toggle-sidebar",
      label: "Toggle sidebar",
      icon: APP_ICONS.sidebar,
      shortcut: ["mod", "b"],
      run: toggleSidebar,
    },
    {
      id: "reload",
      label: "Reload the page",
      icon: APP_ICONS.reload,
      run: () => window.location.reload(),
    },
  ];

  const actionCommands: PaletteCommand[] = [
    ...(isMobile ? [] : desktopOnlyActionCommands),
    {
      id: "copy-link",
      label: "Copy link to this page",
      icon: APP_ICONS.link,
      run: () => copyToClipboard(window.location.href),
    },
  ];

  const showcaseCommands: PaletteCommand[] = showcaseEntries.map(
    ({ name, section, slug }) => ({
      id: slug,
      label: name,
      icon: APP_ICONS.showcaseCard,
      hint: section,
      run: () => jumpToShowcaseCard(slug),
    }),
  );

  const commandGroups = [
    { heading: "Pages", commands: pageCommands },
    { heading: "Actions", commands: actionCommands },
    { heading: "Showcase", commands: showcaseCommands },
  ];

  return (
    <CommandPaletteContext.Provider value={() => setOpen(true)}>
      {children}
      <CommandDialog
        {...{ open }}
        onOpenChange={setOpen}
        title="Command palette"
        description="jump to a page, run an action or find a component"
        className="sm:max-w-lg"
      >
        {/* CommandDialog doesn't bring its own cmdk root, the items need one */}
        <Command className="bg-transparent" filter={matchesEveryWord}>
          <CommandInput placeholder="Search pages, actions, components..." />
          <CommandList className="max-h-[min(24rem,60dvh)]">
            <CommandEmpty className="flex flex-col items-center gap-1 py-8">
              <Icon
                icon={APP_ICONS.searchEmpty}
                className="mb-1 size-7 text-muted-foreground"
              />
              <NoMatchTitle />
              <span className="text-xs text-muted-foreground">
                try a page name, an action or a component
              </span>
            </CommandEmpty>
            {commandGroups.map(({ heading, commands }) => (
              <CommandGroup key={heading} {...{ heading }}>
                {commands.map(({ id, label, icon, hint, shortcut, run }) => (
                  <CommandItem
                    key={id}
                    value={`${heading} ${label}`}
                    keywords={hint ? [hint] : undefined}
                    onSelect={() => runAndClose(run)}
                    className="cursor-pointer rounded-lg"
                  >
                    <Icon {...{ icon }} className="text-muted-foreground" />
                    <span className="flex-1 truncate">{label}</span>
                    {hint && (
                      <span className="truncate text-xs text-muted-foreground">
                        {hint}
                      </span>
                    )}
                    {shortcut && (
                      <CommandShortcut>
                        <Kbd keys={shortcut} />
                      </CommandShortcut>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
          <div className="flex items-center gap-4 border-t border-border px-3 py-2 text-xs text-muted-foreground pointer-coarse:hidden">
            {FOOTER_HINTS.map(({ keys, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Kbd {...{ keys }} />
                {label}
              </span>
            ))}
          </div>
        </Command>
      </CommandDialog>
    </CommandPaletteContext.Provider>
  );
}
