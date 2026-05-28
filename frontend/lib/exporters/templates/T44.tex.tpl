% РабочийЛист.ai · T44 «Конспект Корнелла»
% Уникальная вёрстка: каждая задача в двух колонках через minipage —
% слева 30мм для ключевых слов, справа широкая для условия и ответа.
\documentclass[a4paper,11pt]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=14mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
\definecolor{wcsoft}{HTML}{FDF6E3}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (35mm,8mm);%
}

% Двухколоночная задача: слева «Ключевые слова», справа условие+ответ.
\newcommand{\CornellRule}{\rule{32mm}{0.2pt}\\[1mm]}

\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  colframe=wcprimary, colback=white,
  boxrule=0.6pt,
  arc=1mm,
  left=0mm, right=0mm, top=0mm, bottom=0mm,
  title={\sffamily\bfseries Задача №#1}, coltitle=white,
  colbacktitle=wcprimary, fonttitle=\small\bfseries\sffamily,
  attach boxed title to top left={yshift=-1mm, xshift=2mm},
  boxed title style={size=fbox, arc=0pt, frame hidden, sharp corners}
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
{\fontsize{18pt}{22pt}\selectfont\bfseries\sffamily {{title}}}\\[0.5mm]
{\footnotesize\itshape\color{gray!80} {{subtitle}} · конспект Корнелла}
\end{center}
\vspace{2mm}

{{teacher_line}}

{{tasks_tex}}

\vfill
\begin{center}\tiny\color{gray}\sffamily \textbf{РабочийЛист.ai} · Cornell Notes\end{center}
\end{document}
