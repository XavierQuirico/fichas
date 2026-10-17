'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { DesignPanel } from '@/components/workspace/design-panel';
import {
  DeckNameDialog,
  DeleteDeckDialog,
  HelpDialog,
  NavigationDialog,
} from '@/components/workspace/dialogs';
import { Editor } from '@/components/workspace/editor';
import { Filmstrip } from '@/components/workspace/filmstrip';
import { Library } from '@/components/workspace/library';
import { Presentation } from '@/components/workspace/presentation';
import { Topbar } from '@/components/workspace/topbar';
import { useArchive } from '@/hooks/use-archive';
import { useCardDrag } from '@/hooks/use-card-drag';
import { useCardFonts } from '@/hooks/use-card-fonts';
import { useEdgeSwipe } from '@/hooks/use-edge-swipe';
import { useFullscreen } from '@/hooks/use-fullscreen';
import { useLeaveWarning } from '@/hooks/use-leave-warning';
import { useLongPressSort } from '@/hooks/use-long-press-sort';
import { usePaperMetrics } from '@/hooks/use-paper-metrics';
import { useViewPreferences } from '@/hooks/use-view-preferences';
import { useWakeLock } from '@/hooks/use-wake-lock';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import { writingHints } from '@/lib/card-fonts';
import { stageBackground } from '@/lib/stage-background';
import { exampleDeck, newCard, newId, tutorialDeck, type Card, type Deck } from '@/lib/fichas';

const MAX_CARDS_PER_DECK = 200;

export function Workspace({ accountControl }: { accountControl?: ReactNode }) {
  const { decks, status, error, current, loaded, save, flush, change, reload } = useWorkspaceSync();
  const { fontMap, fontReady, fontSaving, saveFonts, cardFont } = useCardFonts({
    beforeSave: flush,
  });
  const { archived, showArchived, setShowArchived, archiveBusy, archiveReady, archiveDeck } =
    useArchive();
  const { showThumbs, setShowThumbs, showArrows, setShowArrows } = useViewPreferences();
  useLeaveWarning(fontSaving || !!archiveBusy);

  const [active, setActive] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [present, setPresent] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [rename, setRename] = useState(false);
  const [removeDeck, setRemoveDeck] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [mobileDesignOpen, setMobileDesignOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [scrollHint, setScrollHint] = useState(true);
  const cardScroll = useRef<HTMLDivElement>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const textPanel = useRef<HTMLDivElement>(null);
  const textTrigger = useRef<HTMLButtonElement>(null);

  const closePanels = useCallback(() => {
    setTextOpen(false);
    setNavigationOpen(false);
  }, []);
  const {
    immersive,
    fullscreenThumbs,
    focusMode,
    setFocusMode,
    fullElement,
    leaveFullscreen,
    enterFullscreen,
  } = useFullscreen({ closePanels });

  const deck = decks.find((d) => d.id === active);
  const card = deck?.cards[index];
  const cardId = card?.id;
  // The closing card is the final navigation position, immediately after the real cards.
  const finished = !!deck && present && index === deck.cards.length;

  useEffect(() => {
    if (cardId) setHintIndex((i) => (i + 1) % writingHints.length);
  }, [cardId, present]);

  useEffect(() => {
    if (!textOpen) return;
    const outside = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        !textPanel.current?.contains(target) &&
        !textTrigger.current?.contains(target)
      )
        setTextOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [textOpen]);

  useEffect(() => {
    setTextOpen(false);
  }, [index]);

  useEffect(() => {
    setScrollHint(true);
  }, [cardId, present]);

  const open = (id: string) => {
    setActive(id);
    setIndex(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const goHome = () => {
    setActive(null);
    void save();
  };

  const updateDeck = (next: Deck) =>
    change(
      current.current.map((d) =>
        d.id === next.id ? { ...next, updatedAt: new Date().toISOString() } : d,
      ),
    );

  const editCard = (patch: Partial<Card>) => {
    if (!deck || !card) return;
    updateDeck({
      ...deck,
      cards: deck.cards.map((c) => (c.id === card.id ? { ...c, ...patch } : c)),
    });
  };

  const navigate = useCallback(
    (n: number) => {
      if (!deck) return;
      setIndex(Math.max(0, Math.min(deck.cards.length - (present ? 0 : 1), n)));
    },
    [deck, present],
  );

  const swipe = useCardDrag({ index, cardCount: deck ? deck.cards.length : null, navigate });
  const { cancelDrag } = swipe;

  const exitPresent = useCallback(() => {
    cancelDrag();
    setIndex((i) => Math.min(i, Math.max(0, (deck?.cards.length ?? 1) - 1)));
    setPresent(false);
    setFocusMode(false);
    setTextOpen(false);
    if (fullElement()) void leaveFullscreen();
  }, [deck, cancelDrag, setFocusMode, fullElement, leaveFullscreen]);

  const edge = useEdgeSwipe(exitPresent);
  useWakeLock(present);

  const metrics = usePaperMetrics({
    present,
    cardScroll,
    card,
    layoutKey: [showThumbs, showArrows, fontMap],
  });

  useEffect(() => {
    if (!present || navigationOpen || textOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      if (
        (e.target as HTMLElement)?.closest(
          'input,textarea,[role="slider"],[role="dialog"],[role="menu"]',
        )
      )
        return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        navigate(index + 1);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigate(index - 1);
      }
      if (e.key === 'Escape') {
        if (fullElement()) void leaveFullscreen();
        else if (focusMode) setFocusMode(false);
        else exitPresent();
      }
      if (e.key === 'Home') navigate(0);
      if (e.key === 'End') navigate(deck?.cards.length ?? 0);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    present,
    index,
    navigate,
    deck,
    navigationOpen,
    textOpen,
    focusMode,
    setFocusMode,
    exitPresent,
    fullElement,
    leaveFullscreen,
  ]);

  // Keep the current card's text at the top and its thumbnail centred in the filmstrip.
  useEffect(() => {
    cardScroll.current?.scrollTo({ top: 0 });
    const rail = thumbs.current;
    const selected = rail?.querySelector<HTMLElement>('[aria-current="true"]');
    if (rail && selected) {
      const offset = selected.getBoundingClientRect().left - rail.getBoundingClientRect().left;
      rail.scrollTo({
        left: rail.scrollLeft + offset - rail.clientWidth / 2 + selected.clientWidth / 2,
        behavior: 'smooth',
      });
    }
  }, [index, active]);

  const addCard = () => {
    if (!deck || deck.cards.length >= MAX_CARDS_PER_DECK) return;
    const added = newCard(card);
    updateDeck({ ...deck, cards: [...deck.cards, added] });
    if (card && fontMap[card.id]) saveFonts([added.id], fontMap[card.id]);
    setIndex(deck.cards.length);
  };

  const startGuide = () => {
    setShowThumbs(true);
    setPresent(true);
  };

  const create = (example: false | 'example' | 'tutorial' = false) => {
    if (!loaded.current) return;
    if (example) {
      const existing = current.current
        .filter((d) =>
          example === 'tutorial' ? d.id.startsWith('tutorial-') : d.title === 'Habla con confianza',
        )
        .sort((a, b) => b.cards.length - a.cards.length)[0];
      if (existing) {
        open(existing.id);
        if (example === 'tutorial') startGuide();
        return;
      }
    }
    const d =
      example === 'tutorial'
        ? tutorialDeck()
        : example === 'example'
          ? exampleDeck()
          : {
              id: newId(),
              title: newTitle.trim() || 'Nueva exposición',
              cards: [newCard()],
              updatedAt: new Date().toISOString(),
            };
    change([d, ...current.current]);
    open(d.id);
    setCreateOpen(false);
    setNewTitle('');
    if (example === 'tutorial') startGuide();
  };

  const openGuide = () => {
    const guide = current.current.find((d) => d.id.startsWith('tutorial-'));
    if (guide) {
      open(guide.id);
      startGuide();
    } else create('tutorial');
  };

  const duplicate = (id: string) => {
    if (!deck || deck.cards.length >= MAX_CARDS_PER_DECK) return;
    const at = deck.cards.findIndex((c) => c.id === id);
    if (at < 0) return;
    const cards = [...deck.cards];
    const copied = { ...cards[at], id: newId() };
    cards.splice(at + 1, 0, copied);
    if (fontMap[id]) saveFonts([copied.id], fontMap[id]);
    updateDeck({ ...deck, cards });
    setIndex(at + 1);
    toast.success('Ficha duplicada');
  };

  const duplicateDeck = (id: string) => {
    const source = current.current.find((d) => d.id === id);
    if (!source) return;
    const copy = {
      ...source,
      id: newId(),
      title: `${source.title} (copia)`,
      cards: source.cards.map((c) => ({ ...c, id: newId() })),
      updatedAt: new Date().toISOString(),
    };
    change([copy, ...current.current]);
    toast.success('Exposición duplicada');
  };

  const deleteCard = (id: string) => {
    if (!deck) return;
    const at = deck.cards.findIndex((c) => c.id === id);
    if (at < 0) return;
    const removed = { ...deck.cards[at] };
    const deckId = deck.id;
    const cards = deck.cards.filter((c) => c.id !== id);
    updateDeck({ ...deck, cards });
    setIndex((i) => Math.max(0, Math.min(i - (at < i ? 1 : 0), cards.length - (present ? 0 : 1))));
    toast('Ficha eliminada', {
      action: {
        label: 'Deshacer',
        onClick: () => {
          const d = current.current.find((x) => x.id === deckId);
          if (!d) return;
          const restored = [...d.cards];
          restored.splice(Math.min(at, restored.length), 0, removed);
          change(current.current.map((x) => (x.id === deckId ? { ...d, cards: restored } : x)));
          setIndex(Math.min(at, restored.length - 1));
        },
      },
      duration: 8000,
    });
  };

  const applyDesignToAll = () => {
    if (!deck || !card) return;
    saveFonts(
      deck.cards.map((c) => c.id),
      fontMap[card.id] ?? 'sans',
    );
    updateDeck({
      ...deck,
      cards: deck.cards.map((c) => ({
        ...c,
        color: card.color,
        style: card.style,
        size: card.size,
        backgroundColor: card.backgroundColor,
      })),
    });
    toast.success('Diseño aplicado a todas las fichas');
  };

  const sortable = useLongPressSort((group, id, over, side) => {
    if (group === 'decks') {
      const list = [...current.current];
      const from = list.findIndex((d) => d.id === id);
      const to = list.findIndex((d) => d.id === over);
      if (from < 0 || to < 0) return;
      const [moving] = list.splice(from, 1);
      const target = list.findIndex((d) => d.id === over);
      list.splice(side ? target + (side === 'after' ? 1 : 0) : to, 0, moving);
      change(list);
      toast.success('Exposiciones reordenadas');
      return;
    }
    if (!deck) return;
    const cards = [...deck.cards];
    const from = cards.findIndex((c) => c.id === id);
    const to = cards.findIndex((c) => c.id === over);
    if (from < 0 || to < 0) return;
    const selected = card?.id;
    cards.splice(to, 0, cards.splice(from, 1)[0]);
    updateDeck({ ...deck, cards });
    setIndex(
      finished
        ? cards.length
        : Math.max(
            0,
            cards.findIndex((c) => c.id === selected),
          ),
    );
    toast.success('Fichas reordenadas');
  });

  const startPresent = () => {
    if (!deck?.cards.length) return;
    void save();
    setPresent(true);
    setTextOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const openNewDeck = () => {
    setRename(false);
    setCreateOpen(true);
  };

  const openRename = () => {
    if (!deck) return;
    setRename(true);
    setNewTitle(deck.title);
    setCreateOpen(true);
  };

  const submitDeckName = () => {
    if (rename && deck) {
      updateDeck({ ...deck, title: newTitle.trim() });
      setCreateOpen(false);
    } else create();
  };

  const confirmRemoveDeck = () => {
    change(current.current.filter((d) => d.id !== removeDeck));
    setRemoveDeck(null);
  };

  const backgroundCard = finished ? deck?.cards.at(-1) : card;
  const stageColor = stageBackground(backgroundCard);
  const paperVars = {
    '--card-font': `${(card?.size ?? 24) / 16}rem`,
    '--baseline': `${metrics.baseline}px`,
    '--paper-font': cardFont(card?.id),
  } as CSSProperties;
  const visibleDecks = decks.filter((d) =>
    showArchived ? archived.includes(d.id) : !archived.includes(d.id),
  );

  const strip = deck && (
    <Filmstrip
      deck={deck}
      index={index}
      present={present}
      stripRef={thumbs}
      sortable={sortable}
      cardFont={cardFont}
      onNavigate={navigate}
      onDuplicate={duplicate}
      onDelete={deleteCard}
      onAdd={addCard}
    />
  );

  return (
    <div
      className={`app ${present ? 'presenting' : deck ? 'editing' : ''}`}
      style={present ? { backgroundColor: stageColor ?? 'var(--paper-raised)' } : undefined}
    >
      <Toaster position="top-center" theme="light" />
      {!present && (
        <Topbar
          status={status}
          accountControl={accountControl}
          helpOpen={help}
          onHome={goHome}
          onHelp={() => setHelp(true)}
        />
      )}
      {error && (
        <div className="error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => (loaded.current ? void save() : reload())}>Reintentar</button>
        </div>
      )}
      {!deck && !present && (
        <Library
          decks={decks}
          visibleDecks={visibleDecks}
          loaded={loaded.current}
          loading={status === 'loading'}
          archived={archived}
          archiveReady={archiveReady}
          archiveBusy={archiveBusy}
          showArchived={showArchived}
          sortable={sortable}
          cardFont={cardFont}
          onToggleArchived={() => setShowArchived(!showArchived)}
          onNew={openNewDeck}
          onOpen={open}
          onDuplicate={duplicateDeck}
          onArchive={(id, archive) => void archiveDeck(id, archive)}
          onRemove={setRemoveDeck}
          onCreateExample={create}
          onOpenGuide={openGuide}
        />
      )}
      {deck && !present && (
        <Editor
          deck={deck}
          card={card}
          index={index}
          stageColor={stageColor}
          paperVars={paperVars}
          hintIndex={hintIndex}
          onNextHint={() => setHintIndex((i) => (i + 1) % writingHints.length)}
          bodyInput={metrics.bodyInput}
          strip={strip}
          designPanel={
            card ? (
              <DesignPanel
                card={card}
                fontMap={fontMap}
                fontReady={fontReady}
                fontSaving={fontSaving}
                overflowing={metrics.overflowing}
                onEdit={editCard}
                onFont={(font) => saveFonts([card.id], font)}
                onApplyToAll={applyDesignToAll}
              />
            ) : (
              <p className="hint">Añade una ficha para elegir su diseño.</p>
            )
          }
          mobileDesignOpen={mobileDesignOpen}
          onToggleMobileDesign={() => setMobileDesignOpen(!mobileDesignOpen)}
          onBack={goHome}
          onRename={openRename}
          onPresent={startPresent}
          onEdit={editCard}
          onNavigate={navigate}
          onAddCard={addCard}
        />
      )}
      {deck && present && (
        <Presentation
          deck={deck}
          card={card}
          index={index}
          finished={finished}
          stageColor={stageColor}
          paperVars={paperVars}
          showThumbs={showThumbs}
          showArrows={showArrows}
          immersive={immersive}
          fullscreenThumbs={fullscreenThumbs}
          navigationOpen={navigationOpen}
          textOpen={textOpen}
          overflowing={metrics.overflowing}
          scrollHint={scrollHint}
          cardScroll={cardScroll}
          textTrigger={textTrigger}
          textPanel={textPanel}
          swipe={swipe}
          edge={edge}
          strip={strip}
          onExit={exitPresent}
          onOpenNavigation={() => setNavigationOpen(true)}
          onToggleText={() => setTextOpen(!textOpen)}
          onCloseText={() => setTextOpen(false)}
          onFullscreen={() => void enterFullscreen(showThumbs)}
          onResize={(size) => editCard({ size })}
          onNavigate={navigate}
          onToggleThumbs={() => setShowThumbs(!showThumbs)}
          onScrolled={() => setScrollHint(false)}
        />
      )}
      <NavigationDialog
        open={navigationOpen}
        onOpenChange={setNavigationOpen}
        showArrows={showArrows}
        onShowArrows={setShowArrows}
        showThumbs={showThumbs}
        onShowThumbs={setShowThumbs}
      />
      <DeckNameDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        rename={rename}
        title={newTitle}
        onTitleChange={setNewTitle}
        onSubmit={submitDeckName}
      />
      <DeleteDeckDialog
        open={!!removeDeck}
        deckTitle={decks.find((d) => d.id === removeDeck)?.title}
        onCancel={() => setRemoveDeck(null)}
        onConfirm={confirmRemoveDeck}
      />
      <HelpDialog open={help} onOpenChange={setHelp} />
    </div>
  );
}
