// もぐら珈琲研究所（架空）— デモサイトのスクリプト
(() => {
  "use strict";

  /* ---------- 豆のデータ（すべて架空） ---------- */
  const BEANS = [
    { name: "はじめての地上", origin: "エチオピア・イルガチェフェ", roast: "light", desc: "紅茶みたいに軽やか。レモンと白い花の香り。", acid: 5, bitter: 1, body: 2, price: 1300 },
    { name: "ほりたて", origin: "ケニア・ニエリ", roast: "light", desc: "カシスのような甘酸っぱさ。冷めてもおいしい。", acid: 5, bitter: 2, body: 3, price: 1400 },
    { name: "ひだまりブレンド", origin: "ブラジル × コロンビア", roast: "medium", desc: "ナッツとミルクチョコ。毎朝飲みたい定番。", acid: 3, bitter: 3, body: 3, price: 1000 },
    { name: "ねむれる土", origin: "コロンビア（デカフェ）", roast: "medium", desc: "夜でも安心のカフェインレス。黒糖の甘み。", acid: 2, bitter: 3, body: 3, price: 1200 },
    { name: "雨の日の穴ぐら", origin: "グアテマラ・アンティグア", roast: "dark", desc: "ほろ苦さとカカオの余韻。ミルクにも負けない。", acid: 2, bitter: 4, body: 4, price: 1100 },
    { name: "夜ふかしモグラ", origin: "インドネシア・マンデリン", roast: "dark", desc: "どっしり深い。ハーブとスパイスの香り。", acid: 1, bitter: 5, body: 5, price: 1200 },
  ];
  const ROAST_LABEL = { light: "浅煎り", medium: "中煎り", dark: "深煎り" };
  const yen = (n) => n.toLocaleString("ja-JP");

  const grid = document.getElementById("beans-grid");
  const bar = (label, v) =>
    `<div class="taste-row"><span>${label}</span><div class="taste-bar"><i style="width:${v * 20}%"></i></div></div>`;
  grid.innerHTML = BEANS.map((b) => `
    <article class="bean-card" data-roast="${b.roast}">
      <div class="bean-head">
        <div>
          <h3 class="bean-name">${b.name}</h3>
          <p class="bean-origin">${b.origin}</p>
        </div>
        <span class="roast roast-${b.roast}">${ROAST_LABEL[b.roast]}</span>
      </div>
      <p class="bean-desc">${b.desc}</p>
      <div class="taste">${bar("酸味", b.acid)}${bar("苦味", b.bitter)}${bar("コク", b.body)}</div>
      <p class="bean-price"><span>${yen(b.price)}円</span><small>100g・税込</small></p>
    </article>`).join("");

  /* ---------- 焙煎度の絞り込み ---------- */
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filterBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", String(on));
      });
      grid.querySelectorAll(".bean-card").forEach((card) => {
        card.classList.toggle("is-hidden", f !== "all" && card.dataset.roast !== f);
      });
    });
  });

  /* ---------- 月額シミュレーター ---------- */
  const PRICE_PER_100G = 1100;               // おまかせ豆の基準価格
  const AMOUNT_RATE = { 100: 1, 200: 1.9, 400: 3.6 };
  const DISCOUNT = { 4: 0.15, 2: 0.10, 1: 0 };
  const FREQ_LABEL = { 4: "毎週", 2: "2週間ごと", 1: "毎月" };
  const GRIND_LABEL = { bean: "豆のまま", drip: "ドリップ用に挽いて", press: "フレンチプレス用に挽いて" };
  const SHIPPING = 350;
  const FREE_SHIPPING_FROM = 3000;
  const GRAMS_PER_CUP = 10;

  const form = document.getElementById("sim-form");
  const out = {
    total: document.getElementById("sim-total"),
    each: document.getElementById("sim-each"),
    ship: document.getElementById("sim-ship"),
    cup: document.getElementById("sim-cup"),
    summary: document.getElementById("sim-summary"),
  };

  // 選び直すたびに前のカウントアップを止め、いま表示中の数字から次の金額へ動かす
  let shown = 0;
  let animId = 0;
  function countTo(el, to) {
    cancelAnimationFrame(animId);
    if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      shown = to;
      el.textContent = yen(to);
      return;
    }
    const from = shown;
    const start = performance.now();
    const dur = 400;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      shown = Math.round(from + (to - from) * eased);
      el.textContent = yen(shown);
      if (p < 1) animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
  }

  function calc() {
    const fd = new FormData(form);
    const amount = Number(fd.get("amount"));
    const freq = Number(fd.get("freq"));
    const grind = fd.get("grind");
    const each = Math.round((PRICE_PER_100G * AMOUNT_RATE[amount] * (1 - DISCOUNT[freq])) / 10) * 10;
    const subtotal = each * freq;
    const ship = subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING * freq;
    const total = subtotal + ship;
    const cups = (amount / GRAMS_PER_CUP) * freq;

    countTo(out.total, total);
    out.each.textContent = `${yen(each)}円`;
    out.ship.textContent = ship === 0 ? "無料" : `${yen(ship)}円`;
    out.cup.textContent = `約${yen(Math.round(total / cups))}円`;
    out.summary.textContent = `${FREQ_LABEL[freq]}、${amount}g を${GRIND_LABEL[grind]}お届け。ひと月で約${cups}杯ぶんです。`;
    const price = out.total.parentElement;
    price.classList.remove("bump");
    void price.offsetWidth;
    price.classList.add("bump");
  }
  form.addEventListener("change", calc);
  calc();

  /* ---------- トースト ---------- */
  const toast = document.getElementById("toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-show"), 3200);
  }
  document.getElementById("sim-start").addEventListener("click", () =>
    showToast("デモサイトなので、申し込みはできません 🐾"));

  /* ---------- お問い合わせ（送信しない） ---------- */
  const contact = document.getElementById("contact-form");
  contact.addEventListener("submit", (e) => {
    e.preventDefault();
    contact.reset();
    showToast("デモなので、どこにも送っていません。入力内容は消しました。");
  });

  /* ---------- スマホのメニュー ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
  });
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
    }));

  /* ---------- スクロールで出てくる・数字のカウントアップ ---------- */
  const countUp = (el) => {
    const to = Number(el.dataset.count);
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / 900);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          en.target.querySelectorAll("[data-count]").forEach(countUp);
          io.unobserve(en.target);
        });
      }, { threshold: 0.2 })
    : null;
  document.querySelectorAll(".reveal").forEach((el) => {
    if (io) io.observe(el);
    else {
      el.classList.add("is-in");
      el.querySelectorAll("[data-count]").forEach((n) => (n.textContent = n.dataset.count));
    }
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
