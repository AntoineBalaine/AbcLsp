import {
  Annotation,
  BarLine,
  Chord,
  Comment,
  Decoration,
  Expr,
  File_header,
  File_structure,
  Grace_group,
  Info_line,
  Inline_field,
  Lyric_section,
  MultiMeasureRest,
  Music_code,
  Note,
  Nth_repeat,
  Pitch,
  Rest,
  Rhythm,
  Slur_group,
  Symbol,
  Tune,
  Tune_Body,
  Tune_header,
  Visitor,
  YSPACER,
  music_code,
} from "../Parser/Expr";
import Token from "../Parser/token";

export class TokensVisitor implements Visitor<void> {
  public tokens: Array<Token> = [];

  analyze(file_structure: File_structure) {
    this.visitFileStructureExpr(file_structure);
  }

  visitFileStructureExpr(file_structure: File_structure): void {
    const { file_header, tune } = file_structure;
    if (file_header) {
      this.visitFileHeaderExpr(file_header);
    }
    tune.forEach((tune) => {
      const { tune_header, tune_body } = tune;
      if (!tune_body) {
        return;
      }
      this.visitTuneHeaderExpr(tune_header);
      this.visitTuneBodyExpr(tune_body);
    });
  }
  visitFileHeaderExpr(file_header: File_header) {
    this.tokens.push(mergeTokens(file_header?.tokens));
  }
  visitTuneHeaderExpr(tune_header: Tune_header): void {
    tune_header?.info_lines.forEach((info_line) => {
      this.visitInfoLineExpr(info_line);
    });
  }
  visitTuneBodyExpr(tune_body: Tune_Body): void {
    tune_body?.sequence.forEach((tuneBody_element) => {
      if (tuneBody_element instanceof Comment) {
        this.visitCommentExpr(tuneBody_element);
      } else if (tuneBody_element instanceof Info_line) {
        this.visitInfoLineExpr(tuneBody_element);
      } else if (tuneBody_element instanceof Music_code) {
        this.visitMusicCodeExpr(tuneBody_element);
      } else if (isMusicCode(tuneBody_element)) {
        if (tuneBody_element instanceof Token) {
          this.tokens.push(tuneBody_element);
        } else if (tuneBody_element instanceof YSPACER) {
          if (tuneBody_element.number) {
            this.tokens.push(
              mergeTokens([tuneBody_element.ySpacer, tuneBody_element.number])
            );
          } else {
            this.tokens.push(tuneBody_element.ySpacer);
          }
        } else if (tuneBody_element instanceof BarLine) {
          this.visitBarLineExpr(tuneBody_element);
        } else if (tuneBody_element instanceof Annotation) {
          this.visitAnnotationExpr(tuneBody_element);
        } else if (tuneBody_element instanceof Decoration) {
          this.tokens.push(tuneBody_element.decoration);
        } else if (tuneBody_element instanceof Note) {
          this.visitNoteExpr(tuneBody_element);
        } else if (tuneBody_element instanceof Grace_group) {
          tuneBody_element.notes.forEach((note) => {
            this.visitNoteExpr(note);
          });
        } else if (tuneBody_element instanceof Nth_repeat) {
          this.tokens.push(tuneBody_element.repeat);
        } else if (tuneBody_element instanceof Inline_field) {
          this.tokens.push(tuneBody_element.field);
          this.tokens.push(mergeTokens(tuneBody_element.text));
        } else if (tuneBody_element instanceof Chord) {
          tuneBody_element.contents.forEach((content) => {
            if (content instanceof Token) {
              this.tokens.push(content);
            } else if (content instanceof Note) {
              this.visitNoteExpr(content);
            } else {
              this.tokens.push(content.text);
            }
          });
          if (tuneBody_element.rhythm) {
            this.visitRhythmExpr(tuneBody_element.rhythm);
          }
        } else if (tuneBody_element instanceof Symbol) {
          this.tokens.push(tuneBody_element.symbol);
        } else if (tuneBody_element instanceof MultiMeasureRest) {
          if (tuneBody_element.length) {
            this.tokens.push(
              mergeTokens([tuneBody_element.rest, tuneBody_element.length])
            );
          } else {
            this.tokens.push(tuneBody_element.rest);
          }
        } else if (tuneBody_element instanceof Slur_group) {
          this.visitSlurGroupExpr(tuneBody_element);
        }
      }
    });
  }
  visitMusicCodeExpr(element: Music_code) {
    element.contents.forEach((content: music_code) => {
      if (content instanceof Token) {
        this.tokens.push(content);
      } else if (content instanceof YSPACER) {
        if (content.number) {
          this.tokens.push(mergeTokens([content.ySpacer, content.number]));
        } else {
          this.tokens.push(content.ySpacer);
        }
      } else if (content instanceof BarLine) {
        this.visitBarLineExpr(content);
      } else if (content instanceof Annotation) {
        this.visitAnnotationExpr(content);
      } else if (content instanceof Decoration) {
        this.tokens.push(content.decoration);
      } else if (content instanceof Note) {
        this.visitNoteExpr(content);
      } else if (content instanceof Grace_group) {
        content.notes.forEach((note) => {
          this.visitNoteExpr(note);
        });
      } else if (content instanceof Nth_repeat) {
        this.tokens.push(content.repeat);
      } else if (content instanceof Inline_field) {
        this.tokens.push(content.field);
        this.tokens.push(mergeTokens(content.text));
      } else if (content instanceof Chord) {
        content.contents.forEach((content) => {
          if (content instanceof Token) {
            this.tokens.push(content);
          } else if (content instanceof Note) {
            this.visitNoteExpr(content);
          } else {
            this.tokens.push(content.text);
          }
        });
        if (content.rhythm) {
          this.visitRhythmExpr(content.rhythm);
        }
      } else if (content instanceof Symbol) {
        this.tokens.push(content.symbol);
      } else if (content instanceof MultiMeasureRest) {
        if (content.length) {
          this.tokens.push(mergeTokens([content.rest, content.length]));
        } else {
          this.tokens.push(content.rest);
        }
      } else if (content instanceof Slur_group) {
        this.visitSlurGroupExpr(content);
      }
    });
  }
  visitBarLineExpr(content: BarLine) {
    this.tokens.push(content.barline);
  }
  visitAnnotationExpr(content: Annotation) {
    this.tokens.push(content.text);
  }
  visitNoteExpr(content: Note) {
    if (content.pitch instanceof Rest) {
      this.tokens.push(content.pitch.rest);
    } else {
      this.visitPitchExpr(content.pitch);
    }
    if (content.rhythm) {
      this.visitRhythmExpr(content.rhythm);
    }
    if (content.tie) {
      // TODO do nothing for now, ignore
    }
  }
  visitRhythmExpr(rhythm: Rhythm) {
    this.tokens.push(
      mergeTokens(
        [
          rhythm.numerator,
          rhythm.separator,
          rhythm.denominator,
          rhythm.broken,
        ].filter((token): token is Token => !!token)
      )
    );
  }
  visitPitchExpr(pitch: Pitch) {
    if (pitch.alteration) {
      this.tokens.push(pitch.alteration);
    }
    this.tokens.push(pitch.noteLetter);
    if (pitch.octave) {
      this.tokens.push(pitch.octave);
    }
  }
  visitSlurGroupExpr(content: Slur_group) {
    /**
     * TODO double check this
     */
    this.visitMusicCodeExpr(content as Music_code);
  }
  visitInfoLineExpr(element: Info_line) {
    const { key, value } = element;
    this.tokens.push(key);
    this.tokens.push(mergeTokens(value));
  }
  visitCommentExpr(element: Comment) {
    this.tokens.push(element.token);
  }
  visitChordExpr(e: Chord) {}
  visitDecorationExpr(e: Decoration) {}
  visitGraceGroupExpr(e: Grace_group) {}
  visitInlineFieldExpr(e: Inline_field) {}
  visitLyricSectionExpr(e: Lyric_section) {}
  visitMultiMeasureRestExpr(e: MultiMeasureRest) {}
  visitNthRepeatExpr(e: Nth_repeat) {}
  visitRestExpr(e: Rest) {}
  visitSymbolExpr(e: Symbol) {}
  visitTuneExpr(e: Tune) {}
  visitYSpacerExpr(e: YSPACER) {}
}

/**
 * TODO double check this
 */
const mergeTokens = (tokens: Array<Token>) => {
  //iterate through tokens and merge them
  //return merged token
  return tokens.reduce((prev, cur, index) => {
    if (index === 0) {
      return prev;
    }
    prev.lexeme = prev.lexeme + cur.lexeme;
    return prev;
  });
};

const isMusicCode = (element: Expr | music_code): element is music_code => {
  return (
    element instanceof Token ||
    element instanceof YSPACER ||
    element instanceof BarLine ||
    element instanceof Annotation ||
    element instanceof Decoration ||
    element instanceof Note ||
    element instanceof Grace_group ||
    element instanceof Nth_repeat ||
    element instanceof Inline_field ||
    element instanceof Chord ||
    element instanceof Symbol ||
    element instanceof MultiMeasureRest ||
    element instanceof Slur_group
  );
};
