% РабочийЛист.ai · T45 «Стикер-stickers»
% Уникальная вёрстка: каждая задача — стилизованный «стикер»-наклейка с лёгким наклоном
% и тенью. Молодёжный, для младших классов.
\documentclass[a4paper,11pt]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=18mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
\definecolor{wcsoft1}{HTML}{FFF4E6}
\definecolor{wcsoft2}{HTML}{E6F4FF}
\definecolor{wcsoft3}{HTML}{F4FFE6}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (30mm,10mm);%
}

\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  colframe=wcprimary, colback=wcsoft1,
  boxrule=1.4pt,
  arc=4mm,
  left=4mm, right=4mm, top=3mm, bottom=3mm,
  title={\sffamily\bfseries\large\#\,#1}, coltitle=wcprimary,
  colbacktitle=white, fonttitle=\large\bfseries\sffamily,
  attach boxed title to top left={yshift=-2mm, xshift=4mm},
  boxed title style={size=fbox, arc=2mm, frame hidden, boxrule=1pt, colframe=wcprimary, top=0.5mm, bottom=0.5mm, left=3mm, right=3mm},
  before upper={\sffamily}
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
{\fontsize{24pt}{28pt}\selectfont\bfseries\sffamily\color{wcprimary} {{title}}}\\[0.5mm]
{\footnotesize\itshape\sffamily\color{gray!80} {{subtitle}}}
\end{center}
\vspace{3mm}

{{teacher_line}}

{{tasks_tex}}

\vfill
\begin{center}\tiny\color{gray}\sffamily \textbf{РабочийЛист.ai} · Стикеры\end{center}
\end{document}
