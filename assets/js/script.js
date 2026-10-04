"use strict";

const liveStatus = document.getElementById("live-status");
liveStatus.textContent = "";

// Copy from the displayed code so the example and copied text cannot drift.
document.querySelectorAll(".code-card").forEach((card) => {
  const code = card.querySelector("code");
  const button = card.querySelector(".copy-button");
  button.hidden = false;
  button.disabled = false;
  const source = code.textContent;
  if (card.dataset.language === "markdown" || card.dataset.language === "yaml" || card.dataset.language === "toml") {
    code.replaceChildren();
    const lines = source.split("\n");
    lines.forEach((line, index) => {
      const span = document.createElement("span");
      if (/^#{1,6} /.test(line)) span.className = "tok-heading";
      else if (/^\s*#/.test(line)) span.className = "tok-comment";
      else if (/^[\w-]+\s*[:=]/.test(line) || line === "---") span.className = "tok-key";
      span.textContent = line + (index < lines.length - 1 ? "\n" : "");
      code.append(span);
    });
  }
  button.addEventListener("click", async () => {
    button.disabled = true;
    const fallback = card.querySelector(".copy-fallback");
    fallback.hidden = true;
    try {
      if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(code.textContent);
      const status = document.getElementById("live-status");
      status.textContent = "コピーしました";
      button.textContent = "コピー済み";
      window.setTimeout(() => { button.textContent = "コピーする"; status.textContent = ""; }, 1800);
    } catch {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(code);
      selection.removeAllRanges();
      selection.addRange(range);
      fallback.hidden = false;
      fallback.textContent = "本文を選択しました。Ctrl+C（Macは⌘C）でコピーしてください。";
    } finally {
      button.disabled = false;
    }
  });
});

const search = document.getElementById("lesson-search");
if (search) {
  document.querySelector("[data-search-panel]").hidden = false;
  const cards = [...document.querySelectorAll(".lesson-card")];
  const groups = [...document.querySelectorAll(".catalog-group")];
  const clear = document.getElementById("clear-search");
  clear.disabled = false;
  const status = document.getElementById("search-status");
  const params = new URLSearchParams(window.location.search);
  search.value = params.get("q") || "";
  let composing = false;
  const filter = () => {
    const terms = search.value.trim().normalize("NFKC").toLocaleLowerCase("ja-JP").split(/\s+/).filter(Boolean);
    let count = 0;
    cards.forEach((card) => {
      const text = (card.textContent + " " + card.dataset.keywords).normalize("NFKC").toLocaleLowerCase("ja-JP");
      card.hidden = !terms.every((term) => text.includes(term));
      if (!card.hidden) count++;
    });
    groups.forEach((group) => { group.hidden = ![...group.querySelectorAll(".lesson-card")].some((card) => !card.hidden); });
    document.getElementById("no-results").hidden = count !== 0;
    clear.hidden = search.value.length === 0;
    status.textContent = `${count} / ${cards.length} ページを表示。タイトル・概要・関連語から探します。`;
    const url = new URL(window.location.href);
    if (search.value) url.searchParams.set("q", search.value); else url.searchParams.delete("q");
    try { window.history.replaceState(null, "", url); } catch { /* File previews may restrict URL changes. */ }
  };
  search.addEventListener("compositionstart", () => { composing = true; });
  search.addEventListener("compositionend", () => { composing = false; filter(); });
  search.addEventListener("input", (event) => { if (!composing && !event.isComposing) filter(); });
  clear.addEventListener("click", () => { search.value = ""; filter(); search.focus(); });
  filter();
}
