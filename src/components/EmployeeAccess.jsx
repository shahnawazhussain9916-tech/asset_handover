import React, { useState, useEffect, useRef } from "react";
import "./EmployeeAccess.css";

function EmployeeAccess() {
  const [employees, setEmployees] = useState([]);
  const [activeList, setActiveList] = useState([]);
  const [input, setInput] = useState("");
  const [highlightId, setHighlightId] = useState(null);

  const inputRef = useRef();

  const SHEET_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCSgffPIAdGfMyc4OaG1slvhyOz078XBMf3hx0K5T8AO5cLMpP7u9fzLPJZrrx6Ov4_Bjtqf-wGItW/pub?gid=516228192&single=true&output=csv";

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    fetch(SHEET_URL)
      .then((res) => res.text())
      .then((text) => {
        const rows = text.split("\n").map((r) => r.split(","));

        let map = {};
        let lookup = {};

        rows.slice(1).forEach((row) => {
          for (let i = 0; i < row.length; i += 3) {
            const emp = row[i]?.trim().toLowerCase();
            const log = row[i + 1]?.trim().toLowerCase();
            const badge = row[i + 2]?.trim().toLowerCase();

            if (!emp || !log || !badge) continue;

            if (!map[emp]) {
              map[emp] = {
                emp,
                log,
                badge,
                status: "PENDING",
                time: "",
              };
            }

            lookup[emp] = emp;
            lookup[log] = emp;
            lookup[badge] = emp;
          }
        });

        setEmployees(Object.values(map));
        window.idMap = lookup;
      });
  }, []);

  // =========================
  // ADD LIST (NO DUPLICATES)
  // =========================
  const addEmployees = () => {
    const values = input.toLowerCase().split(/[\s,]+/).filter(Boolean);

    let uniqueSet = new Set();
    let newList = [];

    values.forEach((val) => {
      const key = window.idMap?.[val];

      if (key && !uniqueSet.has(key)) {
        const found = employees.find((e) => e.emp === key);

        if (found) {
          const exists = activeList.some((e) => e.emp === key);

          if (!exists) {
            uniqueSet.add(key);
            newList.push({ ...found });
          }
        }
      }
    });

    setActiveList((prev) => [...prev, ...newList]);
    setInput("");
  };

  // =========================
  // MARK DONE + HIGHLIGHT
  // =========================
  const markDone = (value) => {
    const v = value.toLowerCase().trim();
    if (!v) return;

    const key = window.idMap?.[v];

    const time = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Riyadh",
    });

    setActiveList((prev) => {
      let found = false;

      const updated = prev.map((row) => {
        if (row.emp === key) {
          found = true;

          // highlight repeated scan
          if (row.status === "DONE") {
            setHighlightId(row.emp);
            setTimeout(() => setHighlightId(null), 800);
          }

          return { ...row, status: "DONE", time };
        }
        return row;
      });

      if (!found) {
        const exists = prev.some((r) => r.emp === key);

        if (!exists) {
          updated.push({
            emp: "-",
            log: "-",
            badge: v,
            status: "NOT IN SHEET",
            time,
            unknown: true,
          });
        }
      }

      return updated;
    });

    setInput("");
  };

  // =========================
  // CLEAR LIST
  // =========================
  const clearList = () => {
    setActiveList([]);
  };

  // =========================
  // ENTER KEY
  // =========================
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (activeList.length === 0) addEmployees();
      else markDone(input);
    }
  };

  // =========================
  // SORT
  // =========================
  const sortedList = [...activeList].sort((a, b) => {
    const getPriority = (item) => {
      if (item.status === "DONE") return 0;
      if (!item.status || item.status === "PENDING") return 1;
      if (item.status === "NOT IN SHEET") return 2;
      return 3;
    };
    return getPriority(a) - getPriority(b);
  });

  // =========================
  // COUNTS
  // =========================
  const doneCount = activeList.filter((r) => r.status === "DONE").length;
  const pendingCount = activeList.filter(
    (r) => !r.status || r.status === "PENDING"
  ).length;
  const notInSheetCount = activeList.filter(
    (r) => r.status === "NOT IN SHEET"
  ).length;

  // =========================
  // DOWNLOAD CSV
  // =========================
  const downloadCSV = () => {
    const headers = ["EMP", "LOG", "BADGE", "STATUS", "TIME"];

    const rows = activeList.map((r) => [
      r.emp,
      r.log,
      r.badge,
      r.status,
      r.time,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "handover_report.csv";
    a.click();
  };

  return (
    <div className="container">
      <h2>Employee Handover System</h2>

      <textarea
        placeholder="Enter EMP ID / LOG ID / BADGE ID"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        ref={inputRef}
      />

      <br />

      <button onClick={addEmployees}>Add List</button>
      <button onClick={clearList}>Clear</button>
      <button onClick={downloadCSV}>Download</button>

      <h3>Total: {activeList.length}</h3>

      {/* COUNTERS */}
      <div className="stats">
        <span>✅ Done: {doneCount}</span>
        <span>🟡 Pending: {pendingCount}</span>
        <span>🔴 Not in Sheet: {notInSheetCount}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>EMP</th>
            <th>LOG</th>
            <th>BADGE</th>
            <th>STATUS</th>
            <th>TIME</th>
          </tr>
        </thead>

        <tbody>
          {sortedList.map((r, i) => (
            <tr
              key={i}
              className={`
                ${r.unknown ? "unknown-row" : ""}
                ${r.status === "DONE" ? "done-row" : ""}
                ${highlightId === r.emp ? "flash-row" : ""}
              `}
            >
              <td>{r.emp}</td>
              <td>{r.log}</td>
              <td>{r.badge}</td>
              <td>{r.status}</td>
              <td>{r.time || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EmployeeAccess;