export const meta = {
  name: 'book-section-audit',
  description: 'Section-by-section audit and rewrite of every file of the textbook: edit, dual review, fix, final student read, then a global consistency pass',
  phases: [
    { title: 'Edit', detail: 'one editor per chapter reads every section in order and fixes it' },
    { title: 'Review', detail: 'math reviewer + student-reader reviewer per chapter' },
    { title: 'Fix', detail: 'apply verified review findings' },
    { title: 'Final read', detail: 'fresh end-to-end student read, residual fixes' },
    { title: 'Global', detail: 'cross-chapter consistency and voice sweep' },
  ],
}

const ROOT = '/home/user/math-in-collaboration'
const LEAN = '/tmp/claude-0/-home-user-math-in-collaboration/1102e894-fd85-5617-ac7b-04a353dadbc7/scratchpad/leaninst/lean-4.19.0-linux/bin/lean'
const SCRATCH = '/tmp/claude-0/-home-user-math-in-collaboration/1102e894-fd85-5617-ac7b-04a353dadbc7/scratchpad/wf'

const CONTEXT = `
THE BOOK. "Mathematics in Collaboration" is a one-semester LaTeX textbook in ${ROOT}. It starts from ordinary arithmetic and leads first-year students (no calculus, no proof experience) through logic, sets and maps, proof strategies, induction, equivalence and symmetry, graphs, matchings and Hall's theorem, linear algebra basics, metric spaces and completeness, the contraction theorem, finite probability, sign sequences and circulant Hadamard matrices, two chapters on the Lean proof assistant, reading an unfamiliar proof, and a capstone investigation. A recurring theme is working with an AI assistant responsibly; that theme is legitimate content and stays. Reading order is given by ${ROOT}/main.tex, which \\input's each chapter's chapter.tex, which \\input's its section files. Solutions to the exercises of Chapter N are in the appendix file for "Week N". You may READ any file in the repository for context (e.g. earlier chapters, to check what has already been defined).

LaTeX facts: macros available include \\pauseq{question}{check} (a "Pause and decide" box), \\goal{...} (the chapter's "This week" box), the principle environment \\begin{principle}{Habit k: ...}...\\end{principle}, \\code{...} for inline code, \\NN \\ZZ \\QQ \\RR, \\eps, \\abs, \\norm, \\set, \\E, \\Prob, \\id, \\im, theorem environments theorem/lemma/proposition/definition/example/exercise, \\sol{N.M}{...} for solutions, lstlisting for code, tikz, booktabs tables. Do not add packages or new macros (the preamble is off limits).
`

const STYLE = `
WRITING STANDARD (apply to every sentence you touch):
1. Audience: a first-year student with no proof experience, reading alone. Every term is defined before it is used (check earlier chapters if unsure). Every step a beginner could not fill in on their own is written out. Dense abstract passages get a small concrete example. Explanations are in plain, friendly, precise language; prefer short sentences and concrete words.
2. It must read as a normal, carefully written human textbook. Absolutely NO internal, editorial, audit, or production language in the book text: nothing about edits, revisions, corrections, audits, reviews, verification of the book itself, editions, versions of the text, what "was added" or "was fixed", what the "previous version" said, "for clarity we now", "note to the reader that this section has been expanded", instructions to an author/editor, self-assessments of the text ("this explanation is complete", "nothing was skipped"), or statements about how the book was produced or checked ("has been checked", "was verified for this book", "the program was run for this edition"). Neutral technical facts a reader needs (e.g. "the Lean examples are written for Lean 4.19") are fine; claims about the book's own checking process are not.
3. No defensive asides addressed to an imagined critic ("this is not an unexplained guess", "the name is not an extra method to learn", "these are planning assumptions, not measured times", "this book does not claim..."). Keep a "not X but Y" contrast only when X is a genuine misconception students actually have, and then state it plainly once.
4. No robotic or stilted phrasing, no needless repetition, no lists of abstract nouns where a sentence with a subject and verb would be clearer. Vary sentence rhythm naturally. Do not start many consecutive sentences the same way.
5. Mathematics must be exactly correct. Recompute every numerical claim (use python3 freely; exact fractions where relevant). Check every proof step, every quantifier, every boundary case (zero, empty set, n=0 or 1, q=0, strict vs non-strict inequalities). Exercises must be solvable from what the text has taught; solutions must answer exactly what the exercise asks, completely.
6. Preserve the book's content and structure: do not delete theorems, examples, exercises or habits; do not add, remove or reorder exercises (references and solutions depend on numbering); do not rename files; keep every existing \\label exactly; any new \\label must start with a prefix unique to your files (e.g. the chapter id). Use \\ref for numbered cross-references. If you reword an exercise, make the matching solution consistent. You may retitle a section if the title is unclear.
7. LaTeX must stay valid: balanced braces and environments, math in math mode, escaped special characters (_ & % # in text). Do NOT run pdflatex or latexmk (other agents are editing other files in the same directory at the same time).
8. Lean code (Chapters 15-16, their solutions, Appendix D) must compile with core Lean 4.19 + Std, no Mathlib. If you change any Lean code or text that describes Lean's behaviour, test it: put all the book's Lean declarations needed (definitions first) into a file in your own directory ${SCRATCH}/<your-id>/ wrapped in "import Std / namespace MathCourse ... end MathCourse" and run ${LEAN} on it. Python code in the book must run with python3; test any program you change (in your own scratch directory).
9. Edit ONLY the files listed as yours. If you notice a problem in someone else's file (another chapter, the preamble), do not edit it; report it in your return value.
`

const EDIT_SCHEMA = {
  type: 'object',
  properties: {
    sectionsRead: { type: 'array', items: { type: 'string' }, description: 'every file you read completely, in order' },
    changes: { type: 'array', items: { type: 'object', properties: { file: { type: 'string' }, summary: { type: 'string' } }, required: ['file', 'summary'] } },
    crossPartitionIssues: { type: 'array', items: { type: 'string' } },
    remainingConcerns: { type: 'array', items: { type: 'string' } },
  },
  required: ['sectionsRead', 'changes', 'crossPartitionIssues', 'remainingConcerns'],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    filesRead: { type: 'array', items: { type: 'string' } },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          file: { type: 'string' },
          quote: { type: 'string', description: 'exact text from the file, long enough to locate it uniquely' },
          kind: { type: 'string', enum: ['math', 'gap', 'clarity', 'meta-language', 'voice', 'exercise-solution', 'latex', 'code', 'cross-reference', 'other'] },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          problem: { type: 'string' },
          fix: { type: 'string', description: 'concrete replacement text or precise instruction' },
        },
        required: ['file', 'quote', 'kind', 'severity', 'problem', 'fix'],
      },
    },
    crossPartitionIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['filesRead', 'findings', 'crossPartitionIssues'],
}

const FIX_SCHEMA = {
  type: 'object',
  properties: {
    applied: { type: 'array', items: { type: 'string' } },
    rejected: { type: 'array', items: { type: 'object', properties: { quote: { type: 'string' }, reason: { type: 'string' } }, required: ['quote', 'reason'] } },
  },
  required: ['applied', 'rejected'],
}

const FINAL_SCHEMA = {
  type: 'object',
  properties: {
    filesRead: { type: 'array', items: { type: 'string' } },
    fixedDirectly: { type: 'array', items: { type: 'string' } },
    serious: FINDINGS_SCHEMA.properties.findings,
    crossPartitionIssues: { type: 'array', items: { type: 'string' } },
  },
  required: ['filesRead', 'fixedDirectly', 'serious', 'crossPartitionIssues'],
}

const fileList = (w) => w.files.map((f, i) => `  ${i + 1}. ${ROOT}/${f}`).join('\n')

function editPrompt(w) {
  return `${CONTEXT}
YOUR PART: ${w.name} (id: ${w.id}). Your files, in reading order:
${fileList(w)}

TASK: Read your files one by one, in the order listed, completely, sentence by sentence. Skip nothing: every paragraph, display, proof, example, pause box, habit box, table, figure label, exercise and solution. As you go, fix every problem you find directly in the files:
- mathematical errors, imprecise statements, missing hypotheses, wrong or unverified numbers (recompute with python3), logical gaps in proofs;
- passages a beginner could not follow: expand them with the missing steps and, where helpful, a short worked example; define any term not yet defined;
- exercises that are not answerable from the text, and solutions that are wrong, incomplete, or do not answer exactly what was asked;
- any internal, editorial, audit or production language, defensive asides, instruction-like sentences, stilted or robotic phrasing (see the writing standard);
- broken or vague cross-references ("as shown earlier" where a precise reference is needed; references to things that do not exist).
Make the text something a careful human author would be proud of. Do not shorten genuine explanations; do remove filler and repetition.
${STYLE}
Return: every file you read (in order), a list of changes (file + one-line summary), problems you saw in files that are not yours, and any concern you could not resolve.`
}

function mathReviewPrompt(w) {
  return `${CONTEXT}
YOUR PART: ${w.name} (id: ${w.id}). Files, in reading order:
${fileList(w)}

ROLE: independent mathematical reviewer. Do NOT edit any file. Read every file completely, in order. Check with care, trying to find real errors:
- every numerical claim and computation (recompute with python3; exact arithmetic);
- every definition (precise? consistent with later use and with earlier chapters?);
- every proof step: is it valid, are all hypotheses used correctly, are boundary cases (empty set, zero, n=0/1, equality vs strict inequality, finite vs infinite) handled, are quantifiers in the right order?
- every exercise: answerable from the text so far? every solution: correct, complete, answering exactly what is asked?
- Lean/Python code: would it run as written? (you may test in ${SCRATCH}/${w.id}-math/ with ${LEAN} or python3)
- cross-references: do "Chapter k", "Exercise k.m", "Theorem ..." mentions point to the right place?
Report only genuine problems, each with an exact quote (to locate it), what is wrong, and a concrete fix. Severity high = false or misleading mathematics / unsolvable exercise / wrong solution / code that fails; medium = real gap or imprecision; low = minor.
${STYLE}`
}

function readerReviewPrompt(w) {
  return `${CONTEXT}
YOUR PART: ${w.name} (id: ${w.id}). Files, in reading order:
${fileList(w)}

ROLE: you are a first-year student with no proof experience reading this part of the book on your own, and simultaneously an experienced copy-editor of mathematics textbooks. Do NOT edit any file. Read every file completely, in order. Report:
- every place where you, as that student, would get stuck: an undefined or not-yet-explained term, a skipped step, an unexplained notation, a jump in logic, a paragraph too dense to follow, an example missing where one is needed (say exactly what explanation or example would unblock you);
- every sentence that does not read like a careful human textbook: internal/editorial/audit/production language (mentions of revisions, corrections, checks of the book itself, editions, "has been verified", "was added", "for clarity"), defensive asides aimed at an imagined critic, instruction-like sentences aimed at an author, robotic or stilted phrasing, repetitive sentence openings, filler, redundancy;
- awkward transitions and places where the order of ideas is confusing;
- padding and over-explanation: the same point made twice or three times in nearby paragraphs, a worked example that repeats an earlier one without adding anything, long preambles before getting to the point, summaries that restate what was just said. The book recently roughly doubled in length during editing, so tightening matters as much as filling gaps: a student must be able to find the main line of the argument quickly. Propose concrete cuts or merges (quote the text to delete or the replacement), never cutting a step a beginner actually needs.
Give each finding an exact quote and a concrete rewrite (the actual replacement text when feasible).
${STYLE}`
}

function fixPrompt(w, findings, round) {
  return `${CONTEXT}
YOUR PART: ${w.name} (id: ${w.id}). Your files:
${fileList(w)}

Reviewers produced the findings below (round ${round}). For each one: locate the quoted text (it may have shifted slightly), decide whether the problem is real (verify mathematics yourself with python3 where relevant), and if so fix it in the file, adapting the suggested fix so the result reads naturally and stays correct. Reject findings that are wrong, and say why. When applying a fix, re-read the surrounding paragraph so the result flows; do not introduce any editorial or audit language.

FINDINGS (JSON):
${JSON.stringify(findings, null, 1)}
${STYLE}
Return the list of applied fixes (short descriptions) and rejected findings with reasons.`
}

function finalPrompt(w) {
  return `${CONTEXT}
YOUR PART: ${w.name} (id: ${w.id}). Your files, in reading order:
${fileList(w)}

ROLE: final reader before publication. Read every file completely, in order, start to finish, as a careful first-year student would, and also as a mathematician checking correctness. Fix small problems directly in the files (typos, a confusing sentence, a missing small step, a leftover stilted or editorial phrase, a LaTeX slip). Pay special attention to: (a) any internal, editorial, audit or production language anywhere in the text (remove it), (b) correctness of every displayed computation, (c) whether each section flows naturally from the previous one, (d) whether recently expanded passages are consistent with the rest of the chapter and not repetitive: remove sentences or paragraphs that only restate what was already said nearby, and tighten long-winded passages, while keeping every step a beginner needs.
For problems too large or uncertain to fix with a small edit, report them as "serious" with exact quote and a concrete proposed fix.
${STYLE}`
}

const work = args
log(`Auditing ${work.length} parts, ${work.reduce((s, w) => s + w.files.length, 0)} files`)

const results = await pipeline(
  work,
  (w) => agent(editPrompt(w), { label: `edit:${w.id}`, phase: 'Edit', schema: EDIT_SCHEMA }),
  async (edit, w) => {
    const reviews = await parallel([
      () => agent(mathReviewPrompt(w), { label: `math:${w.id}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
      () => agent(readerReviewPrompt(w), { label: `reader:${w.id}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
    ])
    const findings = reviews.filter(Boolean).flatMap((r) => r.findings)
    const cross = reviews.filter(Boolean).flatMap((r) => r.crossPartitionIssues)
    return { edit, findings, cross }
  },
  async (rev, w) => {
    let fix = null
    if (rev.findings.length) {
      fix = await agent(fixPrompt(w, rev.findings, 1), { label: `fix:${w.id}`, phase: 'Fix', schema: FIX_SCHEMA })
    }
    return { ...rev, fix }
  },
  async (st, w) => {
    const rounds = []
    let final = await agent(finalPrompt(w), { label: `final:${w.id}`, phase: 'Final read', schema: FINAL_SCHEMA })
    rounds.push(final)
    let r = 2
    while (final && final.serious && final.serious.length && r <= 3) {
      await agent(fixPrompt(w, final.serious, r), { label: `fix${r}:${w.id}`, phase: 'Fix', schema: FIX_SCHEMA })
      final = await agent(finalPrompt(w), { label: `final${r}:${w.id}`, phase: 'Final read', schema: FINAL_SCHEMA })
      rounds.push(final)
      r++
    }
    return {
      id: w.id,
      editChanges: st.edit ? st.edit.changes.length : null,
      sectionsRead: st.edit ? st.edit.sectionsRead.length : null,
      expectedFiles: w.files.length,
      reviewFindings: st.findings.length,
      applied: st.fix ? st.fix.applied.length : 0,
      rejected: st.fix ? st.fix.rejected : [],
      finalRounds: rounds.length,
      unresolvedSerious: final ? final.serious : 'final reader failed',
      cross: [
        ...(st.edit ? st.edit.crossPartitionIssues : []),
        ...st.cross,
        ...rounds.filter(Boolean).flatMap((x) => x.crossPartitionIssues),
      ],
      concerns: st.edit ? st.edit.remainingConcerns : [],
    }
  },
)

const done = results.filter(Boolean)
log(`Per-part passes finished: ${done.length}/${work.length}`)
const missing = work.filter((w) => !done.find((d) => d.id === w.id)).map((w) => w.id)
if (missing.length) log(`Parts that failed and need attention: ${missing.join(', ')}`)

phase('Global')
const crossAll = done.flatMap((d) => d.cross.map((c) => `[${d.id}] ${c}`))
const globalResult = await agent(`${CONTEXT}
ROLE: final whole-book consistency editor. All per-chapter editing has finished; you are now the only agent editing, and you may edit ANY content file under frontmatter/, chapters/, appendices/, backmatter/ (not preamble.tex). Do not run pdflatex.
1. Resolve these issues that per-chapter editors reported about files outside their own part (verify each first; fix real ones):
${crossAll.length ? crossAll.join('\n') : '(none reported)'}
2. Search the WHOLE book (grep is your friend) for any remaining internal, editorial, audit or production language and remove it: words and phrases like audit, revised, revision, corrected, fixed, edition, "has been checked", "was verified", "we now", "for clarity", "added", "previous version", "companion", "laboratory", "this book does not claim", defensive asides, instructions to an author. Read each hit in context; rewrite only where it is genuinely meta/editorial, leaving legitimate mathematical uses (e.g. "checked by induction") alone.
3. Check cross-chapter consistency: every prose reference like "Chapter k", "Section", "Exercise k.m", "Theorem", "as we saw" points to content that exists and says what is claimed; notation is used consistently (e.g. N includes 0; |S|; [a]_m; N_1^+, N_2^+; d(x,y)); a concept introduced late is not used early without explanation; the front matter's description of chapters matches the chapters.
${STYLE}
Return a concise list of what you changed and anything you could not resolve.`, { label: 'global-consistency', phase: 'Global' })

return { parts: done, missing, global: globalResult }
