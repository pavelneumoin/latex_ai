% РабочийЛист.ai · T36 «Экзаменационный бланк»
% Уникальная вёрстка: блок ФИО/класс/дата/вариант сверху, нумерованные задачи в строгой синей рамке.
\documentclass[a4paper,11pt]{article}
\usepackage[T2A]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage[russian]{babel}
\usepackage[margin=18mm,top=14mm,bottom=14mm]{geometry}
\usepackage{xcolor}
\usepackage{tikz}
\usepackage{tcolorbox}
\tcbuselibrary{skins,breakable}
\usepackage{amsmath,amssymb}

\definecolor{wcprimary}{HTML}{{{accent_hex}}}
\definecolor{wcprimaryDark}{HTML}{1F2937}
{{extra_preamble}}
{{watermark_preamble}}

\newcommand{\AnswerField}[1]{%
  \tikz[baseline=-0.5ex]\draw[thick,wcprimary] (0,0) rectangle (30mm,10mm);%
}

\newtcolorbox{taskbox}[1]{%
  enhanced,
  colframe=wcprimary, colback=white, boxrule=0.6pt,
  arc=0pt, sharp corners,
  left=4mm, right=4mm, top=3mm, bottom=3mm,
  title={\textbf{ЗАДАНИЕ \,№\,#1}}, coltitle=white,
  colbacktitle=wcprimaryDark, fonttitle=\small\bfseries\sffamily,
  attach boxed title to top left={yshift=-2pt, xshift=-0.6pt},
  boxed title style={arc=0pt, sharp corners, frame hidden, size=fbox, boxrule=0pt}
}

\pagestyle{empty}
\begin{document}
{{font_cmd}}

% ── Шапка экзаменационного бланка ──────────────────────────────────────
\begin{center}
{\fontsize{16pt}{20pt}\selectfont\bfseries\sffamily {{title}}}\\[1mm]
{\small\itshape {{subtitle}}}
\end{center}
\vspace{2mm}

\noindent\fbox{\parbox{\dimexpr\linewidth-2\fboxsep\relax}{%
  \footnotesize\sffamily%
  \textbf{Фамилия, имя:} \rule{55mm}{0.4pt} \hfill
  \textbf{Класс:} \rule{14mm}{0.4pt} \hfill
  \textbf{Дата:} \rule{22mm}{0.4pt} \\[1.5mm]
  \textbf{Вариант:} \rule{12mm}{0.4pt} \hfill
  \textbf{Учитель:} \rule{45mm}{0.4pt} \hfill
  \textbf{Балл:} \rule{12mm}{0.4pt}
}}
\vspace{3mm}

{{teacher_line}}

{{tasks_tex}}

\vfill
\begin{center}\tiny\color{gray}Составлено в \textbf{РабочийЛист.ai}\end{center}
\end{document}
