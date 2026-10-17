import type { FormEvent } from 'react';
import { ArrowRight, FolderPlus, Palette } from 'lucide-react';
import { CheckIcon, HandIcon } from '@/components/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

type NavigationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showArrows: boolean;
  onShowArrows: (value: boolean) => void;
  showThumbs: boolean;
  onShowThumbs: (value: boolean) => void;
};

export function NavigationDialog({
  open,
  onOpenChange,
  showArrows,
  onShowArrows,
  showThumbs,
  onShowThumbs,
}: NavigationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog">
        <DialogTitle>A tu manera</DialogTitle>
        <DialogDescription>
          Elige qué controles ver mientras expones. Siempre puedes arrastrar las fichas.
        </DialogDescription>
        <div className="preference-row branded-switch-row">
          <label htmlFor="show-arrows">
            <strong>Flechas de navegación</strong>
            <span>Botones para avanzar y volver.</span>
          </label>
          <Switch id="show-arrows" checked={showArrows} onCheckedChange={onShowArrows} />
        </div>
        <div className="preference-row branded-switch-row">
          <label htmlFor="show-thumbnails">
            <strong>Miniaturas de las fichas</strong>
            <span>Salta a cualquier idea con un toque.</span>
          </label>
          <Switch id="show-thumbnails" checked={showThumbs} onCheckedChange={onShowThumbs} />
        </div>
        <button className="button primary settings-done" onClick={() => onOpenChange(false)}>
          Listo <CheckIcon size={17} />
        </button>
      </DialogContent>
    </Dialog>
  );
}

type DeckNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Renaming the open deck instead of creating a new one. */
  rename: boolean;
  title: string;
  onTitleChange: (title: string) => void;
  onSubmit: () => void;
};

export function DeckNameDialog({
  open,
  onOpenChange,
  rename,
  title,
  onTitleChange,
  onSubmit,
}: DeckNameDialogProps) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog">
        <DialogTitle>{rename ? 'Nombre de la exposición' : '¿Qué vas a contar?'}</DialogTitle>
        <DialogDescription>
          {rename
            ? 'Un nombre para encontrarla fácilmente.'
            : 'Dale un nombre. Después, una ficha por cada idea.'}
        </DialogDescription>
        <form onSubmit={submit}>
          <label className="input-label" htmlFor="deck-name">
            Nombre de la exposición
          </label>
          <input
            id="deck-name"
            autoFocus
            className="text-input"
            value={title}
            maxLength={160}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ej. La ingeniería como profesión"
            required
          />
          <button className="button primary" type="submit" disabled={!title.trim()}>
            {rename ? 'Guardar nombre' : 'Crear exposición'}
            <ArrowRight size={18} />
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type DeleteDeckDialogProps = {
  /** Title of the deck being deleted, or undefined when the dialog is closed. */
  deckTitle: string | undefined;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteDeckDialog({ deckTitle, open, onCancel, onConfirm }: DeleteDeckDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogTitle>¿Eliminar esta exposición?</AlertDialogTitle>
        <AlertDialogDescription>
          Se eliminarán «{deckTitle}» y todas sus fichas. Esta acción no se puede deshacer.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel>Conservar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="delete-confirm">
            Eliminar exposición
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function HelpDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="app-dialog help-dialog">
        <DialogTitle>Una ayuda rápida.</DialogTitle>
        <DialogDescription>Para recordar lo esencial cuando lo necesites.</DialogDescription>
        <ol>
          <li>
            <span>
              <FolderPlus size={19} />
            </span>
            <div>
              <strong>Crea tu exposición</strong>
              <p>Reúne todas las fichas de un tema en una colección.</p>
            </div>
          </li>
          <li>
            <span>
              <Palette size={19} />
            </span>
            <div>
              <strong>Escribe y hazla tuya</strong>
              <p>El título es opcional. Elige estilo, color y tamaño de texto para cada ficha.</p>
            </div>
          </li>
          <li>
            <span>
              <HandIcon size={19} />
            </span>
            <div>
              <strong>Habla a tu ritmo</strong>
              <p>
                Pulsa Exponer. Arrastra la ficha a la izquierda para avanzar o a la derecha para
                volver. También puedes elegir una miniatura. Pulsa Esc para volver a editar.
              </p>
            </div>
          </li>
        </ol>
        <p className="hint">
          El guardado es automático y necesita conexión. Espera a ver «Todo guardado» antes de
          cerrar.
        </p>
      </DialogContent>
    </Dialog>
  );
}
