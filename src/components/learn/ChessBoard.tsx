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
import {
  AnimatePresence,
  type MotionValue,
  motion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  type ComponentProps,
  type PointerEvent,
  useRef,
  useState,
} from "react";
import { Icon } from "@/components/Icon";
import { Button } from "@/shadcn/ui/button";
import { cn } from "@/shadcn/utils";
import { triggerConfetti } from "@/utils/confetti";
import { triggerHaptic } from "@/utils/haptics";
import { APP_ICONS } from "@/utils/icons";
import { clamp } from "@/utils/math";
import { Chime, playChime } from "@/utils/sound";

type BoardPiece = {
  id: string;
  type: PieceSymbol;
  color: ChessColor;
  square: Square;
};

type LastMove = { from: Square; to: Square };

// what undo puts back: the pieces with their ids (so they slide back to where
// they came from instead of the board being rebuilt) and the move highlight
type Snapshot = { pieces: BoardPiece[]; lastMove?: LastMove };

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const LABEL_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7];
const PIECE_SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;
const SQUARE_PERCENT = 12.5;
const PROMOTION_CHOICES: PieceSymbol[] = ["q", "r", "b", "n"];
const SIDE_NAMES: Record<ChessColor, string> = { w: "White", b: "Black" };

// the piece set lives in public/svgs/chess (Caliente by avi, CC BY-NC-SA 4.0,
// see the README next to the files), swap the folder to change the look
const getPieceImage = (type: PieceSymbol, color: ChessColor) =>
  `/svgs/chess/${type}${color}.svg`;

// file and rank of a square as 0 to 7 steps from the top left of the board.
// the board is always laid out white side down, flipping just spins it
const getGridPosition = (square: Square) => ({
  file: FILES.indexOf(square[0]),
  rank: 8 - Number(square[1]),
});

// the square under a spot on screen, chess.js lists the squares a8 to h1 row
// by row, so the index is the grid position (mirrored when the board is flipped)
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

const getPieceAnimation = ({
  isDragged,
  isInCheck,
  isSelected,
}: {
  isDragged: boolean;
  isInCheck: boolean;
  isSelected: boolean;
}): Pick<ComponentProps<typeof motion.img>, "animate" | "transition"> => {
  // held pieces never sit still, a nervous little shake like they know what's coming
  if (isDragged)
    return {
      animate: { rotate: [-2.5, 2.5, -2.5], y: 0 },
      transition: { rotate: { duration: 0.22, repeat: Infinity } },
    };
  if (isInCheck)
    return {
      animate: { rotate: [0, -7, 7, -5, 5, 0], y: 0 },
      transition: {
        rotate: { duration: 0.5, repeat: Infinity, repeatDelay: 1 },
      },
    };
  // the selected one bobs so you can see which one you're holding
  if (isSelected)
    return {
      animate: { y: [0, -4, 0], rotate: 0 },
      transition: { y: { duration: 0.9, repeat: Infinity, ease: "easeInOut" } },
    };
  return { animate: { y: 0, rotate: 0 }, transition: PIECE_SPRING };
};

// three layers on purpose: the outer one moves and stays upright while the
// board spins, the middle one lifts and leans with the drag speed, the inner
// one does the shaking, so the effects stack instead of fighting over `rotate`
function ChessPiece({
  piece,
  drag,
  isSelected,
  isInCheck,
  dragTilt,
  uprightRotation,
}: {
  piece: BoardPiece;
  drag?: { left: number; top: number };
  isSelected: boolean;
  isInCheck: boolean;
  dragTilt: MotionValue<number>;
  uprightRotation: MotionValue<number>;
}) {
  const { file, rank } = getGridPosition(piece.square);
  const restingLeft = `${file * SQUARE_PERCENT}%`;
  const restingTop = `${rank * SQUARE_PERCENT}%`;
  const isDragged = drag !== undefined;
  const followPointer = { duration: 0 };
  const { animate, transition } = getPieceAnimation({
    isDragged,
    isInCheck,
    isSelected,
  });

  return (
    <motion.div
      initial={{ left: restingLeft, top: restingTop, scale: 0, opacity: 0 }}
      animate={{
        left: isDragged ? `${drag.left}%` : restingLeft,
        top: isDragged ? `${drag.top}%` : restingTop,
        scale: 1,
        opacity: 1,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        default: PIECE_SPRING,
        left: isDragged ? followPointer : PIECE_SPRING,
        top: isDragged ? followPointer : PIECE_SPRING,
      }}
      style={{ rotate: uprightRotation, zIndex: isDragged ? 20 : 10 }}
      className="pointer-events-none absolute size-[12.5%]"
    >
      <motion.div
        animate={
          isDragged
            ? {
                scale: 1.25,
                y: "-8%",
                filter: "drop-shadow(0 10px 6px rgb(0 0 0 / 0.3))",
              }
            : {
                scale: 1,
                y: "0%",
                filter: "drop-shadow(0 0 0 rgb(0 0 0 / 0))",
              }
        }
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        style={{ rotate: isDragged ? dragTilt : 0 }}
        className="size-full"
      >
        {/* biome-ignore lint/performance/noImgElement: tiny static svgs animated by motion, next/image adds nothing */}
        <motion.img
          src={getPieceImage(piece.type, piece.color)}
          alt={`${SIDE_NAMES[piece.color]} ${piece.type}`}
          draggable={false}
          loading="lazy"
          {...{ animate, transition }}
          className="size-full p-[1.5%]"
        />
      </motion.div>
    </motion.div>
  );
}

// a whole chess game with the rules from chess.js. tap a piece to see where it
// can go (dots for moves, rings for captures) and tap a square, or just drag
// it there. held pieces lift, lean into the drag and shake, drops ripple, the
// board spins when flipped, undo slides everything (captures included) back
export function ChessBoard({ className }: { className?: string }) {
  const [chess] = useState(() => new Chess());
  const [pieces, setPieces] = useState(() => createPieces(chess));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [selected, setSelected] = useState<Square>();
  const [hoveredSquare, setHoveredSquare] = useState<Square>();
  const [lastMove, setLastMove] = useState<LastMove>();
  const [isFlipped, setIsFlipped] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [drag, setDrag] = useState<{
    pieceId: string;
    left: number;
    top: number;
  }>();
  const [pendingPromotion, setPendingPromotion] = useState<LastMove>();
  const boardRef = useRef<HTMLDivElement>(null);
  const pressedAt = useRef<{ x: number; y: number }>(undefined);
  const lastPointerX = useRef(0);
  const tiltResetTimeout = useRef<number>(undefined);

  // the board spins to flip, the pieces' counter rotation and the dip in scale
  // come from the same spring so they can't drift apart
  const boardRotation = useSpring(0, { stiffness: 120, damping: 16 });
  const uprightRotation = useTransform(boardRotation, (degrees) => -degrees);
  const boardScale = useTransform(
    boardRotation,
    (degrees) => 1 - 0.06 * Math.sin((degrees * Math.PI) / 180),
  );
  const dragTilt = useSpring(0, { stiffness: 260, damping: 9 });

  const legalMoves = selected
    ? chess.moves({ square: selected, verbose: true })
    : [];
  const isGameOver = chess.isGameOver();
  const checkedKingSquare = chess.isCheck()
    ? findKingSquare(pieces, chess.turn())
    : undefined;
  const status = getStatusText(chess);

  const performMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    const move = chess.move({ from, to, promotion });
    setHistory([...history, { pieces, lastMove }]);
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

  // the dragged piece lives inside the spinning layer, so on a flipped board
  // the pointer's spot has to be mirrored into that layer's coordinates
  const getDragOffset = (event: PointerEvent) => {
    const box = boardRef.current?.getBoundingClientRect();
    if (!box) return { left: 0, top: 0 };
    const toLayerPercent = (pointerPercent: number) =>
      isFlipped
        ? 100 - pointerPercent - SQUARE_PERCENT / 2
        : pointerPercent - SQUARE_PERCENT / 2;
    return {
      left: toLayerPercent(((event.clientX - box.left) / box.width) * 100),
      top: toLayerPercent(((event.clientY - box.top) / box.height) * 100),
    };
  };

  const leanIntoDrag = (event: PointerEvent) => {
    const speed = event.clientX - lastPointerX.current;
    lastPointerX.current = event.clientX;
    dragTilt.set(clamp(speed * 1.8, -20, 20));
    window.clearTimeout(tiltResetTimeout.current);
    tiltResetTimeout.current = window.setTimeout(() => dragTilt.set(0), 60);
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (isGameOver || pendingPromotion) return;
    const square = getPointerSquare(event);
    if (!square) return;
    pressedAt.current = { x: event.clientX, y: event.clientY };
    lastPointerX.current = event.clientX;
    const piece = pieces.find((candidate) => candidate.square === square);
    const isOwnPiece = piece?.color === chess.turn();
    // pressing a target while a piece is selected moves it right away
    if (selected && !isOwnPiece && tryMove(selected, square)) return;
    if (!piece || !isOwnPiece) return setSelected(undefined);
    boardRef.current?.setPointerCapture(event.pointerId);
    triggerHaptic("selection");
    setSelected(square);
    setHoveredSquare(square);
    setDrag({ pieceId: piece.id, ...getDragOffset(event) });
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!drag) return;
    setDrag({ ...drag, ...getDragOffset(event) });
    setHoveredSquare(getPointerSquare(event));
    leanIntoDrag(event);
  };

  const stopDragging = () => {
    setDrag(undefined);
    setHoveredSquare(undefined);
    dragTilt.set(0);
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (!drag || !selected) return;
    const start = pressedAt.current;
    const wasDragged = start
      ? Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
      : false;
    const target = getPointerSquare(event);
    stopDragging();
    if (!wasDragged || !target || target === selected) return;
    if (!tryMove(selected, target)) setSelected(undefined);
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous || !chess.undo()) return;
    setHistory(history.slice(0, -1));
    setPieces(previous.pieces);
    setLastMove(previous.lastMove);
    setSelected(undefined);
    setUndoCount(undoCount + 1);
    triggerHaptic("light");
  };

  const flip = () => {
    const nextIsFlipped = !isFlipped;
    setIsFlipped(nextIsFlipped);
    boardRotation.set(nextIsFlipped ? 180 : 0);
    triggerHaptic("light");
  };

  const reset = () => {
    chess.reset();
    setPieces(createPieces(chess));
    setHistory([]);
    setLastMove(undefined);
    setSelected(undefined);
  };

  const lastMoveGrid = lastMove && getGridPosition(lastMove.to);

  return (
    <div
      className={cn(
        "flex w-full max-w-md flex-col items-center gap-4",
        className,
      )}
    >
      <div className="h-5 overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={status}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="text-sm font-medium"
          >
            {status}
          </motion.p>
        </AnimatePresence>
      </div>
      <div
        ref={boardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={stopDragging}
        className="relative aspect-square w-full touch-none overflow-hidden rounded-3xl border select-none"
      >
        <motion.div
          style={{ rotate: boardRotation, scale: boardScale }}
          className="absolute inset-0"
        >
          {SQUARES.map((square, index) => {
            const file = index % 8;
            const rank = Math.floor(index / 8);
            const isDark = (file + rank) % 2 === 1;
            const isLastMove =
              lastMove?.from === square || lastMove?.to === square;
            const legalMoveIndex = legalMoves.findIndex(
              (move) => move.to === square,
            );
            const legalMove = legalMoves[legalMoveIndex];
            return (
              <div
                key={square}
                style={{
                  left: `${file * SQUARE_PERCENT}%`,
                  top: `${rank * SQUARE_PERCENT}%`,
                }}
                className={cn(
                  "absolute size-[12.5%] transition-colors duration-150",
                  isDark ? "bg-foreground/10" : "bg-card",
                  isLastMove && "bg-amber-400/40",
                  selected === square && "bg-amber-400/60",
                  checkedKingSquare === square && "bg-rose-500/45",
                  legalMove &&
                    hoveredSquare === square &&
                    "bg-amber-400/50 ring-4 ring-foreground/25 ring-inset",
                )}
              >
                {legalMove && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 18,
                      delay: legalMoveIndex * 0.015,
                    }}
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
          {lastMove && lastMoveGrid && (
            <motion.span
              key={`${history.length}-${lastMove.to}`}
              initial={{ scale: 0.3, opacity: 0.8 }}
              animate={{ scale: 1.8, opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{
                left: `${lastMoveGrid.file * SQUARE_PERCENT}%`,
                top: `${lastMoveGrid.rank * SQUARE_PERCENT}%`,
              }}
              className="pointer-events-none absolute z-5 size-[12.5%] rounded-full bg-amber-400/70"
            />
          )}
          {/* no initial animation so the first render isn't 32 pieces popping in */}
          <AnimatePresence initial={false}>
            {pieces.map((piece) => (
              <ChessPiece
                key={piece.id}
                {...{ piece, dragTilt, uprightRotation }}
                drag={drag?.pieceId === piece.id ? drag : undefined}
                isSelected={selected === piece.square}
                isInCheck={checkedKingSquare === piece.square}
              />
            ))}
          </AnimatePresence>
        </motion.div>
        {/* the coordinates stay put on the screen edges while the board spins */}
        {LABEL_INDEXES.map((index) => (
          <span
            key={`file-${index}`}
            style={{ left: `${(index + 1) * SQUARE_PERCENT}%` }}
            className="pointer-events-none absolute bottom-0.5 -translate-x-[125%] text-[10px] text-muted-foreground"
          >
            {getSquareAt(index, 7, isFlipped)[0]}
          </span>
        ))}
        {LABEL_INDEXES.map((index) => (
          <span
            key={`rank-${index}`}
            style={{ top: `${index * SQUARE_PERCENT}%` }}
            className="pointer-events-none absolute left-1 pt-0.5 text-[10px] text-muted-foreground"
          >
            {getSquareAt(0, index, isFlipped)[1]}
          </span>
        ))}
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
        <Button
          variant="outline"
          size="sm"
          disabled={history.length === 0}
          onClick={undo}
        >
          <motion.span
            animate={{ rotate: -360 * undoCount }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="inline-flex"
          >
            <Icon icon={APP_ICONS.undo} />
          </motion.span>
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={flip}>
          <motion.span
            animate={{ rotate: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="inline-flex"
          >
            <Icon icon={FlipVerticalIcon} />
          </motion.span>
          Flip
        </Button>
        <Button variant="ghost" size="sm" onClick={reset}>
          <Icon icon={APP_ICONS.reload} /> New game
        </Button>
      </div>
    </div>
  );
}
