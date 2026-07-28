"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EGE_MATH_MATERIALS_META,
  EGE_MATH_PROGRESS_KEYS,
  EGE_MATH_SUBTOPIC_COUNT,
  EGE_MATH_TOPICS,
  materialProgressKey,
  type EgeMathPart,
  type EgeMathSubtopic,
  type EgeMathTopic,
} from "@/lib/materials/ege-math";
import {
  IconArrowRight,
  IconCheck,
  IconLibrary,
  IconSearch,
  IconSparkles,
} from "@/app/_components/Icons";
import styles from "./materials.module.css";

const PROGRESS_STORAGE_KEY = "rl-materials-ege-math-progress-v1";

type PartFilter = "all" | EgeMathPart;

interface VisibleTopic {
  topic: EgeMathTopic;
  subtopics: readonly EgeMathSubtopic[];
}

function normalize(value: string): string {
  return value.toLocaleLowerCase("ru").replace(/ё/g, "е").trim();
}

function progressPercent(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function scoreLabel(score: number): string {
  if (score === 1) return "1 первичный балл";
  if (score >= 2 && score <= 4) return `${score} первичных балла`;
  return `${score} первичных баллов`;
}

function materialElementId(topic: EgeMathTopic, subtopic: EgeMathSubtopic): string {
  return `material-${topic.number}-${subtopic.slug}`;
}

export function MaterialsNavigator() {
  const [query, setQuery] = useState("");
  const [part, setPart] = useState<PartFilter>("all");
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set([1]));
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as unknown) : [];
      if (Array.isArray(saved)) {
        setDone(
          new Set(
            saved.filter(
              (key): key is string =>
                typeof key === "string" && EGE_MATH_PROGRESS_KEYS.has(key)
            )
          )
        );
      }
    } catch {
      // Повреждённое локальное состояние не должно мешать открыть навигатор.
    } finally {
      setProgressLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!progressLoaded) return;
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify([...done]));
  }, [done, progressLoaded]);

  const normalizedQuery = normalize(query);

  const visibleTopics = useMemo<VisibleTopic[]>(() => {
    return EGE_MATH_TOPICS.flatMap((topic) => {
      if (part !== "all" && topic.part !== part) return [];
      if (!normalizedQuery) return [{ topic, subtopics: topic.subtopics }];

      const topicMatches =
        normalize(topic.title).includes(normalizedQuery) ||
        String(topic.number) === normalizedQuery ||
        `задание ${topic.number}`.includes(normalizedQuery);
      const subtopics = topicMatches
        ? topic.subtopics
        : topic.subtopics.filter((subtopic) =>
            normalize(subtopic.title).includes(normalizedQuery)
          );

      return subtopics.length > 0 ? [{ topic, subtopics }] : [];
    });
  }, [normalizedQuery, part]);

  const partProgress = useMemo(() => {
    return ([1, 2] as const).map((partNumber) => {
      const topics = EGE_MATH_TOPICS.filter((topic) => topic.part === partNumber);
      const keys = topics.flatMap((topic) =>
        topic.subtopics.map((subtopic) => materialProgressKey(topic, subtopic))
      );
      return {
        part: partNumber,
        total: keys.length,
        done: keys.filter((key) => done.has(key)).length,
      };
    });
  }, [done]);

  const nextMaterial = useMemo(() => {
    for (const topic of EGE_MATH_TOPICS) {
      for (const subtopic of topic.subtopics) {
        if (!done.has(materialProgressKey(topic, subtopic))) {
          return { topic, subtopic };
        }
      }
    }
    return null;
  }, [done]);

  const totalPercent = progressPercent(done.size, EGE_MATH_SUBTOPIC_COUNT);

  function toggleTopic(number: number) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(number)) next.delete(number);
      else next.add(number);
      return next;
    });
  }

  function toggleMaterial(topic: EgeMathTopic, subtopic: EgeMathSubtopic) {
    const key = materialProgressKey(topic, subtopic);
    setDone((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function jumpToTopic(number: number, subtopic?: EgeMathSubtopic) {
    setExpanded((current) => new Set([...current, number]));
    window.setTimeout(() => {
      const id = subtopic
        ? materialElementId(
            EGE_MATH_TOPICS.find((topic) => topic.number === number)!,
            subtopic
          )
        : `topic-${number}`;
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus({ preventScroll: true });
    }, 0);
  }

  function resetProgress() {
    if (
      window.confirm(
        "Сбросить все отметки о пройденных темах на этом устройстве?"
      )
    ) {
      setDone(new Set());
    }
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <IconSparkles size={15} />
            Учебный маршрут
          </div>
          <h1>Навигатор по темам ЕГЭ</h1>
          <p>
            Профильная математика: все 19 заданий и 95 подтем в порядке экзамена.
            Отмечай пройденное и возвращайся ровно туда, где остановился.
          </p>
          <div className={styles.heroActions}>
            {nextMaterial ? (
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() =>
                  jumpToTopic(nextMaterial.topic.number, nextMaterial.subtopic)
                }
              >
                Продолжить: №{nextMaterial.topic.number}
                <IconArrowRight size={17} />
              </button>
            ) : (
              <button
                type="button"
                className={styles.primaryAction}
                onClick={resetProgress}
              >
                Маршрут пройден — начать заново
              </button>
            )}
            <Link
              href="/catalog?subject=math"
              className={styles.secondaryAction}
            >
              <IconLibrary size={17} />
              Готовые материалы
            </Link>
          </div>
        </div>

        <div className={styles.progressCard}>
          <div
            className={styles.progressDial}
            style={{ "--materials-progress": `${totalPercent}%` } as React.CSSProperties}
            aria-label={`Пройдено ${totalPercent}%`}
          >
            <span>{totalPercent}%</span>
          </div>
          <div>
            <strong>
              {done.size} из {EGE_MATH_SUBTOPIC_COUNT}
            </strong>
            <span>подтем пройдено</span>
          </div>
        </div>
      </section>

      <section className={styles.toolbar} aria-label="Фильтры навигатора">
        <label className={styles.search}>
          <IconSearch size={19} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти тему: логарифмы, кредиты, планиметрия…"
            aria-label="Поиск по темам и подтемам"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Очистить поиск"
            >
              ×
            </button>
          )}
        </label>
        <div className={styles.partTabs}>
          {(
            [
              ["all", "Все задания"],
              [1, "Часть 1"],
              [2, "Часть 2"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={part === value ? styles.activeTab : ""}
              aria-pressed={part === value}
              onClick={() => setPart(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <div className={styles.layout}>
        <aside className={styles.rail} aria-label="Быстрый переход к заданию">
          <div className={styles.railBlock}>
            <span className={styles.railLabel}>Задания</span>
            <div className={styles.numberGrid}>
              {EGE_MATH_TOPICS.map((topic) => {
                const topicDone = topic.subtopics.filter((subtopic) =>
                  done.has(materialProgressKey(topic, subtopic))
                ).length;
                const complete = topicDone === topic.subtopics.length;
                return (
                  <button
                    key={topic.number}
                    type="button"
                    className={complete ? styles.numberComplete : ""}
                    onClick={() => jumpToTopic(topic.number)}
                    title={`${topic.number}. ${topic.title}`}
                  >
                    {complete ? <IconCheck size={14} /> : topic.number}
                  </button>
                );
              })}
            </div>
          </div>

          {partProgress.map((item) => (
            <div key={item.part} className={styles.miniProgress}>
              <div>
                <span>Часть {item.part}</span>
                <strong>
                  {item.done}/{item.total}
                </strong>
              </div>
              <i>
                <b
                  style={{
                    width: `${progressPercent(item.done, item.total)}%`,
                  }}
                />
              </i>
            </div>
          ))}

          {done.size > 0 && (
            <button
              type="button"
              className={styles.resetButton}
              onClick={resetProgress}
            >
              Сбросить прогресс
            </button>
          )}
        </aside>

        <section className={styles.topicList} aria-live="polite">
          <div className={styles.listHeading}>
            <div>
              <span>
                {normalizedQuery
                  ? `Найдено разделов: ${visibleTopics.length}`
                  : part === "all"
                    ? "Полная программа"
                    : `Часть ${part}`}
              </span>
              <small>
                Отметки сохраняются только на этом устройстве
              </small>
            </div>
            {!normalizedQuery && (
              <button
                type="button"
                onClick={() => {
                  const visibleNumbers = visibleTopics.map(({ topic }) => topic.number);
                  const allOpen = visibleNumbers.every((number) => expanded.has(number));
                  setExpanded(
                    allOpen
                      ? new Set()
                      : new Set([...expanded, ...visibleNumbers])
                  );
                }}
              >
                {visibleTopics.every(({ topic }) => expanded.has(topic.number))
                  ? "Свернуть все"
                  : "Развернуть все"}
              </button>
            )}
          </div>

          {visibleTopics.length === 0 ? (
            <div className={styles.emptyState}>
              <IconSearch size={28} />
              <strong>Такой темы пока нет</strong>
              <span>Попробуй более короткий запрос или проверь написание.</span>
              <button type="button" onClick={() => setQuery("")}>
                Показать все темы
              </button>
            </div>
          ) : (
            visibleTopics.map(({ topic, subtopics }) => {
              const topicDone = topic.subtopics.filter((subtopic) =>
                done.has(materialProgressKey(topic, subtopic))
              ).length;
              const complete = topicDone === topic.subtopics.length;
              const open = Boolean(normalizedQuery) || expanded.has(topic.number);

              return (
                <article
                  key={topic.number}
                  id={`topic-${topic.number}`}
                  className={`${styles.topicCard} ${complete ? styles.topicComplete : ""}`}
                  tabIndex={-1}
                >
                  <button
                    type="button"
                    className={styles.topicHeader}
                    onClick={() => toggleTopic(topic.number)}
                    aria-expanded={open}
                    aria-controls={`topic-body-${topic.number}`}
                  >
                    <span className={styles.topicNumber}>{topic.number}</span>
                    <span className={styles.topicTitle}>
                      <strong>{topic.title}</strong>
                      <small>
                        Часть {topic.part} · {scoreLabel(topic.maxScore)}
                      </small>
                    </span>
                    <span className={styles.topicProgress}>
                      {topicDone}/{topic.subtopics.length}
                    </span>
                    <span
                      className={`${styles.chevron} ${open ? styles.chevronOpen : ""}`}
                      aria-hidden
                    >
                     ⌄
                    </span>
                  </button>

                  {open && (
                    <div
                      id={`topic-body-${topic.number}`}
                      className={styles.topicBody}
                    >
                      <div className={styles.topicProgressRail}>
                        <span
                          style={{
                            width: `${progressPercent(
                              topicDone,
                              topic.subtopics.length
                            )}%`,
                          }}
                        />
                      </div>
                      <div className={styles.subtopicList}>
                        {subtopics.map((subtopic) => {
                          const key = materialProgressKey(topic, subtopic);
                          const checked = done.has(key);
                          return (
                            <div
                              key={key}
                              id={materialElementId(topic, subtopic)}
                              className={`${styles.subtopic} ${checked ? styles.subtopicDone : ""}`}
                              tabIndex={-1}
                            >
                              <button
                                type="button"
                                className={styles.checkButton}
                                role="checkbox"
                                aria-checked={checked}
                                aria-label={`${checked ? "Отметить непройденной" : "Отметить пройденной"}: ${subtopic.title}`}
                                onClick={() => toggleMaterial(topic, subtopic)}
                              >
                                {checked && <IconCheck size={15} />}
                              </button>
                              <button
                                type="button"
                                className={styles.subtopicTitle}
                                onClick={() => toggleMaterial(topic, subtopic)}
                              >
                                {subtopic.title}
                              </button>
                              <Link
                                href={`/catalog?subject=math&q=${encodeURIComponent(subtopic.title)}`}
                                className={styles.catalogLink}
                                title={`Найти готовые материалы по теме «${subtopic.title}»`}
                              >
                                Материалы
                                <IconArrowRight size={14} />
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>
      </div>

      <footer className={styles.sourceNote}>
        <span>
          Навигационная структура сверена 28 июля 2026 года с конструктором{" "}
          <a
            href={EGE_MATH_MATERIALS_META.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            «{EGE_MATH_MATERIALS_META.sourceName}» ↗
          </a>
          . Условия и решения задач не копируются.
        </span>
      </footer>
    </>
  );
}
