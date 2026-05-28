% РабочийЛист.ai · T38 «Устный счёт»
% Уникальная вёрстка: 2 узкие колонки задач (compact), всё в одну строку «условие = ___».
\documentclass[a4paper,10pt]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=14mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb}
\usepackage{multicol}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
\definecolor{wcsoft}{HTML}{F4F1FB}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (18mm,6mm);%
}

\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  colframe=wcprimary, colback=wcsoft, boxrule=0pt,
  arc=2mm, left=3mm, right=3mm, top=1mm, bottom=1mm,
  title={\scriptsize\textbf{#1}}, coltitle=white,
  colbacktitle=wcprimary, fonttitle=\scriptsize\bfseries,
  attach boxed title to top left={yshift=-1.5mm, xshift=-1mm},
  boxed title style={size=tight, arc=1mm, frame hidden},
  before upper={\sffamily\small},
  fontupper=\sffamily\small
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
{\fontsize{22pt}{26pt}\selectfont\bfseries\sffamily\color{wcprimary} {{title}}}\\[0.5mm]
{\footnotesize\itshape\sffamily {{subtitle}}}
\end{center}
\vspace{2mm}

{{teacher_line}}

\begin{multicols}{2}
{{tasks_tex}}
\end{multicols}

\vfill
\begin{center}\tiny\color{gray}\sffamily \textbf{РабочийЛист.ai} · Устный счёт\end{center}
\end{document}
