# Mathematics in Collaboration

A one-semester course text that starts from ordinary arithmetic and leads to complete
proofs (Hall's matching theorem, the contraction theorem), small exact experiments, an
introduction to the Lean proof assistant, and a careful first reading of current research.

## Layout

```
main.tex                  driver: loads the preamble and \input's every part in order
preamble.tex              packages, colours, theorem environments, macros
frontmatter/              title page, "To the reader", semester plan
chapters/NN-topic/        one folder per chapter
    chapter.tex           \chapter heading, weekly goal, and the list of sections
    NN-section-title.tex  one file per section (exercises are the last sections)
appendices/X-topic/       solutions (A-C), running the examples (D), notation guide (E)
backmatter/references.tex bibliography
```

To edit a section, open its file under `chapters/`. To add, remove or reorder sections,
edit the `\input` lines in that chapter's `chapter.tex`.

## Building

Any TeX Live installation with the packages loaded in `preamble.tex` works:

```
latexmk -pdf main.tex
```

or run `pdflatex main.tex` two or three times until cross-references settle.

The Python programs in Appendix D use only the standard library. The Lean examples in
Chapters 15-16 and their solutions compile with Lean 4.19.0 without Mathlib.
