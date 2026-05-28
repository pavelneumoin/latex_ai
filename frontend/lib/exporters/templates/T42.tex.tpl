% РабочийЛист.ai · T42 «Газета»
% Уникальная вёрстка: газетный 3-колоночный layout, тонкие линии-разделители, засечный шрифт.
\documentclass[a4paper,9pt]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=12mm,top=18mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb}
\usepackage{multicol}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
{{extra_preamble}}
{{watermark_preamble}}

\setlength{\columnsep}{6mm}
\setlength{\columnseprule}{0.3pt}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (22mm,7mm);%
}

\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  blanker,
  left=0pt, right=0pt, top=1mm, bottom=2mm,
  before skip=1mm, after skip=1mm,
  before upper={\par{\sffamily\bfseries\color{wcprimary}№\,#1.}~}
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

% Шапка газеты
\noindent\rule{\linewidth}{1pt}
\begin{center}
{\fontsize{26pt}{30pt}\selectfont\bfseries\itshape {{title}}}\\[-1mm]
\rule{40mm}{0.3pt}\\[0.5mm]
{\footnotesize\itshape\color{gray} {{subtitle}}}
\end{center}
\noindent\rule{\linewidth}{0.5pt}\\[2mm]

{{teacher_line}}

\begin{multicols}{3}
{{tasks_tex}}
\end{multicols}

\vfill
\noindent\rule{\linewidth}{0.5pt}\\[0.5mm]
\centerline{\tiny\color{gray}\itshape «Математический вестник» · издан в \textbf{РабочийЛист.ai}}
\end{document}
