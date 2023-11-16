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
} from "../Expr";
import Token from "../token";

export class AbcFormatter implements Visitor<string> {
  format(file_structure: File_structure) {
    return this.visitFileStructureExpr(file_structure);
  }
  visitAnnotationExpr(expr: Annotation) {
    return expr.text.lexeme;
  }
  visitBarLineExpr(expr: BarLine) {
    return expr.barline.lexeme;
  }
  visitChordExpr(expr: Chord) {
    const str = expr.contents
      .map((content) => {
        if (content instanceof Annotation) {
          return this.visitAnnotationExpr(content);
        } else if (content instanceof Note) {
          return this.visitNoteExpr(content);
        } else {
          return content.lexeme;
        }
      })
      .join("");
    if (expr.rhythm) {
      return `[${str}${this.visitRhythmExpr(expr.rhythm)}]`;
    } else {
      return `[${str}]`;
    }
  }
  visitCommentExpr(expr: Comment) {
    return expr.text;
  }
  visitDecorationExpr(expr: Decoration) {
    return expr.decoration.lexeme;
  }
  visitFileHeaderExpr(expr: File_header) {
    //TODO should I return tokens here as well?
    return expr.text;
  }
  visitFileStructureExpr(expr: File_structure) {
    let formattedFile = "";
    if (expr.file_header) {
      formattedFile += this.visitFileHeaderExpr(expr.file_header);
    }
    const formattedTunes = expr.tune.map((tune) => {
      return this.visitTuneExpr(tune);
    });
    return (
      formattedFile + formattedTunes.join(formattedFile.length > 0 ? "\n" : "")
    );
  }
  visitGraceGroupExpr(expr: Grace_group) {
    // TODO implement accaciatura formatting
    return expr.notes
      .map((note) => {
        return this.visitNoteExpr(note);
      })
      .join("");
  }
  visitInfoLineExpr(expr: Info_line) {
    const { key, value } = expr;
    const formattedVal = value.map((val) => val.lexeme).join("");
    return `${key.lexeme}${formattedVal}\n`;
  }
  visitInlineFieldExpr(expr: Inline_field) {
    // TODO fix Inline_field parsing (numbers causing issue)
    const { field, text } = expr;
    const formattedText = text.map((val) => val.lexeme).join("");
    return `[${field.lexeme}${formattedText}]`;
  }
  visitLyricSectionExpr(expr: Lyric_section) {
    return expr.info_lines
      .map((info_line) => {
        return this.visitInfoLineExpr(info_line);
      })
      .join("\n");
  }
  visitMultiMeasureRestExpr(expr: MultiMeasureRest) {
    return `${expr.rest.lexeme}${expr.length ? expr.length.lexeme : ""}`; // TODO do I need the bar lines?
  }
  visitMusicCodeExpr(expr: Music_code) {
    return expr.contents
      .map((content) => {
        if (content instanceof Token) {
          return content.lexeme;
        } else if (content instanceof YSPACER) {
          return this.visitYSpacerExpr(content);
        } else if (content instanceof BarLine) {
          return this.visitBarLineExpr(content);
        } else if (content instanceof Annotation) {
          return this.visitAnnotationExpr(content);
        } else if (content instanceof Decoration) {
          return this.visitDecorationExpr(content);
        } else if (content instanceof Note) {
          return this.visitNoteExpr(content);
        } else if (content instanceof Grace_group) {
          return this.visitGraceGroupExpr(content);
        } else if (content instanceof Nth_repeat) {
          return this.visitNthRepeatExpr(content);
        } else if (content instanceof Inline_field) {
          return this.visitInlineFieldExpr(content);
        } else if (content instanceof Chord) {
          return this.visitChordExpr(content);
        } else if (content instanceof Symbol) {
          return this.visitSymbolExpr(content);
        } else if (content instanceof MultiMeasureRest) {
          return this.visitMultiMeasureRestExpr(content);
        } else {
          return this.visitSlurGroupExpr(content);
        }
      })
      .join("");
  }
  visitNoteExpr(expr: Note) {
    let formattedNote = "";

    if (expr.pitch instanceof Pitch) {
      formattedNote += this.visitPitchExpr(expr.pitch);
    } else {
      formattedNote += this.visitRestExpr(expr.pitch);
    }
    if (expr.rhythm) {
      formattedNote += this.visitRhythmExpr(expr.rhythm);
    }
    if (expr.tie) {
      formattedNote += "-";
    }
    return formattedNote;
  }
  visitNthRepeatExpr(expr: Nth_repeat) {
    return expr.repeat.lexeme;
  }
  visitPitchExpr(expr: Pitch) {
    let formatted = "";
    if (expr.alteration) {
      formatted += expr.alteration.lexeme;
    }
    formatted += expr.noteLetter.lexeme;
    if (expr.octave) {
      formatted += expr.octave.lexeme;
    }
    return formatted;
  }
  visitRestExpr(expr: Rest) {
    return expr.rest.lexeme;
  }
  visitRhythmExpr(expr: Rhythm) {
    let formatted = "";
    if (expr.numerator) {
      formatted += expr.numerator.lexeme;
    }
    if (expr.separator) {
      formatted += expr.separator.lexeme;
    }
    if (expr.denominator) {
      formatted += expr.denominator.lexeme;
    }
    if (expr.broken) {
      formatted += expr.broken.lexeme;
    }
    return formatted;
  }
  visitSlurGroupExpr(expr: Slur_group) {
    let formatted = "";
    formatted += expr.contents
      .map((content) => {
        if (content instanceof Token) {
          return content.lexeme;
        } else if (content instanceof YSPACER) {
          return this.visitYSpacerExpr(content);
        } else if (content instanceof BarLine) {
          return this.visitBarLineExpr(content);
        } else if (content instanceof Annotation) {
          return this.visitAnnotationExpr(content);
        } else if (content instanceof Decoration) {
          return this.visitDecorationExpr(content);
        } else if (content instanceof Note) {
          return this.visitNoteExpr(content);
        } else if (content instanceof Grace_group) {
          return this.visitGraceGroupExpr(content);
        } else if (content instanceof Nth_repeat) {
          return this.visitNthRepeatExpr(content);
        } else if (content instanceof Inline_field) {
          return this.visitInlineFieldExpr(content);
        } else if (content instanceof Chord) {
          return this.visitChordExpr(content);
        } else if (content instanceof Symbol) {
          return this.visitSymbolExpr(content);
        } else if (content instanceof MultiMeasureRest) {
          return this.visitMultiMeasureRestExpr(content);
        } else {
          return this.visitSlurGroupExpr(content);
        }
      })
      .join("");
    return `(${formatted})`;
  }
  visitSymbolExpr(expr: Symbol) {
    return `!${expr.symbol.lexeme}!`;
  }
  visitTuneBodyExpr(expr: Tune_Body) {
    return expr.sequence
      .map((content) => {
        if (content instanceof Token) {
          return content.lexeme;
        } else if (content instanceof YSPACER) {
          return this.visitYSpacerExpr(content);
        } else if (content instanceof BarLine) {
          return this.visitBarLineExpr(content);
        } else if (content instanceof Annotation) {
          return this.visitAnnotationExpr(content);
        } else if (content instanceof Decoration) {
          return this.visitDecorationExpr(content);
        } else if (content instanceof Note) {
          return this.visitNoteExpr(content);
        } else if (content instanceof Grace_group) {
          return this.visitGraceGroupExpr(content);
        } else if (content instanceof Nth_repeat) {
          return this.visitNthRepeatExpr(content);
        } else if (content instanceof Inline_field) {
          return this.visitInlineFieldExpr(content);
        } else if (content instanceof Chord) {
          return this.visitChordExpr(content);
        } else if (content instanceof Symbol) {
          return this.visitSymbolExpr(content);
        } else if (content instanceof MultiMeasureRest) {
          return this.visitMultiMeasureRestExpr(content);
        } else if (content instanceof Comment) {
          return this.visitCommentExpr(content);
        } else if (content instanceof Info_line) {
          return this.visitInfoLineExpr(content);
        } else {
          return this.visitSlurGroupExpr(content);
        }
      })
      .join("");
  }
  visitTuneExpr(expr: Tune) {
    let formatted = "";
    formatted += this.visitTuneHeaderExpr(expr.tune_header);
    if (expr.tune_body) {
      formatted += this.visitTuneBodyExpr(expr.tune_body);
    }
    return formatted;
  }
  visitTuneHeaderExpr(expr: Tune_header) {
    return expr.info_lines
      .map((infoLine) => this.visitInfoLineExpr(infoLine))
      .join("");
  }
  visitYSpacerExpr(expr: YSPACER) {
    let formatted = expr.ySpacer.lexeme;
    if (expr.number) {
      formatted += expr.number.lexeme;
    }
    return formatted;
  }
}
