import {
  Annotation,
  BarLine,
  Chord,
  Comment,
  Decoration,
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
} from "../Parser/Expr";
import Token from "../Parser/token";

export class TokensVisitor implements Visitor<void> {
  public tokens: Array<Token> = [];

  analyze(file_structure: File_structure) {
    this.visitFileStructureExpr(file_structure);
  }
  visitFileStructureExpr(file_structure: File_structure): void {
    /**
     * TODO implement visitor for file structure
     */
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
      }
    });
  }
  visitMusicCodeExpr(element: Music_code) {
    element.contents.forEach((content) => {
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
          // TODO account for rhythm
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
