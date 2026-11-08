# Mathematics in Collaboration

A book that starts from ordinary arithmetic and leads to complete proofs (Hall's
matching theorem, the contraction theorem), small exact experiments, an introduction
to the Lean proof assistant, and a careful first reading of current research.

## Layout

```
main.tex                  driver: loads the preamble and \input's every part in order
preamble.tex              packages, colours, theorem environments, macros
frontmatter/              title page, "To the reader", and "A map of the ideas"
chapters/NN-topic/        one folder per chapter
    chapter.tex           \chapter heading, chapter overview, and the list of sections
    NN-section-title.tex  one file per section (exercises are the last sections)
appendices/A-solutions/   complete solutions to every exercise, grouped by chapter
appendices/B-computation-and-lean/  running the examples on a computer
appendices/C-notation-and-judgment/ notation guide, language map, AI protocol, and reading records
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

The Python programs in Appendix B use only the standard library. The Lean examples in
Chapters 15-16 and their solutions compile with Lean 4.19.0 without Mathlib.
