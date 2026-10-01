"use client";

import { FlipVerticalIcon } from "@hugeicons/core-free-icons";
import {
  Chess,
  type Color as ChessColor,
  type Move,
  type PieceSymbol,
  SQUARES,
  type Square,
} from "chess.js";
import { AnimatePresence, motion } from "motion/react";
import { type PointerEvent, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerConfetti } from "@/utils/confetti";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";
import { Chime, playChime } from "@/utils/sound";

type BoardPiece = {
  id: string;
  type: PieceSymbol;
  color: ChessColor;
  square: Square;
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const SQUARE_PERCENT = 12.5;
const PROMOTION_CHOICES: PieceSymbol[] = ["q", "r", "b", "n"];
const SIDE_NAMES: Record<ChessColor, string> = { w: "White", b: "Black" };

// the piece set lives in public/svgs/chess (Caliente by avi, CC BY-NC-SA 4.0,
// see the README next to the files), swap the folder to change the look
const getPieceImage = (type: PieceSymbol, color: ChessColor) =>
  `/svgs/chess/${type}${color}.svg`;

// file and rank of a square as 0 to 7 steps from the top left of the board
const getGridPosition = (square: Square, isFlipped: boolean) => {
  const file = FILES.indexOf(square[0]);
  const rank = 8 - Number(square[1]);
  return isFlipped ? { file: 7 - file, rank: 7 - rank } : { file, rank };
};

// chess.js lists the squares a8 to h1 row by row, so the index is the grid position
const getSquareAt = (file: number, rank: number, isFlipped: boolean) =>
  SQUARES[(isFlipped ? 7 - rank : rank) * 8 + (isFlipped ? 7 - file : file)];

const findSquare = (name: string) => SQUARES.find((square) => square === name);

// pieces keep an id from move to move so motion can slide them across the
// board, chess.js only knows what's on each square
const createPieces = (chess: Chess): BoardPiece[] =>
  chess
    .board()
    .flat()
    .flatMap((cell) => (cell ? [cell] : []))
    .map((cell, index) => ({
      ...cell,
      id: `${cell.color}${cell.type}-${index}`,
    }));

const applyMove = (pieces: BoardPiece[], move: Move): BoardPiece[] => {
  const isEnPassant = move.flags.includes("e");
  const capturedSquare = isEnPassant
    ? findSquare(`${move.to[0]}${move.from[1]}`)
    : move.to;
  // castling also slides the rook next to the king
  const rookHomeFile = move.flags.includes("k")
    ? "h"
    : move.flags.includes("q")
      ? "a"
      : undefined;
  const rookLandingFile = move.flags.includes("k") ? "f" : "d";
  const rookHome = rookHomeFile && findSquare(`${rookHomeFile}${move.from[1]}`);
  const rookLanding = findSquare(`${rookLandingFile}${move.from[1]}`);

  return pieces
    .filter((piece) => !(move.captured && piece.square === capturedSquare))
    .map((piece) => {
      if (piece.square === move.from)
        return {
          ...piece,
          square: move.to,
          type: move.promotion ?? piece.type,
        };
      if (rookHome && rookLanding && piece.square === rookHome)
        return { ...piece, square: rookLanding };
      return piece;
    });
};

const getStatusText = (chess: Chess) => {
  const side = SIDE_NAMES[chess.turn()];
  if (chess.isCheckmate())
    return `Checkmate, ${SIDE_NAMES[chess.turn() === "w" ? "b" : "w"]} wins`;
  if (chess.isStalemate()) return "Stalemate, nobody wins";
  if (chess.isDraw()) return "Draw";
  if (chess.isCheck()) return `${side} is in check`;
  return `${side} to move`;
};

const findKingSquare = (pieces: BoardPiece[], color: ChessColor) =>
  pieces.find((piece) => piece.type === "k" && piece.color === color)?.square;

// a whole chess game with the rules from chess.js. tap a piece to see where it
// can go (dots for moves, rings for captures) and tap a square, or just drag
// it there. pieces slide, captures pop, the last move stays lit, promotions ask
// what you want, undo and flip are below
export function ChessBoard({ className }: { className?: string }) {
  const [chess] = useState(() => new Chess());
  const [pieces, setPieces] = useState(() => createPieces(chess));
  const [selected, setSelected] = useState<Square>();
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square }>();
  const [isFlipped, setIsFlipped] = useState(false);
  const [drag, setDrag] = useState<{
    pieceId: string;
    left: number;
    top: number;
  }>();
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  }>();
  const boardRef = useRef<HTMLDivElement>(null);
  const pressedAt = useRef<{ x: number; y: number }>(undefined);

  const legalMoves = selected
    ? chess.moves({ square: selected, verbose: true })
    : [];
  const isGameOver = chess.isGameOver();
  const checkedKingSquare = chess.isCheck()
    ? findKingSquare(pieces, chess.turn())
    : undefined;

  const performMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    const move = chess.move({ from, to, promotion });
    setPieces(applyMove(pieces, move));
    setLastMove({ from, to });
    setSelected(undefined);
    setPendingPromotion(undefined);
    if (chess.isCheckmate()) {
      triggerHaptic("success");
      playChime(Chime.Success);
      triggerConfetti();
    } else if (chess.isCheck()) triggerHaptic("warning");
    else triggerHaptic(move.captured ? "medium" : "light");
  };

  const tryMove = (from: Square, to: Square) => {
    const candidates = chess
      .moves({ square: from, verbose: true })
      .filter((move) => move.to === to);
    if (candidates.length === 0) return false;
    if (candidates[0].promotion) setPendingPromotion({ from, to });
    else performMove(from, to);
    return true;
  };

  const getPointerSquare = (event: PointerEvent) => {
    const box = boardRef.current?.getBoundingClientRect();
    if (!box) return undefined;
    const file = Math.floor(((event.clientX - box.left) / box.width) * 8);
    const rank = Math.floor(((event.clientY - box.top) / box.height) * 8);
    if (file < 0 || file > 7 || rank < 0 || rank > 7) return undefined;
    return getSquareAt(file, rank, isFlipped);
  };

  const getDragOffset = (event: PointerEvent) => {
    const box = boardRef.current?.getBoundingClientRect();
    if (!box) return { left: 0, top: 0 };
    return {
      left: ((event.clientX - box.left) / box.width) * 100 - SQUARE_PERCENT / 2,
      top: ((event.clientY - box.top) / box.height) * 100 - SQUARE_PERCENT / 2,
    };
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (isGameOver || pendingPromotion) return;
    const square = getPointerSquare(event);
    if (!square) return;
    pressedAt.current = { x: event.clientX, y: event.clientY };
    const piece = pieces.find((candidate) => candidate.square === square);
    const isOwnPiece = piece?.color === chess.turn();
    // pressing a target while a piece is selected moves it right away
    if (selected && !isOwnPiece && tryMove(selected, square)) return;
    if (!piece || !isOwnPiece) return setSelected(undefined);
    boardRef.current?.setPointerCapture(event.pointerId);
    triggerHaptic("selection");
    setSelected(square);
    setDrag({ pieceId: piece.id, ...getDragOffset(event) });
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, ...getDragOffset(event) });
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!drag || !selected) return;
    const start = pressedAt.current;
    const wasDragged = start
      ? Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
      : false;
    const target = getPointerSquare(event);
    setDrag(undefined);
    if (!wasDragged || !target || target === selected) return;
    if (!tryMove(selected, target)) setSelected(undefined);
  };

  const undo = () => {
    if (!chess.undo()) return;
    setPieces(createPieces(chess));
    const previous = chess.history({ verbose: true }).at(-1);
    setLastMove(previous && { from: previous.from, to: previous.to });
    setSelected(undefined);
  };

  const reset = () => {
    chess.reset();
    setPieces(createPieces(chess));
    setLastMove(undefined);
    setSelected(undefined);
  };

  const squares = Array.from({ length: 64 }, (_, index) => {
    const file = index % 8;
    const rank = Math.floor(index / 8);
    return { file, rank, square: getSquareAt(file, rank, isFlipped) };
  });

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center gap-4",
        className,
      )}
    >
      <p className="text-sm font-medium" aria-live="polite">
        {getStatusText(chess)}
      </p>
      <div
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDrag(undefined)}
        className="relative aspect-square w-full touch-none overflow-hidden rounded-3xl border select-none"
      >
        {squares.map(({ file, rank, square }) => {
          const isDark = (file + rank) % 2 === 1;
          const isLastMove =
            lastMove?.from === square || lastMove?.to === square;
          const legalMove = legalMoves.find((move) => move.to === square);
          return (
            <div
              key={square}
              style={{
                left: `${file * SQUARE_PERCENT}%`,
                top: `${rank * SQUARE_PERCENT}%`,
              }}
              className={cn(
                "absolute size-[12.5%]",
                isDark ? "bg-foreground/10" : "bg-card",
                isLastMove && "bg-amber-400/40",
                selected === square && "bg-amber-400/60",
                checkedKingSquare === square && "bg-rose-500/45",
              )}
            >
              {rank === 7 && (
                <span className="absolute right-1 bottom-0.5 text-[10px] text-muted-foreground">
                  {square[0]}
                </span>
              )}
              {file === 0 && (
                <span className="absolute top-0.5 left-1 text-[10px] text-muted-foreground">
                  {square[1]}
                </span>
              )}
              {legalMove && (
                <span
                  className={cn(
                    "absolute inset-0 m-auto rounded-full",
                    legalMove.captured
                      ? "size-[86%] border-4 border-foreground/25"
                      : "size-[28%] bg-foreground/25",
                  )}
                />
              )}
            </div>
          );
        })}
        <AnimatePresence>
          {pieces.map((piece) => {
            const { file, rank } = getGridPosition(piece.square, isFlipped);
            const isDragged = drag?.pieceId === piece.id;
            return (
              // biome-ignore lint/performance/noImgElement: tiny static svgs animated by motion, next/image adds nothing
              <motion.img
                key={piece.id}
                src={getPieceImage(piece.type, piece.color)}
                alt={`${SIDE_NAMES[piece.color]} ${piece.type}`}
                draggable={false}
                loading="lazy"
                initial={{
                  left: `${file * SQUARE_PERCENT}%`,
                  top: `${rank * SQUARE_PERCENT}%`,
                }}
                animate={{
                  left: isDragged
                    ? `${drag.left}%`
                    : `${file * SQUARE_PERCENT}%`,
                  top: isDragged ? `${drag.top}%` : `${rank * SQUARE_PERCENT}%`,
                  scale: isDragged ? 1.15 : 1,
                }}
                exit={{ scale: 0, rotate: 50, opacity: 0 }}
                transition={
                  isDragged
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 420, damping: 32 }
                }
                style={{ zIndex: isDragged ? 20 : 10 }}
                className="pointer-events-none absolute size-[12.5%] p-[1.5%]"
              />
            );
          })}
        </AnimatePresence>
        {pendingPromotion && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/70">
            <div className="flex gap-1 rounded-3xl border bg-card p-2 shadow-[0_6px_0_0_var(--border)]">
              {PROMOTION_CHOICES.map((type) => (
                <button
                  key={type}
                  type="button"
                  aria-label={`Promote to ${type}`}
                  onClick={() =>
                    performMove(
                      pendingPromotion.from,
                      pendingPromotion.to,
                      type,
                    )
                  }
                  className="size-14 cursor-pointer rounded-2xl p-1 transition-transform hover:bg-muted active:scale-90"
                >
                  {/* biome-ignore lint/performance/noImgElement: a tiny static svg, next/image adds nothing */}
                  <img
                    src={getPieceImage(type, chess.turn())}
                    alt=""
                    draggable={false}
                    className="size-full"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={undo}>
          <Icon icon={APP_ICONS.undo} /> Undo
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <Icon icon={FlipVerticalIcon} /> Flip
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          <Icon icon={APP_ICONS.reload} /> New game
        </Button>
      </div>
    </div>
  );
}
