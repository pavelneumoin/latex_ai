% РабочийЛист.ai · T41 «Blueprint / чертёж»
% Уникальная вёрстка: тёмный фон с сеточкой, белый текст, технический стиль (инженерный чертёж).
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
\usepackage{eso-pic}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
\definecolor{wcbg}{HTML}{0F2A4A}
\definecolor{wcgrid}{HTML}{1F4A7A}
\definecolor{wclight}{HTML}{E1ECFB}

{{extra_preamble}}

% Глобальный фон в стиле blueprint.
\AddToShipoutPictureBG{%
  \AtPageLowerLeft{%
    \begin{tikzpicture}[overlay]
      \fill[wcbg] (0,0) rectangle (\paperwidth,\paperheight);
      \draw[wcgrid, line width=0.25pt]
        (0,0) grid[step=5mm] (\paperwidth,\paperheight);
      \draw[wcgrid, line width=0.5pt]
        (0,0) grid[step=25mm] (\paperwidth,\paperheight);
    \end{tikzpicture}%
  }%
}

{{watermark_preamble}}

\color{wclight}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wclight] (0,0) rectangle (32mm,9mm);%
}

\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  colframe=wclight, colback=wcbg, boxrule=0.7pt,
  arc=0pt, sharp corners,
  left=4mm, right=4mm, top=3mm, bottom=3mm,
  title={\sffamily\bfseries\#\,#1}, coltitle=wcbg,
  colbacktitle=wclight, fonttitle=\small\bfseries\sffamily,
  attach boxed title to top left={yshift=-1pt, xshift=2mm},
  boxed title style={size=fbox, arc=0pt, frame hidden, sharp corners},
  before upper={\color{wclight}\sffamily}
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
{\color{wclight}\sffamily\fontsize{18pt}{22pt}\selectfont\bfseries {{title}}}\\[1mm]
{\color{wclight!80}\sffamily\footnotesize {{subtitle}}}
\end{center}
\vspace{2mm}

{{teacher_line}}

{{tasks_tex}}

\vfill
\begin{center}\tiny\color{wclight!60}\sffamily \textbf{РабочийЛист.ai} · Blueprint\end{center}
\end{document}
