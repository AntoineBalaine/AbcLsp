import {
  Annotation,
  BarLine,
  Beam,
  Beam_contents,
  Chord,
  Comment,
  Decoration,
  Expr,
  Grace_group,
  Info_line,
  Inline_field,
  MultiMeasureRest,
  Music_code,
  Note,
  Nth_repeat,
  Pitch,
  Rest,
  Rhythm,
  Symbol,
  Tune_Body,
  YSPACER,
  music_code
} from './Expr';
import { Token } from './token';
import { Range, TokenType } from './types';

export function isMusicCode(expr: Expr | Token): expr is Music_code {
  return expr instanceof Music_code;
}

export const isBeam = (expr: Expr | undefined | Token): expr is Beam => {
  return expr instanceof Beam;
};
export const isNote = (expr: Expr | undefined | Token): expr is Note => {
  return expr instanceof Note;
};
export const isBarLine = (expr: Expr | undefined | Token): expr is BarLine => {
  return expr instanceof BarLine;
};
export const isAnnotation = (expr: Expr | undefined | Token): expr is Annotation => {
  return expr instanceof Annotation;
};
export const isGraceGroup = (expr: Expr | undefined | Token): expr is Grace_group => {
  return expr instanceof Grace_group;
};
export const isNthRepeat = (expr: Expr | undefined | Token): expr is Nth_repeat => {
  return expr instanceof Nth_repeat;
};
export const isInline_field = (
  expr: Expr | undefined | Token
): expr is Inline_field => {
  return expr instanceof Inline_field;
};
export const isChord = (expr: Expr | undefined | Token): expr is Chord => {
  return expr instanceof Chord;
};
export const isSymbol = (expr: Expr | undefined | Token): expr is Symbol => {
  return expr instanceof Symbol;
};
export const isMultiMeasureRest = (
  expr: Expr | undefined | Token
): expr is MultiMeasureRest => {
  return expr instanceof MultiMeasureRest;
};
export const isComment = (expr: Expr | undefined | Token): expr is Comment => {
  return expr instanceof Comment;
};
export const isPitch = (expr: Expr | undefined | Token): expr is Pitch => {
  return expr instanceof Pitch;
};
export const isRhythm = (expr: Expr | undefined | Token): expr is Rhythm => {
  return expr instanceof Rhythm;
};
export const isRest = (expr: Expr | undefined | Token): expr is Rest => {
  return expr instanceof Rest;
};
export const isToken = (expr: Expr | undefined | Token): expr is Token => {
  return expr instanceof Token;
};
export const isInfo_line = (expr: Expr | undefined | Token): expr is Info_line => {
  return expr instanceof Info_line;
};
export function isYSPACER(expr: Expr | Token): expr is YSPACER {
  return expr instanceof YSPACER;
}
export function isSlurToken(expr: Expr | Token) {
  return expr instanceof Token && (expr.type === TokenType.LEFTPAREN || expr.type === TokenType.RIGHT_PAREN);
}
export function isTune_Body(expr: Expr): expr is Tune_Body {
  return expr instanceof Tune_Body;
}

export const mergeTokens = (tokens: Token[]) => {
  return tokens
    .map((t) => cloneToken(t))
    .reduce((prev, cur, index) => {
      if (index === 0) {
        return prev;
      }
      prev.lexeme = prev.lexeme + cur.lexeme;
      return prev;
    });
};

export const cloneToken = (token: Token) => {
  return new Token(token.type, cloneText(token.lexeme), null, token.line, token.position);
};

export const cloneText = (text: string) => {
  return (" " + text).slice(1);
};

export function stringifyNote(note: Note): string {
  let retStr = '';
  retStr += note.pitch instanceof Rest ? note.pitch.rest.lexeme : stringifyPitch(note.pitch);
  if (note.rhythm) {
    retStr += stringifyRhythm(note.rhythm);
  }
  return retStr;
}

export function stringifyPitch(pitch: Pitch) {
  let retStr = '';
  retStr += pitch.alteration?.lexeme || '';
  retStr += pitch.noteLetter.lexeme || '';
  retStr += pitch.octave?.lexeme || '';
  return retStr;
}

export function stringifyRhythm(rhythm: Rhythm) {
  let retStr = '';
  retStr += rhythm.numerator || '';
  retStr += rhythm.separator || '';
  retStr += rhythm.denominator || '';
  retStr += rhythm.broken || '';
}

export function followedByWS(expr: music_code) {
  if (expr instanceof Token) {
    return /[ \t]$/.test(expr.lexeme);
  } else { return false; }
}

export function isBeamContents(e: unknown): e is Beam_contents {
  return (
    e instanceof Token
    || e instanceof YSPACER
    || e instanceof Annotation
    || e instanceof Decoration
    || e instanceof Note
    || e instanceof Grace_group
    || e instanceof Chord
    || e instanceof Symbol
  );
}

/**
 * Iterate music_code from given index.
 * if any of the expressions is a note, return true.
 * if any of the expressions is a beam breaker, return false.
 */
export function followedByNote(music_code: Array<Expr | Token>, index: number) {
  for (let i = index; i < music_code.length; i++) {
    if (!isBeamContents(music_code[i]) || isWS(music_code[i])) {
      return false;
    } else if (isNote(music_code[i]) || isChord(music_code[i])) {
      return true;
    }
  }
  return false;
}

/**
 * checks whether e is WHITESPACE, EOL, EOF, or ANTISLASH_EOL
 * @param e 
 * @returns 
 */
export function isWS(e: unknown) {
  return e instanceof Token && (e.type === TokenType.WHITESPACE || e.type === TokenType.EOL || e.type === TokenType.EOF || e.type === TokenType.ANTISLASH_EOL);
}

/**
 * if cur expr is a note not immediately followed by WS or beam break,
 * find whether there is another note before a beam breaker or before end of array.
 *
 * Beam breakers are barlines, inline fields, and nth repeats.
 */
export function foundBeam(music_code: Array<Expr | Token>, index: number) {
  /**
   * iterate the array from the given index.
   * if any of the expressions is a note, return true.
   * if any of the expressions is a beam breaker, return false.
   */
  if ((isNote(music_code[index]) || isChord(music_code[index])) && !isWS(music_code[index + 1])) {
    return followedByNote(music_code, index + 1);
  } else {
    return false;
  }
}

/**
 * beam's end is when we find a beam breaker or end of array.
 */
export function beamEnd(music_code: Array<Expr | Token>, index: number) {
  const cur = music_code[index];
  const next = music_code[index + 1];
  if ((isNote(cur) || isChord(cur)) && isBeamBreaker(cur)) {
    return true;
  } else {
    return isBeamBreaker(cur);
  }
}

export function isRhythmInRange(range: Range, expr: Rhythm): boolean {
  const {
    numerator,
    separator,
    denominator,
    broken,
  } = expr;
  const arr = [
    numerator,
    separator,
    denominator,
    broken,
  ].filter((e): e is Token => (!!e));
  if (arr.some(e => isTokenInRange(range, e))) {
    return true;
  } else { return false; }
}

export function isTokenInRange(range: Range, expr: Token): boolean {
  return range.start.line <= expr.line && range.end.line >= expr.line && range.start.character <= expr.position && range.end.character >= expr.position;
}

function isBeamBreaker(cur: Token | Expr): boolean {
  if (isToken(cur)) {
    return isWS(cur);
  } else {
    return !isBeamContents(cur) || isBarLine(cur);
  }
}


export function getPitchRange(e: Pitch | Rest): Range {
  if (isRest(e)) {
    return {
      start: {
        line: e.rest.line,
        character: e.rest.position
      },
      end: {
        line: e.rest.line,
        character: e.rest.position + e.rest.lexeme.length
      }
    };
  } else {

    let range = {
      start: {
        line: e.noteLetter.line,
        character: e.noteLetter.position
      },
      end: {
        line: e.noteLetter.line,
        character: e.noteLetter.position + e.noteLetter.lexeme.length
      }
    };
    if (e.alteration) {
      range.start.line = e.alteration.line;
      range.start.character = e.alteration.position;
    }
    if (e.octave) {
      range.end.line = e.octave.line;
      range.end.character = e.octave.position + e.octave.lexeme.length;
    }
    return range;
  }
}

export function exprIsInRange(control_range: Range, expr_range: Range): boolean {
  return expr_range.start.line >= control_range.start.line
    && expr_range.end.line <= control_range.end.line
    && expr_range.start.character >= control_range.start.character
    && expr_range.end.character <= control_range.end.character + 1;

}
export function getTokenRange(token: Token): Range {
  return {
    start: {
      line: token.line,
      character: token.position,
    },
    end: {
      line: token.line,
      character: token.position + token.lexeme.length,
    }
  };
}

export const reduceRanges = (acc: Range, cur: Range, index: number, arr: Range[]): Range => {
  if (index === 0) {
    return cur;
  };
  return {
    start: {
      line: Math.min(acc.start.line, cur.start.line),
      character: Math.min(acc.start.character, cur.start.character)
    },
    end: {
      line: Math.max(acc.end.line, cur.end.line),
      character: Math.max(acc.end.character, cur.end.character)
    }
  };
};

export const isEmptyRhythm = (rhythm: Rhythm): boolean => {
  const {
    numerator,
    separator,
    denominator,
    broken,
  } = rhythm;
  return !numerator && !separator && !denominator && !broken;
};