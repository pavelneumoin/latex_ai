% РабочийЛист.ai · T43 «Лестница уровней»
% Уникальная вёрстка: задачи как «уровни» с увеличивающейся сложностью, ступеньки слева.
\documentclass[a4paper,11pt]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=16mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
\definecolor{wcsoft}{HTML}{F0F7FF}
\definecolor{wcgold}{HTML}{F59E0B}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (32mm,9mm);%
}

% Бейдж-уровень и звёздочки сложности.
\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  colframe=wcprimary, colback=wcsoft,
  boxrule=0pt,
  borderline west={3mm}{0mm}{wcprimary},
  arc=2mm, sharp corners=west,
  left=8mm, right=4mm, top=2mm, bottom=2mm,
  title={\sffamily\bfseries\Large УРОВЕНЬ\,#1}, coltitle=white,
  colbacktitle=wcprimary, fonttitle=\large\bfseries\sffamily,
  attach boxed title to top left={yshift=-1mm, xshift=8mm},
  boxed title style={size=fbox, arc=2mm, frame hidden, top=0.5mm, bottom=0.5mm, left=4mm, right=4mm}
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
{\fontsize{20pt}{24pt}\selectfont\bfseries\sffamily\color{wcprimary} {{title}}}\\[0.5mm]
{\footnotesize\itshape\sffamily {{subtitle}} · от простого к сложному}\\
{\color{wcgold}\Large $\star\,\star\,\star$}
\end{center}
\vspace{2mm}

{{teacher_line}}

{{tasks_tex}}

\vfill
\begin{center}\tiny\color{gray}\sffamily \textbf{РабочийЛист.ai} · Игровая лестница\end{center}
\end{document}
