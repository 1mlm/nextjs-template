"use client";

import {
  ComponentIcon,
  Link01Icon,
  RefreshIcon,
  SidebarLeftIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
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
  const { toggleSidebar } = useSidebar();

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

  const actionCommands: PaletteCommand[] = [
    {
      id: "toggle-sidebar",
      label: "Toggle sidebar",
      icon: SidebarLeftIcon,
      shortcut: ["mod", "b"],
      run: toggleSidebar,
    },
    {
      id: "copy-link",
      label: "Copy link to this page",
      icon: Link01Icon,
      run: () => copyToClipboard(window.location.href),
    },
    {
      id: "reload",
      label: "Reload the page",
      icon: RefreshIcon,
      run: () => window.location.reload(),
    },
  ];

  const showcaseCommands: PaletteCommand[] = showcaseEntries.map(
    ({ name, section, slug }) => ({
      id: slug,
      label: name,
      icon: ComponentIcon,
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
        <Command className="bg-transparent">
          <CommandInput placeholder="Search pages, actions, components..." />
          <CommandList className="max-h-[min(24rem,60dvh)]">
            <CommandEmpty>nothing matches that, try fewer letters</CommandEmpty>
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
