% РабочийЛист.ai · T37 «Рабочая тетрадь»
% Уникальная вёрстка: каждая задача занимает 1/3 страницы, большое поле клетки для решения,
% ответ внизу в маленьком блоке.
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
\definecolor{wcgrid}{HTML}{D6DBE4}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (40mm,8mm);%
}

% Клетчатое поле для решения (вёрстка как тетрадь в клетку).
\newcommand{\GridArea}[1]{%
  \begin{tikzpicture}
    \draw[wcgrid, very thin] (0,0) grid[step=5mm] (\linewidth-0.4mm,#1);
    \draw[wcgrid, line width=0.4pt] (0,0) rectangle (\linewidth-0.4mm,#1);
  \end{tikzpicture}\par
}

\newtcolorbox{taskbox}[1]{%
  enhanced, breakable,
  colframe=wcprimary, colback=white, boxrule=0pt,
  borderline west={1.6mm}{0pt}{wcprimary},
  arc=0pt, sharp corners,
  left=5mm, right=2mm, top=2mm, bottom=2mm,
  title={\sffamily\bfseries\large \textcolor{wcprimary}{Задача \,#1}}, coltitle=wcprimary,
  fonttitle=\large\bfseries\sffamily,
  attach boxed title to top left={yshift=0pt, xshift=5mm},
  colbacktitle=white, boxed title style={frame hidden, size=fbox, boxrule=0pt},
  before upper={\vspace{1mm}},
  after upper={\par\vspace{2mm}\textcolor{gray!70}{\footnotesize Место для решения:}\par\vspace{1mm}\GridArea{32mm}\par\vspace{1mm}\hfill\textbf{Ответ:}~\AnswerField{#1}}
}

% Переопределяем «taskbox» так, чтобы условие + клетка + ответ были в одном блоке.
% В этом шаблоне renderer передаёт только условие — клетку и ответ добавляем сами.
% Поэтому игнорируем стандартный «\AnswerField{n}» от рендера.

\pagestyle{empty}
\begin{document}
{{font_cmd}}

\begin{center}
{\fontsize{18pt}{22pt}\selectfont\bfseries\sffamily {{title}}}\\[1mm]
{\small\itshape\color{gray!80} {{subtitle}}}
\end{center}
\vspace{1mm}

{{teacher_line}}

{{tasks_tex}}

\vfill
\begin{center}\tiny\color{gray}\textbf{РабочийЛист.ai} · Тетрадь в клетку\end{center}
\end{document}
