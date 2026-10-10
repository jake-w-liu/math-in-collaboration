#!/bin/bash
# Post-edit verification: build, Lean snippets, Python programs, meta-language scan.
set -u
ROOT=/home/user/math-in-collaboration
SP=/tmp/claude-0/-home-user-math-in-collaboration/1102e894-fd85-5617-ac7b-04a353dadbc7/scratchpad
LEAN=$SP/leaninst/lean-4.19.0-linux/bin/lean
cd "$ROOT"

echo "== LaTeX build"
latexmk -C main.tex >/dev/null 2>&1
latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex > $SP/verify-build.log 2>&1
echo "latexmk exit: $?"
grep -n '^!' main.log | head -20
grep -n 'Warning' main.log | grep -v 'Font Warning' | head -20
grep -c 'Overfull' main.log
pdfinfo main.pdf 2>/dev/null | grep Pages

echo "== Lean snippets"
mkdir -p $SP/leancheck
python3 - "$ROOT" > $SP/leancheck/proofs.lean <<'EOF'
import re, glob, sys, os
os.chdir(sys.argv[1])
files = (sorted(glob.glob('chapters/15-*/0*.tex')) + sorted(glob.glob('chapters/16-*/0*.tex'))
         + sorted(glob.glob('appendices/C-*/03-*.tex')) + sorted(glob.glob('appendices/C-*/04-*.tex')))
print('import Std\n\nnamespace MathCourse\n')
names = []
for f in files:
    for b in re.findall(r'\\begin\{lstlisting\}\n(.*?)\\end\{lstlisting\}', open(f).read(), re.S):
        if b.lstrip().startswith(('def ', 'theorem ')):
            print('-- from ' + f)
            print(b)
            names += re.findall(r'^theorem (\w+)', b, re.M)
print('end MathCourse\n')
for n in names:
    print('#print axioms MathCourse.' + n)
EOF
grep -c '^theorem\|^def' $SP/leancheck/proofs.lean
(cd $SP/leancheck && $LEAN proofs.lean; echo "lean exit: $?")

echo "== Python programs in Appendix D"
mkdir -p $SP/pycheck
python3 - "$ROOT" "$SP/pycheck" <<'EOF'
import re, glob, sys, os, subprocess
root, out = sys.argv[1], sys.argv[2]
for f in sorted(glob.glob(os.path.join(root, 'appendices/D-*/*.tex'))):
    for i, b in enumerate(re.findall(r'\\begin\{lstlisting\}\n(.*?)\\end\{lstlisting\}', open(f).read(), re.S)):
        if ('import' in b or 'def ' in b or 'print(' in b) and 'namespace' not in b and not b.lstrip().startswith(('#print', 'lean ')):
            p = os.path.join(out, '%s-%d.py' % (os.path.basename(f)[:-4], i))
            open(p, 'w').write(b)
            r = subprocess.run(['python3', '-I', p], capture_output=True, text=True, timeout=120)
            print('---', os.path.basename(p), 'exit', r.returncode)
            print((r.stdout + r.stderr)[-1500:])
EOF

echo "== Meta / editorial language scan"
grep -rn -i -E 'audit|revis|correct(ed|ion)|this edition|reader edition|has been (checked|verified)|were (checked|verified)|was verified|for clarity|previous version|companion|laborator|we now (add|expand)|has been expanded|added (here|for)|note to|TODO|FIXME|XXX' --include=*.tex frontmatter chapters appendices backmatter | grep -v -i 'correct\b' | head -40
