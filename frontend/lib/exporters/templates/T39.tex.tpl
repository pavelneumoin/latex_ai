% РабочийЛист.ai · T39 «Карточки 2×2 для разрезания»
% Уникальная вёрстка: 4 карточки на лист (2×2), пунктир посередине под разрезание.
\documentclass[a4paper,11pt,landscape]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=12mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
\definecolor{wcsoft}{HTML}{FFF8F0}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (35mm,8mm);%
}

% Карточка — толстая рамка, заголовок-нашлёпка, поле для ответа внизу.
\newtcolorbox{taskbox}[1]{%
  enhanced, breakable=false,
  width=0.46\linewidth, height=82mm, valign=top,
  colframe=wcprimary, colback=wcsoft, boxrule=1.2pt,
  arc=4mm, left=4mm, right=4mm, top=8mm, bottom=4mm,
  title={\sffamily\bfseries\large \#\,#1}, coltitle=white,
  colbacktitle=wcprimary, fonttitle=\large\bfseries\sffamily,
  attach boxed title to top right={yshift=-1.5mm, xshift=-3mm},
  boxed title style={size=fbox, arc=2mm, frame hidden, sharp corners=northwest, top=1mm, bottom=1mm, left=4mm, right=4mm},
  before upper={\sffamily}
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
{\fontsize{18pt}{22pt}\selectfont\bfseries\sffamily {{title}}}\\[0.5mm]
{\footnotesize\itshape\color{gray!80} {{subtitle}} · Разрежь по пунктиру}
\end{center}
\vspace{1mm}

{{teacher_line}}

\noindent
\begin{minipage}[t]{\linewidth}
\centering
{{tasks_tex}}
\end{minipage}

% Пунктирные линии под разрезание
\begin{tikzpicture}[remember picture, overlay]
  \draw[gray!50, dashed, line width=0.4pt]
    ([xshift=-2mm,yshift=0]current page.west|-current page.center) --
    ([xshift=2mm,yshift=0]current page.east|-current page.center);
  \draw[gray!50, dashed, line width=0.4pt]
    ([xshift=0,yshift=-2mm]current page.north|-current page.center -| current page.center) --
    ([xshift=0,yshift=2mm]current page.south|-current page.center -| current page.center);
\end{tikzpicture}

\vfill
\begin{center}\tiny\color{gray}\sffamily \textbf{РабочийЛист.ai} · Дидактические карточки\end{center}
\end{document}
