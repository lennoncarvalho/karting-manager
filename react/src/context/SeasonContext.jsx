import { createContext, useContext, useState, useEffect } from "react";
import { listSeasons } from "@/lib/api";
import { getStoredSeasonId, setStoredSeasonId } from "@/lib/theme";
import { useTranslation } from "react-i18next";

const SeasonContext = createContext(null);

function calculateDefaultSeason(ongoingSeasons) {
  if (!Array.isArray(ongoingSeasons) || ongoingSeasons.length === 0)
    return null;
  return [...ongoingSeasons].sort((a, b) => {
    const lD = new Date(a.start_date || a.end_date || "").getTime() || 0;
    const rD = new Date(b.start_date || b.end_date || "").getTime() || 0;
    if (lD !== rD) return rD - lD;
    return String(b.id).localeCompare(String(a.id));
  })[0];
}

export function SeasonProvider({ children }) {
  const { i18n } = useTranslation();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonState] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        let allSeasons = await listSeasons({
          order: { column: "start_date", ascending: true },
          filters: [{ column: "is_ongoing", operator: "eq", value: true }],
        });

        const storedId = getStoredSeasonId();
        let selected = allSeasons.find((s) => String(s.id) === storedId);

        if (!selected && storedId) {
          const storedSeasons = await listSeasons({
            filters: [{ column: "id", operator: "eq", value: storedId }],
            limit: 1,
          });
          if (storedSeasons?.length > 0) {
            selected = storedSeasons[0];
            allSeasons = [selected, ...allSeasons];
          }
        }

        if (!selected) {
          selected = calculateDefaultSeason(allSeasons);
          if (selected) setStoredSeasonId(selected.id);
        }

        const finalId = selected ? String(selected.id) : null;
        setSelectedSeasonState(finalId);
        setSeasons(allSeasons);

        if (selected) {
          const element = document.documentElement;
          if (selected.accent_color) {
            element.style.setProperty("--season-accent", selected.accent_color);
          }
        }
      } catch (err) {
        console.error("Failed to load seasons:", err);
      }
    };
    load();
  }, [i18n.language]);

  const setSeasonId = async (id) => {
    setStoredSeasonId(id);
    const newId = String(id);
    setSelectedSeasonState(newId);

    if (id) {
      const seasonRes = await listSeasons({
        order: { column: "start_date", ascending: true },
        filters: [{ column: "id", operator: "eq", value: id }],
      });

      const newSeason = seasonRes?.[0];
      if (newSeason) {
        const existing = seasons.find((s) => String(s.id) === id.toString());
        if (!existing) {
          setSeasons((prev) => [...prev, newSeason]);
        } else {
          setSeasons((prev) =>
            prev.map((s) => (String(s.id) === id.toString() ? newSeason : s)),
          );
        }
        if (newSeason.accent_color) {
          document.documentElement.style.setProperty(
            "--season-accent",
            newSeason.accent_color,
          );
        }
      }
    } else {
      document.documentElement.style.removeProperty("--season-accent");
    }
  };

  return (
    <SeasonContext.Provider
      value={{
        selectedSeasonId,
        seasons,
        setSeasonId,
      }}
    >
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  const ctx = useContext(SeasonContext);
  if (!ctx) throw new Error("useSeason must be used within SeasonProvider");
  return ctx;
}
