% РабочийЛист.ai · T40 «Олимпиадный лист»
% Уникальная вёрстка: академический серьёзный стиль, римская нумерация, без рамок,
% больше воздуха, латинский ремарк-стиль.
\documentclass[a4paper,12pt]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=22mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb,amsthm}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (38mm,9mm);%
}

% Римская нумерация: \taskbox{N} печатает «Задача N.» в классическом виде, без рамки.
\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  blanker, % без рамок и фона
  before skip=4mm, after skip=4mm,
  left=0pt, right=0pt, top=0pt, bottom=0pt,
  before upper={\par\noindent{\large\bfseries\itshape Задача\,\Romannum{#1}.~}}
}

% Перевод арабских в римские для tcolorbox title
\newcommand{\Romannum}[1]{\uppercase\expandafter{\romannumeral #1}}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
\textsc{\large {{title}}}\\[1mm]
\rule{60mm}{0.4pt}\\[1mm]
{\footnotesize\itshape {{subtitle}}}
\end{center}
\vspace{4mm}

{{teacher_line}}

{{tasks_tex}}

\vfill
\begin{center}\tiny\color{gray}\itshape Подготовлено в \textbf{РабочийЛист.ai}\end{center}
\end{document}
