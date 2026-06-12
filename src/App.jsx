import { useState, useEffect, useLayoutEffect, useMemo, useRef, useCallback } from "react";

/* ============================================================
   イオンブロック・ラボ
   - 価数＝ブロックの幅。陽イオン（凸）と陰イオン（凹）の幅が
     そろうと電荷がつり合い、組成式と物質名が完成する。
   - iPad 横画面での利用を主に想定（880px以上で2カラム）。
   ============================================================ */

/* ================= イオンデータ ================= */
/* ionName はアプリ内表示用（「〜イオン」を省略しない） */
/* namePart は物質名の組み立て用 */

const CATIONS = [
  { id: "Na",  core: "Na",  charge: 1, ionName: "ナトリウムイオン",   namePart: "ナトリウム",   color: "#FF7043" },
  { id: "K",   core: "K",   charge: 1, ionName: "カリウムイオン",     namePart: "カリウム",     color: "#F4511E" },
  { id: "Ag",  core: "Ag",  charge: 1, ionName: "銀イオン",           namePart: "銀",           color: "#FF8A65" },
  { id: "NH4", core: "NH4", charge: 1, ionName: "アンモニウムイオン", namePart: "アンモニウム", color: "#FF7043", poly: true },
  { id: "Mg",  core: "Mg",  charge: 2, ionName: "マグネシウムイオン", namePart: "マグネシウム", color: "#EF5350" },
  { id: "Ca",  core: "Ca",  charge: 2, ionName: "カルシウムイオン",   namePart: "カルシウム",   color: "#E53935" },
  { id: "Ba",  core: "Ba",  charge: 2, ionName: "バリウムイオン",     namePart: "バリウム",     color: "#E53935" },
  { id: "Fe2", core: "Fe",  charge: 2, ionName: "鉄(Ⅱ)イオン",        namePart: "鉄(Ⅱ)",        color: "#D84315" },
  { id: "Cu",  core: "Cu",  charge: 2, ionName: "銅イオン",           namePart: "銅",           color: "#D84315" },
  { id: "Zn",  core: "Zn",  charge: 2, ionName: "亜鉛イオン",         namePart: "亜鉛",         color: "#EF5350" },
  { id: "Pb",  core: "Pb",  charge: 2, ionName: "鉛イオン",           namePart: "鉛",           color: "#E53935" },
  { id: "Al",  core: "Al",  charge: 3, ionName: "アルミニウムイオン", namePart: "アルミニウム", color: "#C62828" },
  { id: "Fe3", core: "Fe",  charge: 3, ionName: "鉄(Ⅲ)イオン",        namePart: "鉄(Ⅲ)",        color: "#B71C1C" },
];

const ANIONS = [
  { id: "F",    core: "F",    charge: -1, ionName: "フッ化物イオン",   namePart: "フッ化",   color: "#4FC3F7" },
  { id: "Cl",   core: "Cl",   charge: -1, ionName: "塩化物イオン",     namePart: "塩化",     color: "#42A5F5" },
  { id: "Br",   core: "Br",   charge: -1, ionName: "臭化物イオン",     namePart: "臭化",     color: "#29B6F6" },
  { id: "I",    core: "I",    charge: -1, ionName: "ヨウ化物イオン",   namePart: "ヨウ化",   color: "#26C6DA" },
  { id: "OH",   core: "OH",   charge: -1, ionName: "水酸化物イオン",   namePart: "水酸化",   color: "#29B6F6", poly: true },
  { id: "NO3",  core: "NO3",  charge: -1, ionName: "硝酸イオン",       namePart: "硝酸",     color: "#26C6DA", poly: true },
  { id: "HCO3", core: "HCO3", charge: -1, ionName: "炭酸水素イオン",   namePart: "炭酸水素", color: "#00BCD4", poly: true },
  { id: "O",    core: "O",    charge: -2, ionName: "酸化物イオン",     namePart: "酸化",     color: "#1E88E5" },
  { id: "S",    core: "S",    charge: -2, ionName: "硫化物イオン",     namePart: "硫化",     color: "#039BE5" },
  { id: "SO4",  core: "SO4",  charge: -2, ionName: "硫酸イオン",       namePart: "硫酸",     color: "#00ACC1", poly: true },
  { id: "CO3",  core: "CO3",  charge: -2, ionName: "炭酸イオン",       namePart: "炭酸",     color: "#0097A7", poly: true },
];

/* 身近な例・実験との関連（組成式の文字列をキーにする） */
const FACTS = {
  "NaCl": "食塩の主成分。海水中に多量に含まれる。",
  "KCl": "カリ肥料として用いられる。",
  "NaF": "むし歯予防のため、歯みがき剤に配合される。",
  "KI": "ヨウ素液（ヨウ素ヨウ化カリウム水溶液）の成分。",
  "NaOH": "水溶液は強いアルカリ性。セッケンの製造に用いられる。",
  "KOH": "アルカリ乾電池の電解液に用いられる。",
  "NaNO3": "チリ硝石として産出し、肥料となる。",
  "KNO3": "黒色火薬や花火の原料。",
  "NaHCO3": "重曹。ふくらし粉や入浴剤に用いられ、加熱分解の実験でも登場する。",
  "Na2CO3": "炭酸水素ナトリウムを加熱すると生じる。ガラスの原料。",
  "K2CO3": "ガラスやセッケンの原料。",
  "Na2SO4": "入浴剤（芒硝）に含まれることがある。",
  "Na2S": "皮革工業などで用いられる。",
  "AgCl": "白色の沈殿。光で分解する性質があり、写真の感光材料に利用された。",
  "AgBr": "写真フィルムの感光材料。",
  "AgI": "人工降雨の「種まき」に利用される。",
  "AgNO3": "塩化物イオンの検出に用いる試薬。",
  "Ag2O": "加熱すると銀と酸素に分解する（分解の実験で登場）。",
  "Ag2S": "銀製品が黒ずむ原因の物質。",
  "NH4Cl": "肥料や乾電池に用いられる。",
  "NH4NO3": "速効性の窒素肥料。",
  "(NH4)2SO4": "「硫安」とよばれる代表的な窒素肥料。",
  "MgO": "胃腸薬（制酸剤）に用いられる。",
  "MgCl2": "豆腐を固める「にがり」の主成分。",
  "Mg(OH)2": "胃腸薬や便秘薬に用いられる。",
  "CaCl2": "道路の凍結防止剤や除湿剤に用いられる。",
  "CaCO3": "石灰石・貝殻・卵の殻・チョークの主成分。",
  "Ca(OH)2": "消石灰。石灰水の溶質で、二酸化炭素を通すと白くにごる。",
  "CaO": "生石灰。菓子袋の乾燥剤に用いられる。",
  "CaSO4": "焼くと石こうになり、ギプスや建材に用いられる。",
  "CaF2": "蛍石として産出する。",
  "Ca(HCO3)2": "鍾乳洞ができる反応に関わる。水溶液中に存在する。",
  "BaSO4": "水にとけにくく、X線検査の造影剤（バリウム）に用いられる。",
  "BaCl2": "硫酸イオンの検出に用いる試薬。",
  "BaCO3": "陶磁器のうわぐすりなどに用いられる。",
  "FeS": "鉄と硫黄の化合の実験で生じる黒色物質。",
  "FeCl2": "水溶液はうすい緑色を示す。",
  "FeCl3": "水溶液は黄色を示す。基板のエッチングにも用いられる。",
  "Fe(OH)3": "赤褐色の沈殿として生じる。",
  "Fe2O3": "赤さびの主成分。顔料ベンガラとしても利用される。",
  "Fe2(SO4)3": "水処理の凝集剤に用いられる。",
  "CuO": "銅を空気中で加熱すると生じる黒色物質。還元の実験でも登場する。",
  "CuSO4": "青色の結晶として有名。水溶液も青色を示す。",
  "CuS": "黒色の沈殿。",
  "CuCl2": "水溶液の電気分解の実験に用いられる。",
  "Cu(OH)2": "青白色の沈殿。",
  "ZnS": "光をたくわえて光る蛍光材料に用いられる。",
  "ZnCl2": "乾電池やはんだ付けに用いられる。",
  "ZnO": "白色顔料や医薬品（亜鉛華）に用いられる。",
  "PbS": "黒色の沈殿。鉱物としては方鉛鉱。",
  "PbI2": "鮮やかな黄色の沈殿として有名。",
  "PbSO4": "鉛蓄電池の放電で生じる。",
  "PbCl2": "白色の沈殿。熱水にはとける。",
  "Al2O3": "ルビーやサファイアの主成分。",
  "Al(OH)3": "胃腸薬や浄水処理に用いられる。",
  "Al2(SO4)3": "浄水場で水をきれいにする凝集剤。",
  "AlCl3": "有機化学工業で触媒として用いられる。",
};

/* 出題リスト（c: 陽イオンid, a: 陰イオンid, lv: 難易度） */
const QUIZ = [
  // ★1：1価どうし
  { c: "Na", a: "Cl", lv: 1 }, { c: "K", a: "Cl", lv: 1 },
  { c: "Na", a: "OH", lv: 1 }, { c: "K", a: "NO3", lv: 1 },
  { c: "NH4", a: "Cl", lv: 1 }, { c: "Na", a: "NO3", lv: 1 },
  { c: "Ag", a: "Cl", lv: 1 }, { c: "Ag", a: "NO3", lv: 1 },
  { c: "Ag", a: "Br", lv: 1 }, { c: "Ag", a: "I", lv: 1 },
  { c: "Na", a: "F", lv: 1 }, { c: "K", a: "Br", lv: 1 },
  { c: "K", a: "I", lv: 1 }, { c: "Na", a: "HCO3", lv: 1 },
  { c: "NH4", a: "NO3", lv: 1 }, { c: "K", a: "OH", lv: 1 },
  // ★2：2価がからむ（1:2、2:1、2:2）
  { c: "Ca", a: "Cl", lv: 2 }, { c: "Mg", a: "O", lv: 2 },
  { c: "Cu", a: "SO4", lv: 2 }, { c: "Ca", a: "OH", lv: 2 },
  { c: "Ba", a: "SO4", lv: 2 }, { c: "Zn", a: "S", lv: 2 },
  { c: "Ca", a: "CO3", lv: 2 }, { c: "Na", a: "SO4", lv: 2 },
  { c: "K", a: "CO3", lv: 2 }, { c: "NH4", a: "SO4", lv: 2 },
  { c: "Cu", a: "O", lv: 2 }, { c: "Mg", a: "Cl", lv: 2 },
  { c: "Ba", a: "Cl", lv: 2 }, { c: "Na", a: "S", lv: 2 },
  { c: "Fe2", a: "S", lv: 2 }, { c: "Fe2", a: "Cl", lv: 2 },
  { c: "Pb", a: "S", lv: 2 }, { c: "Pb", a: "I", lv: 2 },
  { c: "Zn", a: "Cl", lv: 2 }, { c: "Cu", a: "OH", lv: 2 },
  { c: "Ca", a: "F", lv: 2 }, { c: "Ag", a: "O", lv: 2 },
  { c: "Ag", a: "S", lv: 2 }, { c: "Mg", a: "OH", lv: 2 },
  { c: "Zn", a: "O", lv: 2 }, { c: "Ca", a: "HCO3", lv: 2 },
  { c: "Pb", a: "SO4", lv: 2 }, { c: "Ba", a: "CO3", lv: 2 },
  // ★3：3価がからむ
  { c: "Al", a: "Cl", lv: 3 }, { c: "Al", a: "OH", lv: 3 },
  { c: "Al", a: "O", lv: 3 }, { c: "Al", a: "SO4", lv: 3 },
  { c: "Fe3", a: "Cl", lv: 3 }, { c: "Fe3", a: "OH", lv: 3 },
  { c: "Fe3", a: "O", lv: 3 }, { c: "Fe3", a: "SO4", lv: 3 },
  { c: "Al", a: "NO3", lv: 3 }, { c: "Fe3", a: "NO3", lv: 3 },
];

/* ================= タイムアタック設定 =================
   element-quiz と同じ方式：
   固定問題数を解き切るまでの経過時間を競い、タイムでグレード判定。
   正解するまで同じ問題に再挑戦（ミスはカウント）。
   ミスした問題は終了後に「復習」できる。 */

/* ▼ 授業に合わせて調整しやすい設定値 ▼ */
const TA_SET = { lv1: 2, lv2: 4, lv3: 4 }; // 計10問（★2・★3中心。出題順はランダム）
const TA_TOTAL = TA_SET.lv1 + TA_SET.lv2 + TA_SET.lv3;
const TA_MISS_LIMIT = 10; // これ以上ミスすると記録対象外
const TA_CELEB_MS = 700; // 正解時にブロック・組成式・物質名を見せる時間（この間タイムは停止）
const MAX_BLOCKS = 6;     // 1種類のイオンにつき置けるブロックの上限（レイアウト保護）

/* ===== ベスト記録の永続化（端末ローカル） ===== */
const BEST_KEY = "ionblock_best_v1";
const CHARGE_BEST_KEY = "ionblock_charge_best_v1";
function readBest(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return typeof v.sec === "number" && isFinite(v.sec) ? v.sec : null;
  } catch (e) {
    return null;
  }
}
function writeBest(key, sec) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ sec, at: Date.now() }));
  } catch (e) {
    /* ignore */
  }
}

/* ================= 電荷クイズ（原子番号1〜20） =================
   元素記号クイズと同形式：全元素を1回ずつランダム順に出題し、
   解き切るまでのタイムを競う。誤答はミスとして数え、正解するまで
   同じ元素に挑戦。タイムでグレード判定、ミスした元素は復習できる。
   ▼ ans は授業での扱いに合わせて変更可（例：B を "3+" とする等） ▼ */
const ELEMENTS = [
  { z: 1,  sym: "H",  name: "水素",       ans: "+",    ionName: "水素イオン" },
  { z: 2,  sym: "He", name: "ヘリウム",   ans: "none", note: "貴ガスは安定で、イオンになりにくい" },
  { z: 3,  sym: "Li", name: "リチウム",   ans: "+",    ionName: "リチウムイオン" },
  { z: 4,  sym: "Be", name: "ベリリウム", ans: "2+",   ionName: "ベリリウムイオン" },
  //{ z: 5,  sym: "B",  name: "ホウ素",     ans: "none", note: "ホウ素は最外殻電子の数が中途半端で、単原子イオンになりにくい" },
  //{ z: 6,  sym: "C",  name: "炭素",       ans: "none", note: "炭素は最外殻電子の数が中途半端で、単原子イオンになりにくい" },
  //{ z: 7,  sym: "N",  name: "窒素",       ans: "3-",   ionName: "窒化物イオン" },
  { z: 8,  sym: "O",  name: "酸素",       ans: "2-",   ionName: "酸化物イオン" },
  { z: 9,  sym: "F",  name: "フッ素",     ans: "-",    ionName: "フッ化物イオン" },
  { z: 10, sym: "Ne", name: "ネオン",     ans: "none", note: "貴ガスは安定で、イオンになりにくい" },
  { z: 11, sym: "Na", name: "ナトリウム", ans: "+",    ionName: "ナトリウムイオン" },
  { z: 12, sym: "Mg", name: "マグネシウム", ans: "2+", ionName: "マグネシウムイオン" },
  { z: 13, sym: "Al", name: "アルミニウム", ans: "3+", ionName: "アルミニウムイオン" },
  //{ z: 14, sym: "Si", name: "ケイ素",     ans: "none", note: "ケイ素は最外殻電子の数が中途半端で、単原子イオンになりにくい" },
  //{ z: 15, sym: "P",  name: "リン",       ans: "3-",   ionName: "リン化物イオン" },
  { z: 16, sym: "S",  name: "硫黄",       ans: "2-",   ionName: "硫化物イオン" },
  { z: 17, sym: "Cl", name: "塩素",       ans: "-",    ionName: "塩化物イオン" },
  { z: 18, sym: "Ar", name: "アルゴン",   ans: "none", note: "貴ガスは安定で、イオンになりにくい" },
  { z: 19, sym: "K",  name: "カリウム",   ans: "+",    ionName: "カリウムイオン" },
  { z: 20, sym: "Ca", name: "カルシウム", ans: "2+",   ionName: "カルシウムイオン" },
];

/* 解答ボタン（左から並べる順） */
const CHARGE_CHOICES = [
  ["3-", "3−"], ["2-", "2−"], ["-", "−"],
  ["none", "イオンになりにくい"],
  ["+", "+"], ["2+", "2+"], ["3+", "3+"],
];
const ANS_LABEL = Object.fromEntries(CHARGE_CHOICES);
const CHARGE_TOTAL = ELEMENTS.length;
const CHARGE_MISS_LIMIT = 10;  // これ以上ミスすると記録対象外
const CHARGE_CELEB_MS = 700;  // 正解表示の時間（この間タイムは停止）

function gradeForChargeSeconds(sec) {
  /* ▼ グレードの閾値（秒）。生徒の実態に合わせて調整可 ▼ */
  if (sec < 30) {
    return { grade: "SS", title: "イオン電荷レジェンド!!!",
      comment: "30秒切りは伝説級。周期表とイオンが頭の中でつながっています。" };
  }
  if (sec <= 60) {
    return { grade: "S", title: "電荷マスター!!",
      comment: "見事です。族と電荷の関係が反射的に分かっています。" };
  }
  if (sec <= 90) {
    return { grade: "A", title: "すばらしい！",
      comment: "良いペースです。あと少しでSに届きます。" };
  }
  if (sec <= 120) {
    return { grade: "B", title: "順調！",
      comment: "迷った元素は周期表の縦の並び（族）で整理しましょう。" };
  }
  return { grade: "C", title: "これから伸びる",
    comment: "まずは1族＝+、17族＝−、18族＝なりにくい、から確実に。" };
}

function gradeForSeconds(sec) {
  /* ▼ グレードの閾値（秒）。生徒の実態に合わせて調整可 ▼ */
  if (sec < 30) {
    return { grade: "SS", title: "イオン結合レジェンド!!!",
      comment: "30秒切りは伝説級。組成式を完全に手の内に入れています。" };
  }
  if (sec <= 60) {
    return { grade: "S", title: "組成式マスター!!",
      comment: "見事です。イオンの組み合わせが反射的に分かっています。" };
  }
  if (sec <= 90) {
    return { grade: "A", title: "すばらしい！",
      comment: "良いペースです。あと少しでSに届きます。" };
  }
  if (sec <= 120) {
    return { grade: "B", title: "順調！",
      comment: "迷った物質を復習すると、タイムが大きく縮みます。" };
  }
  return { grade: "C", title: "これから伸びる",
    comment: "まずは★1の1価どうしの組み合わせを確実にしましょう。" };
}

function formatSeconds(sec) {
  return sec.toFixed(1) + " 秒";
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildTaQuestions() {
  const pick = (lv, n) => shuffle(QUIZ.filter((q) => q.lv === lv)).slice(0, n);
  // 難易度の構成比を守りつつ、出題順は完全にランダムにする
  return shuffle([...pick(1, TA_SET.lv1), ...pick(2, TA_SET.lv2), ...pick(3, TA_SET.lv3)]);
}

/* ================= ヘルパー ================= */

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
const findCat = (id) => CATIONS.find((c) => c.id === id);
const findAn = (id) => ANIONS.find((a) => a.id === id);

/* "NH4" → NH₄ のように数字を下付きで表示 */
function Core({ text }) {
  const parts = text.split(/(\d+)/).filter(Boolean);
  return (
    <>
      {parts.map((p, i) =>
        /^\d+$/.test(p) ? (
          <sub key={i} style={{ fontSize: "0.62em", lineHeight: 0 }}>{p}</sub>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

function IonFormula({ ion, size = "1em" }) {
  const n = Math.abs(ion.charge);
  const sign = ion.charge > 0 ? "+" : "−";
  return (
    <span style={{ fontSize: size, fontFamily: "'Lexend', sans-serif", fontWeight: 700 }}>
      <Core text={ion.core} />
      <sup style={{ fontSize: "0.62em", lineHeight: 0 }}>{n > 1 ? n : ""}{sign}</sup>
    </span>
  );
}

const buildFormulaParts = (cat, an, m, n) => [
  { core: cat.core, count: m, poly: cat.poly },
  { core: an.core, count: n, poly: an.poly },
];

const formulaToString = (parts) =>
  parts
    .map(({ core, count, poly }) =>
      count <= 1 ? core : poly ? `(${core})${count}` : `${core}${count}`
    )
    .join("");

function FormulaDisplay({ parts, size = "2rem" }) {
  return (
    <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: size }}>
      {parts.map(({ core, count, poly }, i) => {
        if (count <= 1) return <Core key={i} text={core} />;
        if (poly)
          return (
            <span key={i}>
              (<Core text={core} />)<sub style={{ fontSize: "0.6em", lineHeight: 0 }}>{count}</sub>
            </span>
          );
        return (
          <span key={i}>
            <Core text={core} />
            <sub style={{ fontSize: "0.6em", lineHeight: 0 }}>{count}</sub>
          </span>
        );
      })}
    </span>
  );
}

const compoundName = (cat, an) => `${an.namePart}${cat.namePart}`;

/* 元素記号＋電荷の上付き表示（電荷クイズ用） */
function ChargeIon({ sym, ans, size = "1em" }) {
  return (
    <span style={{ fontSize: size, fontFamily: "'Lexend', sans-serif", fontWeight: 700 }}>
      {sym}
      <sup style={{ fontSize: "0.62em", lineHeight: 0 }}>{ANS_LABEL[ans]}</sup>
    </span>
  );
}

/* ヘッダー常時表示用：モードのランクとベストタイム */
function RecordChip({ label, best, gradeFn }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: "rgba(255,255,255,0.06)", border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "4px 10px",
    }}>
      <span style={{ fontSize: "0.66rem", fontWeight: 800, color: C.sub }}>{label}</span>
      {best == null ? (
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(241,245,249,0.4)" }}>記録なし</span>
      ) : (
        <>
          <span style={{
            fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: "0.8rem",
            color: "#422006", background: C.gold, borderRadius: 6, padding: "0 6px",
          }}>
            {gradeFn(best).grade}
          </span>
          <span style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: "0.78rem", color: C.ink }}>
            {best.toFixed(1)}<span style={{ fontSize: "0.62rem" }}> 秒</span>
          </span>
        </>
      )}
    </div>
  );
}

/* 出題データ → 正解の組成式パーツ（最簡比） */
function answerParts(q) {
  const cat = findCat(q.c), an = findAn(q.a);
  const p = cat.charge, m0 = -an.charge;
  const gg = gcd(p, m0);
  return buildFormulaParts(cat, an, m0 / gg, p / gg);
}

/* ================= ブロック描画 ================= */

const UNIT = 54;
const STUD_H = 9;

function CationBlock({ ion, onClick }) {
  return (
    <div onClick={onClick} title="タップで取り外す" style={{
      position: "relative", width: ion.charge * UNIT, height: 52, background: ion.color,
      color: "#fff", borderRadius: 10, display: "flex", alignItems: "center",
      justifyContent: "center", cursor: "pointer", flexShrink: 0, userSelect: "none",
      boxShadow: "inset 0 3px 0 rgba(255,255,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.45)",
    }}>
      <IonFormula ion={ion} size="1.05rem" />
      {Array.from({ length: ion.charge }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", bottom: -STUD_H, left: i * UNIT + UNIT / 2 - 11,
          width: 22, height: STUD_H, background: ion.color,
          borderRadius: "0 0 5px 5px", boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.18)",
        }} />
      ))}
    </div>
  );
}

function AnionBlock({ ion, onClick }) {
  const n = -ion.charge;
  return (
    <div onClick={onClick} title="タップで取り外す" style={{
      position: "relative", width: n * UNIT, height: 52, background: ion.color,
      color: "#fff", borderRadius: 10, display: "flex", alignItems: "center",
      justifyContent: "center", cursor: "pointer", flexShrink: 0, userSelect: "none",
      boxShadow: "inset 0 3px 0 rgba(255,255,255,0.3), inset 0 -3px 0 rgba(0,0,0,0.18), 0 2px 4px rgba(0,0,0,0.45)",
    }}>
      <IonFormula ion={ion} size="1.05rem" />
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", top: 0, left: i * UNIT + UNIT / 2 - 12,
          width: 24, height: STUD_H + 1, background: "rgba(2,6,23,0.5)",
          borderRadius: "0 0 5px 5px",
        }} />
      ))}
    </div>
  );
}

/* ================= 共通スタイル ================= */

/* ダークテーマ（元素記号クイズと同じデザイン言語：
   ダーク背景＋半透明白カード＋白文字。ただし基調色は
   あちらの「紺〜藍（indigo）」に対し、こちらは
   「深緑〜ティール＋エメラルド」で明確に区別する） */
const C = {
  ink: "#F1F5F9",                    // 基本文字色
  sub: "rgba(241,245,249,0.65)",     // 補助文字色
  card: "rgba(255,255,255,0.05)",    // カード背景
  border: "rgba(255,255,255,0.10)",  // カード枠線
  plus: "#F87171",                   // 陽イオン側アクセント
  minus: "#38BDF8",                  // 陰イオン側アクセント
  gold: "#FCD34D",                   // グレード・強調
  green: "#34D399",                  // 正解・主ボタン（エメラルド＝本アプリの識別色）
};

const btn = (bg, color = "#fff") => ({
  background: bg, color, border: "none", borderRadius: 12,
  padding: "10px 18px", fontWeight: 700, fontSize: "0.95rem",
  fontFamily: "inherit", cursor: "pointer",
  boxShadow: "0 2px 0 rgba(0,0,0,0.45)",
});

const cardStyle = {
  background: C.card, border: `1px solid ${C.border}`,
  borderRadius: 18, padding: 16,
};

/* ---------- イオン選択パレット（モジュールレベルで定義：
     再レンダリングでDOMノードが作り直されてタップが落ちるのを防ぐ） ---------- */

const MU = 46;   // 1価あたりの幅（パレット内）
const MSTUD = 5;

function MiniBlock({ ion, isCat, onClick }) {
  const n = Math.abs(ion.charge);
  const blockW = n * MU;
  const btnW = Math.max(blockW, 86); // 名前（最長：アンモニウムイオン）が1行で収まる幅を確保
  return (
    <button onClick={onClick} style={{
      border: "none", background: "none", padding: 0, cursor: "pointer",
      fontFamily: "inherit", display: "flex", flexDirection: "column",
      alignItems: "center", gap: isCat ? MSTUD + 2 : 2, width: btnW,
    }}>
      <div style={{
        position: "relative", width: blockW, height: 36, background: ion.color, color: "#fff",
        borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "inset 0 2px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.15), 0 2px 3px rgba(0,0,0,0.45)",
        paddingTop: isCat ? 0 : MSTUD - 2,
      }}>
        <IonFormula ion={ion} size="0.85rem" />
        {Array.from({ length: n }).map((_, i) => (
          <div key={i} style={
            isCat
              ? { position: "absolute", bottom: -MSTUD, left: i * MU + MU / 2 - 7,
                  width: 13, height: MSTUD, background: ion.color,
                  borderRadius: "0 0 3px 3px", boxShadow: "inset 0 -2px 0 rgba(0,0,0,0.18)" }
              : { position: "absolute", top: 0, left: i * MU + MU / 2 - 8,
                  width: 15, height: MSTUD + 1, background: "rgba(2,6,23,0.5)",
                  borderRadius: "0 0 3px 3px" }
          } />
        ))}
      </div>
      <span style={{
        fontSize: "0.56rem", fontWeight: 800, color: "rgba(241,245,249,0.82)",
        textAlign: "center", lineHeight: 1.25, maxWidth: btnW,
      }}>
        {ion.ionName}
      </span>
    </button>
  );
}

function ChargeGroup({ list, isCat, onPick }) {
  const groups = [1, 2, 3]
    .map((v) => ({ v, ions: list.filter((i) => Math.abs(i.charge) === v) }))
    .filter((gr) => gr.ions.length);
  return (
    <div style={{ display: "grid", gap: 7 }}>
      {groups.map(({ v, ions }) => (
        <div key={v} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <div style={{
            flexShrink: 0, width: 34, textAlign: "center", marginTop: 7,
            background: isCat ? "rgba(248,113,113,0.15)" : "rgba(56,189,248,0.15)",
            color: isCat ? C.plus : C.minus,
            borderRadius: 7, padding: "3px 0", fontSize: "0.66rem", fontWeight: 800,
            lineHeight: 1.3,
          }}>
            {v}価<br />
            <span style={{ fontSize: "0.64rem", letterSpacing: 1 }}>{(isCat ? "+" : "−").repeat(v)}</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 5px", alignItems: "flex-start" }}>
            {ions.map((ion) => (
              <MiniBlock key={ion.id} ion={ion} isCat={isCat} onClick={() => onPick(ion)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Palette({ onPickCat, onPickAn }) {
  return (
    <div style={{ ...cardStyle, padding: 12 }}>
      <div style={{ fontWeight: 800, fontSize: "0.85rem", color: C.ink, marginBottom: 7 }}>
        イオン選択 <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "rgba(241,245,249,0.55)" }}>── 価数の大きさ＝ブロックの幅</span>
      </div>
      <div style={{ fontSize: "0.74rem", fontWeight: 800, color: C.plus, marginBottom: 6 }}>陽イオン（＋）</div>
      <ChargeGroup list={CATIONS} isCat={true} onPick={onPickCat} />
      <div style={{ borderTop: "1px dashed rgba(255,255,255,0.18)", margin: "8px 0" }} />
      <div style={{ fontSize: "0.74rem", fontWeight: 800, color: C.minus, marginBottom: 6 }}>陰イオン（−）</div>
      <ChargeGroup list={ANIONS} isCat={false} onPick={onPickAn} />
    </div>
  );
}

/* ---------- 画面の高さに収まるよう自動縮小するラッパー ----------
   2カラム表示（880px以上）のとき、中身の自然な高さがビューポートに
   収まらない場合だけ、収まる倍率まで等比縮小する。
   レイアウト幅は 1/scale 倍に広げてから縮小するので、横幅は変わらない。 */
function FitToViewport({ children, minScale = 0.6, bottomMargin = 12 }) {
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, height: null });

  useLayoutEffect(() => {
    const measure = () => {
      const outer = outerRef.current, inner = innerRef.current;
      if (!outer || !inner) return;
      let wide = true;
      try {
        wide = !window.matchMedia || window.matchMedia("(min-width: 880px)").matches;
      } catch (e) { /* ignore */ }
      // いったん等倍に戻して自然な高さを測る
      inner.style.transform = "none";
      inner.style.width = "100%";
      const natural = inner.scrollHeight;
      const top = outer.getBoundingClientRect().top + (window.scrollY || 0);
      const avail = (window.innerHeight || 0) - Math.min(top, 140) - bottomMargin;
      if (!wide || natural <= 0 || avail <= 0 || natural <= avail) {
        inner.style.transform = "";
        inner.style.width = "";
        setFit({ scale: 1, height: null });
        return;
      }
      const s = Math.max(minScale, Math.min(1, avail / natural));
      inner.style.transform = "";
      inner.style.width = "";
      setFit({ scale: s, height: Math.ceil(natural * s) });
    };
    measure();
    const t1 = setTimeout(measure, 350);  // フォント読み込み後に再計測
    let t2 = 0;
    const onResize = () => { clearTimeout(t2); t2 = setTimeout(measure, 60); };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  return (
    <div ref={outerRef} style={{ overflow: "hidden", height: fit.height || "auto" }}>
      <div ref={innerRef} style={
        fit.scale < 1
          ? { transform: `scale(${fit.scale})`, transformOrigin: "top left",
              width: `${100 / fit.scale}%` }
          : undefined
      }>
        {children}
      </div>
    </div>
  );
}

/* ================= メイン ================= */

export default function IonBlockLab() {
  const [mode, setMode] = useState("build"); // build | quiz | ta | list
  const [catId, setCatId] = useState(null);
  const [catCount, setCatCount] = useState(0);
  const [anId, setAnId] = useState(null);
  const [anCount, setAnCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [successKey, setSuccessKey] = useState(0);

  /* ----- 練習モード ----- */
  const [quizLv, setQuizLv] = useState(1);
  const [quizQ, setQuizQ] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [quizScore, setQuizScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const usedRef = useRef([]);

  /* ----- タイムアタック ----- */
  const [taScreen, setTaScreen] = useState("home"); // home | countdown | run | result
  const [taPhase, setTaPhase] = useState("main");   // main | review
  const [countdownStep, setCountdownStep] = useState(0);
  const [taQs, setTaQs] = useState([]);
  const [taIndex, setTaIndex] = useState(0);
  const [taMiss, setTaMiss] = useState(0);
  const [taMissedQs, setTaMissedQs] = useState([]);
  const [taElapsed, setTaElapsed] = useState(0); // 表示用（秒）
  const [taResult, setTaResult] = useState(null);
  const [taBest, setTaBest] = useState(() => readBest(BEST_KEY)); // ベスト記録（秒・端末に保存）
  const [taOverlay, setTaOverlay] = useState(null); // 正解演出
  const taStartRef = useRef(null);
  const taPausedRef = useRef(0);
  const taPauseStartRef = useRef(null);
  const taWrongFlagRef = useRef(false); // つり合った状態での誤答を1回だけカウントする
  const taMissedThisQRef = useRef(false);
  const taMissRef = useRef(0);          // ミス数の即時参照用
  const taMissedQsRef = useRef([]);     // ミス問題リストの即時参照用
  const taCelebRef = useRef(false);     // 正解演出中フラグ（演出中は操作を受け付けない）
  const taCelebStartRef = useRef(null); // 演出開始時刻（タイム停止の計算用）
  const taRunIdRef = useRef(0);         // 中断後に古いタイマーが発火しないようにする世代番号

  /* ----- 電荷クイズ ----- */
  const [chScreen, setChScreen] = useState("home"); // home | countdown | run | result
  const [chPhase, setChPhase] = useState("main");   // main | review
  const [chCountdown, setChCountdown] = useState(0);
  const [chQs, setChQs] = useState([]);
  const [chIndex, setChIndex] = useState(0);
  const [chMiss, setChMiss] = useState(0);
  const [chMissed, setChMissed] = useState([]);
  const [chElapsed, setChElapsed] = useState(0);
  const [chResult, setChResult] = useState(null);
  const [chBest, setChBest] = useState(() => readBest(CHARGE_BEST_KEY)); // ベスト記録（秒・端末に保存）
  const [chOverlay, setChOverlay] = useState(null); // 正解演出（element）
  const [chWrong, setChWrong] = useState(false);
  const chStartRef = useRef(null);
  const chPausedRef = useRef(0);
  const chMissRef = useRef(0);
  const chMissedRef = useRef([]);
  const chMissedThisQRef = useRef(false);
  const chCelebRef = useRef(false);
  const chCelebStartRef = useRef(null);
  const chRunIdRef = useRef(0);

  const cat = catId ? findCat(catId) : null;
  const an = anId ? findAn(anId) : null;
  const plusTotal = cat ? cat.charge * catCount : 0;
  const minusTotal = an ? -an.charge * anCount : 0;
  const balanced = plusTotal > 0 && plusTotal === minusTotal;
  const g = balanced ? gcd(catCount, anCount) : 1;
  const simplest = balanced && g === 1;

  /* ---------- 共通操作 ---------- */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (balanced) setSuccessKey((k) => k + 1);
  }, [balanced, catId, anId, catCount, anCount]);

  const taInputLocked = () => taCelebRef.current && mode === "ta" && taScreen === "run";

  const addCat = (ion) => {
    if (taInputLocked()) return; // 正解表示中
    setQuizResult(null);
    if (catId && catId !== ion.id) {
      setCatId(ion.id); setCatCount(1);
      setToast(`陽イオンを「${ion.ionName}」に変更しました`);
    } else if (catId === ion.id && catCount >= MAX_BLOCKS) {
      setToast(`ブロックは1種類につき最大 ${MAX_BLOCKS} 個までです`);
    } else {
      setCatId(ion.id); setCatCount((c) => (catId === ion.id ? c + 1 : 1));
    }
  };
  const addAn = (ion) => {
    if (taInputLocked()) return; // 正解表示中
    setQuizResult(null);
    if (anId && anId !== ion.id) {
      setAnId(ion.id); setAnCount(1);
      setToast(`陰イオンを「${ion.ionName}」に変更しました`);
    } else if (anId === ion.id && anCount >= MAX_BLOCKS) {
      setToast(`ブロックは1種類につき最大 ${MAX_BLOCKS} 個までです`);
    } else {
      setAnId(ion.id); setAnCount((c) => (anId === ion.id ? c + 1 : 1));
    }
  };
  const removeCat = () => {
    if (taInputLocked()) return;
    setQuizResult(null);
    setCatCount((c) => { const n = c - 1; if (n <= 0) setCatId(null); return Math.max(0, n); });
  };
  const removeAn = () => {
    if (taInputLocked()) return;
    setQuizResult(null);
    setAnCount((c) => { const n = c - 1; if (n <= 0) setAnId(null); return Math.max(0, n); });
  };
  const clearAll = useCallback(() => {
    setCatId(null); setCatCount(0); setAnId(null); setAnCount(0); setQuizResult(null);
  }, []);

  /* ---------- 練習モード ---------- */
  const nextQuiz = (lv = quizLv) => {
    const all = QUIZ.filter((q) => q.lv === lv);
    let pool = all.filter((q) => !usedRef.current.includes(`${q.c}|${q.a}`));
    if (!pool.length) { usedRef.current = []; pool = all; }
    const q = pool[Math.floor(Math.random() * pool.length)];
    usedRef.current.push(`${q.c}|${q.a}`);
    setQuizQ(q);
    setQuizResult(null);
    clearAll();
  };

  const checkQuiz = () => {
    if (!quizQ) return;
    const tc = findCat(quizQ.c), ta = findAn(quizQ.a);
    if (!cat || !an || catCount === 0 || anCount === 0) {
      setQuizResult({ ok: false, msg: "陽イオンと陰イオンのブロックを両方置いてください。" });
      return;
    }
    if (cat.id !== tc.id || an.id !== ta.id) {
      setQuizResult({ ok: false, msg: "イオンの種類が異なります。物質名を手がかりに選び直しましょう。" });
      setStreak(0);
      return;
    }
    if (!balanced) {
      setQuizResult({ ok: false, msg: "＋と−の合計が一致していません。ブロックの幅をそろえましょう。" });
      setStreak(0);
      return;
    }
    if (!simplest) {
      setQuizResult({ ok: false, msg: "電荷はつり合っていますが、組成式は最も簡単な整数比で表します。" });
      return;
    }
    setQuizScore((s) => s + quizQ.lv * 10);
    setStreak((s) => s + 1);
    setQuizResult({ ok: true, msg: "正解です。" });
  };

  /* ---------- タイムアタック ---------- */

  // バックグラウンド中の時間を計測から除外する
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        taPauseStartRef.current = performance.now();
      } else if (taPauseStartRef.current != null) {
        const d = performance.now() - taPauseStartRef.current;
        taPausedRef.current += d;
        chPausedRef.current += d;
        taPauseStartRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const startTa = (phase = "main", questions = null) => {
    setTaPhase(phase);
    setTaQs(questions || buildTaQuestions());
    setTaIndex(0);
    setTaMiss(0);
    setTaMissedQs([]);
    setTaElapsed(0);
    setTaOverlay(null);
    taWrongFlagRef.current = false;
    taMissedThisQRef.current = false;
    taMissRef.current = 0;
    taMissedQsRef.current = [];
    taCelebRef.current = false;
    taCelebStartRef.current = null;
    taRunIdRef.current += 1;
    taStartRef.current = null;
    taPausedRef.current = 0;
    taPauseStartRef.current = null;
    clearAll();
    setCountdownStep(0);
    setTaScreen("countdown");
  };

  // カウントダウン（3・2・1・スタート）
  useEffect(() => {
    if (taScreen !== "countdown") return;
    let cancelled = false;
    const tick = (i) => {
      if (cancelled) return;
      setCountdownStep(i);
      if (i >= 3) {
        setTimeout(() => {
          if (cancelled) return;
          clearAll(); // カウントダウン中に置かれたブロックを消去してから開始
          taStartRef.current = performance.now();
          setTaScreen("run");
        }, 700);
        return;
      }
      setTimeout(() => tick(i + 1), 900);
    };
    tick(0);
    return () => { cancelled = true; };
  }, [taScreen]);

  // 経過時間の表示更新
  useEffect(() => {
    if (taScreen !== "run" || taPhase !== "main") return;
    const iv = setInterval(() => {
      if (taStartRef.current == null) return;
      const celebExtra = taCelebStartRef.current != null
        ? performance.now() - taCelebStartRef.current : 0;
      setTaElapsed(Math.max(0,
        (performance.now() - taStartRef.current - taPausedRef.current - celebExtra) / 1000));
    }, 100);
    return () => clearInterval(iv);
  }, [taScreen, taPhase]);

  const finishTa = useCallback((finalMissedQs, finalMiss) => {
    if (taPhase === "main") {
      const sec = Math.max(0,
        (performance.now() - taStartRef.current - taPausedRef.current) / 1000);
      const recordable = finalMiss < TA_MISS_LIMIT;
      const isNewBest = recordable && (taBest === null || sec < taBest);
      if (isNewBest) { setTaBest(sec); writeBest(BEST_KEY, sec); }
      setTaResult({
        phase: "main", sec, miss: finalMiss, missedQs: finalMissedQs,
        isNewBest, recordable,
      });
    } else {
      setTaResult({ phase: "review", miss: finalMiss, missedQs: finalMissedQs });
    }
    setTaScreen("result");
  }, [taPhase, taBest]);

  // 自動判定：電荷がつり合った瞬間に正誤をチェック
  // 正解時は、組み上がったブロック・組成式・物質名を TA_CELEB_MS の間表示する。
  // その間タイムは停止し、操作は受け付けない（学習のための確認時間）。
  useEffect(() => {
    if (mode !== "ta" || taScreen !== "run" || taCelebRef.current) return;
    const q = taQs[taIndex];
    if (!q) return;

    if (!balanced) {
      taWrongFlagRef.current = false; // つり合いが崩れたら誤答フラグを解除
      return;
    }

    const speciesOk = cat.id === q.c && an.id === q.a;
    if (speciesOk && simplest) {
      // 正解：演出開始（タイム停止・操作ロック）
      taCelebRef.current = true;
      taCelebStartRef.current = performance.now();
      const runId = taRunIdRef.current;
      const missedNow = taMissedThisQRef.current;
      if (missedNow) {
        taMissedQsRef.current = [...taMissedQsRef.current, q];
        setTaMissedQs(taMissedQsRef.current);
      }
      taMissedThisQRef.current = false;
      taWrongFlagRef.current = false;

      const fParts = buildFormulaParts(cat, an, catCount, anCount);
      setTaOverlay({
        parts: fParts,
        name: compoundName(cat, an),
        fact: FACTS[formulaToString(fParts)] || null,
      });
      setTimeout(() => {
        if (taRunIdRef.current !== runId) return; // 中断・再開後は何もしない
        // 演出に使った時間を計測から除外する
        if (taCelebStartRef.current != null) {
          taPausedRef.current += performance.now() - taCelebStartRef.current;
          taCelebStartRef.current = null;
        }
        taCelebRef.current = false;
        setTaOverlay(null);
        clearAll();
        if (taIndex + 1 >= taQs.length) {
          finishTa(taMissedQsRef.current, taMissRef.current);
        } else {
          setTaIndex((i) => i + 1);
        }
      }, TA_CELEB_MS);
    } else if (!taWrongFlagRef.current) {
      // つり合ったが誤り（イオン違い／最簡比でない）→ ミスとして1回カウント
      taWrongFlagRef.current = true;
      taMissedThisQRef.current = true;
      taMissRef.current += 1;
      setTaMiss(taMissRef.current);
    }
  }, [balanced, simplest, catId, anId, catCount, anCount, mode, taScreen, taIndex, taQs]); // eslint-disable-line

  const quitTa = () => {
    taRunIdRef.current += 1;
    taCelebRef.current = false;
    taCelebStartRef.current = null;
    setTaOverlay(null);
    setTaScreen("home");
    clearAll();
  };

  /* ---------- 電荷クイズ ---------- */
  const startCharge = (phase = "main", questions = null) => {
    setChPhase(phase);
    setChQs(questions || shuffle(ELEMENTS));
    setChIndex(0);
    setChMiss(0);
    setChMissed([]);
    setChElapsed(0);
    setChOverlay(null);
    setChWrong(false);
    chMissRef.current = 0;
    chMissedRef.current = [];
    chMissedThisQRef.current = false;
    chCelebRef.current = false;
    chCelebStartRef.current = null;
    chRunIdRef.current += 1;
    chStartRef.current = null;
    chPausedRef.current = 0;
    setChCountdown(0);
    setChScreen("countdown");
  };

  // カウントダウン（3・2・1・スタート）
  useEffect(() => {
    if (chScreen !== "countdown") return;
    let cancelled = false;
    const tick = (i) => {
      if (cancelled) return;
      setChCountdown(i);
      if (i >= 3) {
        setTimeout(() => {
          if (cancelled) return;
          chStartRef.current = performance.now();
          setChScreen("run");
        }, 700);
        return;
      }
      setTimeout(() => tick(i + 1), 900);
    };
    tick(0);
    return () => { cancelled = true; };
  }, [chScreen]);

  // 経過時間の表示更新（演出中はタイム停止）
  useEffect(() => {
    if (chScreen !== "run" || chPhase !== "main") return;
    const iv = setInterval(() => {
      if (chStartRef.current == null) return;
      const celebExtra = chCelebStartRef.current != null
        ? performance.now() - chCelebStartRef.current : 0;
      setChElapsed(Math.max(0,
        (performance.now() - chStartRef.current - chPausedRef.current - celebExtra) / 1000));
    }, 100);
    return () => clearInterval(iv);
  }, [chScreen, chPhase]);

  const finishCharge = useCallback(() => {
    if (chPhase === "main") {
      const sec = Math.max(0,
        (performance.now() - chStartRef.current - chPausedRef.current) / 1000);
      const recordable = chMissRef.current < CHARGE_MISS_LIMIT;
      const isNewBest = recordable && (chBest === null || sec < chBest);
      if (isNewBest) { setChBest(sec); writeBest(CHARGE_BEST_KEY, sec); }
      setChResult({
        phase: "main", sec, miss: chMissRef.current, missed: chMissedRef.current,
        isNewBest, recordable,
      });
    } else {
      setChResult({ phase: "review", miss: chMissRef.current, missed: chMissedRef.current });
    }
    setChScreen("result");
  }, [chPhase, chBest]);

  const answerCharge = (code) => {
    if (chScreen !== "run" || chCelebRef.current) return;
    const el = chQs[chIndex];
    if (!el) return;
    if (code === el.ans) {
      // 正解：演出開始（タイム停止・操作ロック）
      chCelebRef.current = true;
      chCelebStartRef.current = performance.now();
      const runId = chRunIdRef.current;
      if (chMissedThisQRef.current) {
        chMissedRef.current = [...chMissedRef.current, el];
        setChMissed(chMissedRef.current);
      }
      chMissedThisQRef.current = false;
      setChWrong(false);
      setChOverlay(el);
      setTimeout(() => {
        if (chRunIdRef.current !== runId) return; // 中断・再開後は何もしない
        if (chCelebStartRef.current != null) {
          chPausedRef.current += performance.now() - chCelebStartRef.current;
          chCelebStartRef.current = null;
        }
        chCelebRef.current = false;
        setChOverlay(null);
        if (chIndex + 1 >= chQs.length) {
          finishCharge();
        } else {
          setChIndex((i) => i + 1);
        }
      }, CHARGE_CELEB_MS);
    } else {
      // 誤答：ミスとして数え、同じ元素に再挑戦
      chMissRef.current += 1;
      setChMiss(chMissRef.current);
      chMissedThisQRef.current = true;
      setChWrong(true);
    }
  };

  const quitCharge = () => {
    chRunIdRef.current += 1;
    chCelebRef.current = false;
    chCelebStartRef.current = null;
    setChOverlay(null);
    setChScreen("home");
  };

  // タブ切り替え
  const switchMode = (m) => {
    setMode(m);
    setQuizResult(null);
    clearAll();
    if (m !== "ta" && (taScreen === "run" || taScreen === "countdown")) {
      taRunIdRef.current += 1;
      taCelebRef.current = false;
      taCelebStartRef.current = null;
      setTaOverlay(null);
      setTaScreen("home");
    }
    if (m !== "charge" && (chScreen === "run" || chScreen === "countdown")) {
      quitCharge();
    }
    if (m === "quiz" && !quizQ) nextQuiz();
  };

  const targetName = quizQ ? compoundName(findCat(quizQ.c), findAn(quizQ.a)) : "";
  const taQ = taQs[taIndex];
  const taTargetName = taQ ? compoundName(findCat(taQ.c), findAn(taQ.a)) : "";

  /* ---------- 結果カード（自由制作・練習で表示） ---------- */
  const resultCard = balanced && cat && an && (
    <div key={successKey} style={{
      background: "rgba(252,211,77,0.10)",
      border: "1.5px solid rgba(252,211,77,0.45)", borderRadius: 18, padding: "18px 16px",
      textAlign: "center", animation: "pop 0.45s cubic-bezier(0.2,1.6,0.4,1)",
    }}>
      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#FBBF24", letterSpacing: 2 }}>
        結合成功 ── 電荷の合計が 0 になりました
      </div>
      {simplest ? (
        <>
          <div style={{ margin: "6px 0 2px", color: C.ink }}>
            <FormulaDisplay parts={buildFormulaParts(cat, an, catCount, anCount)} size="2.4rem" />
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 800, color: C.ink }}>
            {compoundName(cat, an)}
          </div>
          {FACTS[formulaToString(buildFormulaParts(cat, an, catCount, anCount))] && (
            <div style={{
              marginTop: 10, fontSize: "0.85rem", color: "#FDE68A",
              background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 10px",
            }}>
              {FACTS[formulaToString(buildFormulaParts(cat, an, catCount, anCount))]}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ marginTop: 6, fontSize: "0.95rem", fontWeight: 700, color: "#FCD34D" }}>
            電荷はつり合っていますが、組成式は<u>最も簡単な整数比</u>で表します。
          </div>
          <div style={{ marginTop: 6, color: C.ink, fontSize: "0.95rem" }}>
            {catCount}：{anCount} → <b>{catCount / g}：{anCount / g}</b> とすると
            <span style={{ marginLeft: 8 }}>
              <FormulaDisplay parts={buildFormulaParts(cat, an, catCount / g, anCount / g)} size="1.5rem" />
            </span>
          </div>
          <button onClick={() => { setCatCount(catCount / g); setAnCount(anCount / g); }}
            style={{ ...btn(C.gold, "#422006"), marginTop: 10 }}>
            最も簡単な比にする
          </button>
        </>
      )}
    </div>
  );

  /* ---------- 組み立てスペース ---------- */
  const workspace = (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: C.ink }}>組み立てスペース</div>
        <button onClick={() => { if (!taInputLocked()) clearAll(); }} style={{ ...btn("rgba(255,255,255,0.10)", C.ink), padding: "5px 12px", fontSize: "0.8rem", boxShadow: "none" }}>
          すべて取り外す
        </button>
      </div>

      <div style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ minWidth: Math.max(plusTotal, minusTotal, 3) * UNIT + 20, paddingTop: 2 }}>
          <div style={{ display: "flex", gap: 3, height: 52, marginBottom: STUD_H + 2, alignItems: "flex-start" }}>
            {cat && Array.from({ length: catCount }).map((_, i) => (
              <CationBlock key={i} ion={cat} onClick={removeCat} />
            ))}
            {!cat && (
              <div style={{ height: 52, display: "flex", alignItems: "center", color: "rgba(241,245,249,0.5)", fontSize: "0.82rem" }}>
                陽イオン（赤）のブロックを選んでください
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 3, height: 52, alignItems: "flex-start" }}>
            {an && Array.from({ length: anCount }).map((_, i) => (
              <AnionBlock key={i} ion={an} onClick={removeAn} />
            ))}
            {!an && (
              <div style={{ height: 52, display: "flex", alignItems: "center", color: "rgba(241,245,249,0.5)", fontSize: "0.82rem" }}>
                陰イオン（青）のブロックを選んでください
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 電荷バランスメーター */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700 }}>
          <span style={{ color: C.plus }}>＋の合計：{plusTotal}</span>
          <span style={{ color: balanced ? C.green : "rgba(241,245,249,0.55)", fontWeight: 800 }}>
            {plusTotal === 0 && minusTotal === 0 ? "ブロックを置いてください"
              : balanced ? "✓ つり合いました"
              : plusTotal > minusTotal ? `あと −${plusTotal - minusTotal} 必要`
              : `あと ＋${minusTotal - plusTotal} 必要`}
          </span>
          <span style={{ color: C.minus }}>−の合計：{minusTotal}</span>
        </div>
        <div style={{ display: "flex", height: 10, borderRadius: 6, overflow: "hidden", marginTop: 4, background: "rgba(255,255,255,0.12)" }}>
          <div style={{ width: "50%", display: "flex", justifyContent: "flex-end" }}>
            <div style={{
              width: `${Math.min(100, plusTotal * 16)}%`, height: "100%", background: C.plus,
              transition: "width 0.25s", borderRadius: "6px 0 0 6px",
            }} />
          </div>
          <div style={{ width: 2, background: balanced ? C.green : "rgba(255,255,255,0.30)" }} />
          <div style={{ width: "50%", display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              width: `${Math.min(100, minusTotal * 16)}%`, height: "100%", background: C.minus,
              transition: "width 0.25s", borderRadius: "0 6px 6px 0",
            }} />
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------- イオン選択パレット（モジュールレベルの Palette を使用） ---------- */
  const palette = <Palette onPickCat={addCat} onPickAn={addAn} />;

  /* ---------- イオン一覧 ---------- */
  const listView = (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={cardStyle}>
        <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8 }}>物質名のつくり方</div>
        <div style={{ fontSize: "0.9rem", color: "rgba(241,245,249,0.82)", lineHeight: 1.8 }}>
          イオンからなる物質の名前は、<b style={{ color: C.minus }}>陰イオンの名前</b>（「〜物イオン」「〜イオン」を除いた部分）のあとに
          <b style={{ color: C.plus }}>陽イオンの名前</b>（「イオン」を除いた部分）をつなげて表します。
          <div style={{ marginTop: 8, background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "8px 12px", fontSize: "0.88rem" }}>
            例）<span style={{ color: C.minus, fontWeight: 700 }}>塩化物イオン</span> ＋ <span style={{ color: C.plus, fontWeight: 700 }}>ナトリウムイオン</span>
            　→　<span style={{ color: C.minus, fontWeight: 700 }}>塩化</span><span style={{ color: C.plus, fontWeight: 700 }}>ナトリウム</span>（NaCl）
          </div>
          <div style={{ marginTop: 8, fontSize: "0.82rem", color: "rgba(241,245,249,0.5)" }}>
            ※ 組成式は「陽イオン → 陰イオン」の順、物質名は「陰イオン → 陽イオン」の順。語順が逆になる点に注意。
          </div>
        </div>
      </div>

      <div className="list-grid">
        {[{ title: "陽イオン（＋）", list: CATIONS, isCat: true }, { title: "陰イオン（−）", list: ANIONS, isCat: false }].map(({ title, list, isCat }) => (
          <div key={title} style={cardStyle}>
            <div style={{ fontWeight: 800, color: isCat ? C.plus : C.minus, marginBottom: 10 }}>{title}</div>
            <div style={{ display: "grid", gap: 6 }}>
              {list.map((ion) => (
                <div key={ion.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                  background: "rgba(255,255,255,0.06)", borderRadius: 10,
                }}>
                  <span style={{
                    width: 8 + Math.abs(ion.charge) * 14, height: 18, background: ion.color,
                    borderRadius: 4, flexShrink: 0,
                  }} />
                  <span style={{ minWidth: 64, color: C.ink }}>
                    <IonFormula ion={ion} size="1rem" />
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "rgba(241,245,249,0.82)", fontWeight: 700 }}>
                    {ion.ionName}
                  </span>
                  <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "rgba(241,245,249,0.55)", fontWeight: 700 }}>
                    {Math.abs(ion.charge)}価
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  /* ---------- タイムアタックパネル ---------- */
  const taPanel = (
    <div style={cardStyle}>
      {taScreen === "home" && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: C.ink }}>タイムアタック</div>
          <div style={{ fontSize: "0.88rem", color: "rgba(241,245,249,0.78)", margin: "10px 0 14px", lineHeight: 1.9, textAlign: "left", maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>
            ・全 <b>{TA_TOTAL} 問</b>（★1×{TA_SET.lv1}、★2×{TA_SET.lv2}、★3×{TA_SET.lv3}）が<b>ランダムな順</b>で出題されます。組み立て終わるまでの<b>タイム</b>を競います。<br />
            ・電荷がつり合った瞬間に自動で判定。誤りはミスとして数え、正解するまで同じ問題に挑戦します。<br />
            ・正解すると、完成したブロック・組成式・物質名がしばらく表示されます。<b>この間タイムは停止します</b>。<br />
            ・タイムに応じて <b>SS／S／A／B／C</b> のグレードを判定。ミスが {TA_MISS_LIMIT} 回以上の場合、記録は残りません。<br />
            ・ミスした物質は、終了後にまとめて復習できます。
          </div>
          {taBest !== null && (
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#FBBF24", marginBottom: 10 }}>
              ベスト記録：{formatSeconds(taBest)}（グレード {gradeForSeconds(taBest).grade}）
            </div>
          )}
          <button onClick={() => startTa("main")} style={{ ...btn(C.green, "#022C22"), fontSize: "1.05rem", padding: "12px 32px" }}>
            開始する
          </button>
        </div>
      )}

      {taScreen === "countdown" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(241,245,249,0.55)" }}>
            {taPhase === "review" ? "復習を始めます" : "始めます"}
          </div>
          <div key={countdownStep} style={{
            fontSize: "4rem", fontWeight: 800, color: C.ink,
            fontFamily: "'Lexend', sans-serif", animation: "pop 0.4s",
          }}>
            {["3", "2", "1", "スタート!"][countdownStep]}
          </div>
          <button onClick={quitTa} style={{ ...btn("rgba(255,255,255,0.10)", C.ink), marginTop: 8, fontSize: "0.85rem" }}>
            もどる
          </button>
        </div>
      )}

      {taScreen === "run" && taQ && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: C.ink }}>
              {taIndex + 1}<span style={{ color: "rgba(241,245,249,0.55)" }}> / {taQs.length}</span>
              <span style={{ marginLeft: 10, color: taMiss > 0 ? "#FDA4AF" : "rgba(241,245,249,0.55)" }}>ミス {taMiss}</span>
            </span>
            {taPhase === "main" && (
              <span style={{
                marginLeft: "auto", fontFamily: "'Lexend', sans-serif",
                fontWeight: 700, fontSize: "1.3rem", color: C.ink,
              }}>
                {taElapsed.toFixed(1)}<span style={{ fontSize: "0.75rem" }}> 秒</span>
              </span>
            )}
            <button onClick={quitTa} style={{ ...btn("rgba(255,255,255,0.10)", C.ink), padding: "5px 12px", fontSize: "0.78rem", boxShadow: "none", marginLeft: taPhase === "main" ? 0 : "auto" }}>
              中断
            </button>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.12)", borderRadius: 5, overflow: "hidden", marginBottom: 10 }}>
            <div style={{
              width: `${((taIndex) / taQs.length) * 100}%`, height: "100%",
              background: C.green, transition: "width 0.3s",
            }} />
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "rgba(241,245,249,0.55)", fontWeight: 700 }}>
              （★{taQ.lv}）次の物質をブロックで組み立てよ
            </div>
            <div style={{ fontSize: "1.55rem", fontWeight: 800, color: C.ink, margin: "2px 0 4px" }}>
              「{taTargetName}」
            </div>
          </div>
          {balanced && !taOverlay && (cat.id !== taQ.c || an.id !== taQ.a) && (
            <div style={{ textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "#FDA4AF" }}>
              不正解 ── イオンの種類が異なります。もう一度。
            </div>
          )}
          {balanced && !taOverlay && cat.id === taQ.c && an.id === taQ.a && !simplest && (
            <div style={{ textAlign: "center", fontSize: "0.85rem", fontWeight: 700, color: "#FCD34D" }}>
              最も簡単な整数比にしましょう。余分なブロックを取り外してください。
            </div>
          )}
          {taOverlay && (
            <div style={{
              textAlign: "center", background: "rgba(52,211,153,0.15)",
              border: "1px solid rgba(52,211,153,0.4)", borderRadius: 12,
              padding: "10px 12px", animation: "pop 0.3s", marginTop: 4,
            }}>
              <div style={{ fontWeight: 800, color: "#6EE7B7", fontSize: "0.85rem" }}>
                正解！
                <span style={{ fontWeight: 700, color: "rgba(241,245,249,0.55)", marginLeft: 8 }}>
                  （タイム停止中）
                </span>
              </div>
              <div style={{ margin: "3px 0" }}>
                <FormulaDisplay parts={taOverlay.parts} size="1.7rem" />
                <span style={{ fontWeight: 800, color: C.ink, marginLeft: 10, fontSize: "1.1rem" }}>
                  {taOverlay.name}
                </span>
              </div>
              {taOverlay.fact && (
                <div style={{ fontSize: "0.8rem", color: "rgba(241,245,249,0.7)" }}>
                  {taOverlay.fact}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {taScreen === "result" && taResult && (
        <div style={{ textAlign: "center", padding: "6px 0" }}>
          {taResult.phase === "main" ? (
            <>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "rgba(241,245,249,0.55)" }}>結果</div>
              <div style={{
                fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: "2.6rem", color: C.ink,
              }}>
                {taResult.sec.toFixed(1)} <span style={{ fontSize: "1rem" }}>秒</span>
              </div>
              {(() => {
                const gr = gradeForSeconds(taResult.sec);
                return (
                  <div style={{ margin: "4px 0 8px" }}>
                    <span style={{
                      display: "inline-block", background: C.gold, color: "#422006",
                      borderRadius: 10, padding: "4px 16px", fontWeight: 800, fontSize: "1.3rem",
                      fontFamily: "'Lexend', sans-serif",
                    }}>
                      {gr.grade}
                    </span>
                    <div style={{ fontWeight: 800, color: C.ink, marginTop: 6 }}>{gr.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(241,245,249,0.78)", marginTop: 2 }}>{gr.comment}</div>
                  </div>
                );
              })()}
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgba(241,245,249,0.78)" }}>
                ミス：{taResult.miss} 回
                {taResult.isNewBest && (
                  <span style={{ color: "#FBBF24", marginLeft: 10 }}>ベスト更新！</span>
                )}
              </div>
              {!taResult.recordable && (
                <div style={{ fontSize: "0.8rem", color: "#FDA4AF", fontWeight: 700, marginTop: 4 }}>
                  ミスが多いため、今回のタイムは記録されませんでした。
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: C.ink }}>復習終了</div>
              <div style={{ fontSize: "0.88rem", color: "rgba(241,245,249,0.78)", marginTop: 4 }}>
                復習中のミス：{taResult.miss} 回
              </div>
            </>
          )}

          {taResult.missedQs.length > 0 && (
            <div style={{
              marginTop: 12, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "10px 12px",
              textAlign: "left",
            }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: C.ink, marginBottom: 6 }}>
                ミスした物質（確認しておきましょう）
              </div>
              {taResult.missedQs.map((q, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "3px 0", fontSize: "0.9rem" }}>
                  <span style={{ fontWeight: 700, color: C.ink }}>
                    {compoundName(findCat(q.c), findAn(q.a))}
                  </span>
                  <span style={{ color: "rgba(241,245,249,0.78)" }}>
                    <FormulaDisplay parts={answerParts(q)} size="1rem" />
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            {taResult.phase === "main" && taResult.missedQs.length > 0 && (
              <button onClick={() => startTa("review", shuffle(taResult.missedQs))} style={btn(C.gold, "#422006")}>
                ミスした物質を復習する
              </button>
            )}
            <button onClick={() => startTa("main")} style={btn(C.green, "#022C22")}>
              もう一度挑戦する
            </button>
            <button onClick={quitTa} style={btn("rgba(255,255,255,0.10)", C.ink)}>
              もどる
            </button>
          </div>
        </div>
      )}
    </div>
  );

  /* ---------- 電荷クイズパネル ---------- */
  const chQ = chQs[chIndex];
  const chargePanel = (
    <div style={{ ...cardStyle, maxWidth: 760, margin: "0 auto" }}>
      {chScreen === "home" && (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ fontWeight: 800, fontSize: "1.1rem", color: C.ink }}>電荷クイズ ── 単原子イオンの電荷</div>
          <div style={{ fontSize: "0.88rem", color: "rgba(241,245,249,0.78)", margin: "10px 0 14px", lineHeight: 1.9, textAlign: "left", maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
            ・原子番号 <b>1〜20</b> の元素記号が<b>ランダムな順に1回ずつ</b>表示されます。その元素の単原子イオンの電荷を選んでください。<br />
            ・全 {CHARGE_TOTAL} 問を答え終わるまでの<b>タイム</b>を競います。誤りはミスとして数え、正解するまで同じ元素に挑戦します。<br />
            ・単原子イオンになりやすく中高でよく登場する元素と、貴ガスとが出題されます。<br />
            ・正解すると、イオンの化学式と名前がしばらく表示されます。<b>この間タイムは停止します</b>。<br />
            ・タイムに応じて <b>SS／S／A／B／C</b> のグレードを判定。ミスが {CHARGE_MISS_LIMIT} 回以上の場合、記録は残りません。<br />
            ・ミスした元素は、終了後にまとめて復習できます。
          </div>
          {chBest !== null && (
            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#FBBF24", marginBottom: 10 }}>
              ベスト記録：{formatSeconds(chBest)}（グレード {gradeForChargeSeconds(chBest).grade}）
            </div>
          )}
          <button onClick={() => startCharge("main")} style={{ ...btn(C.green, "#022C22"), fontSize: "1.05rem", padding: "12px 32px" }}>
            開始する
          </button>
        </div>
      )}

      {chScreen === "countdown" && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "rgba(241,245,249,0.55)" }}>
            {chPhase === "review" ? "復習を始めます" : "始めます"}
          </div>
          <div key={chCountdown} style={{
            fontSize: "4rem", fontWeight: 800, color: C.ink,
            fontFamily: "'Lexend', sans-serif", animation: "pop 0.4s",
          }}>
            {["3", "2", "1", "スタート!"][chCountdown]}
          </div>
          <button onClick={quitCharge} style={{ ...btn("rgba(255,255,255,0.10)", C.ink), marginTop: 8, fontSize: "0.85rem" }}>
            もどる
          </button>
        </div>
      )}

      {chScreen === "run" && chQ && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: C.ink }}>
              {chIndex + 1}<span style={{ color: "rgba(241,245,249,0.55)" }}> / {chQs.length}</span>
              <span style={{ marginLeft: 10, color: chMiss > 0 ? "#FDA4AF" : "rgba(241,245,249,0.55)" }}>ミス {chMiss}</span>
            </span>
            {chPhase === "main" && (
              <span style={{
                marginLeft: "auto", fontFamily: "'Lexend', sans-serif",
                fontWeight: 700, fontSize: "1.3rem", color: C.ink,
              }}>
                {chElapsed.toFixed(1)}<span style={{ fontSize: "0.75rem" }}> 秒</span>
              </span>
            )}
            <button onClick={quitCharge} style={{ ...btn("rgba(255,255,255,0.10)", C.ink), padding: "5px 12px", fontSize: "0.78rem", boxShadow: "none", marginLeft: chPhase === "main" ? 0 : "auto" }}>
              中断
            </button>
          </div>
          <div style={{ height: 8, background: "rgba(255,255,255,0.12)", borderRadius: 5, overflow: "hidden", marginBottom: 12 }}>
            <div style={{
              width: `${(chIndex / chQs.length) * 100}%`, height: "100%",
              background: C.green, transition: "width 0.3s",
            }} />
          </div>

          {/* 周期表タイル風の出題表示 */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "0.78rem", color: "rgba(241,245,249,0.55)", fontWeight: 700, marginBottom: 6 }}>
              この元素の単原子イオンの電荷は？
            </div>
            <div style={{
              display: "inline-block", border: "2px solid rgba(255,255,255,0.25)",
              borderRadius: 14, padding: "8px 22px 12px", minWidth: 116,
              background: "rgba(255,255,255,0.04)", textAlign: "left",
            }}>
              <div style={{ fontSize: "0.75rem", color: "rgba(241,245,249,0.55)", fontWeight: 700, fontFamily: "'Lexend', sans-serif" }}>
                {chQ.z}
              </div>
              <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: "3rem", lineHeight: 1.05, color: C.ink, textAlign: "center" }}>
                {chQ.sym}
              </div>
            </div>
          </div>

          {/* 解答ボタン（1行） */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14, overflowX: "auto", padding: "2px 0" }}>
            {CHARGE_CHOICES.map(([code, label]) => (
              <button key={code} onClick={() => answerCharge(code)} style={{
                ...btn("rgba(255,255,255,0.10)", C.ink),
                border: `1px solid ${C.border}`,
                flex: code === "none" ? "2.2 1 0" : "1 1 0",
                minWidth: code === "none" ? 118 : 50,
                padding: "13px 2px",
                fontSize: code === "none" ? "0.78rem" : "1.02rem",
                fontFamily: code === "none" ? "inherit" : "'Lexend', sans-serif",
                opacity: chCelebRef.current ? 0.55 : 1,
              }}>
                {label}
              </button>
            ))}
          </div>

          {chWrong && !chOverlay && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: "0.88rem", fontWeight: 700, color: "#FDA4AF" }}>
              不正解 ── もう一度。
            </div>
          )}
          {chOverlay && (
            <div style={{
              textAlign: "center", background: "rgba(52,211,153,0.15)",
              border: "1px solid rgba(52,211,153,0.4)", borderRadius: 12,
              padding: "10px 12px", animation: "pop 0.3s", marginTop: 10,
            }}>
              <div style={{ fontWeight: 800, color: "#6EE7B7", fontSize: "0.85rem" }}>
                正解！
                <span style={{ fontWeight: 700, color: "rgba(241,245,249,0.55)", marginLeft: 8 }}>
                  （タイム停止中）
                </span>
              </div>
              {chOverlay.ans === "none" ? (
                <div style={{ margin: "3px 0", fontWeight: 800, color: C.ink, fontSize: "1.05rem" }}>
                  {chOverlay.sym}（{chOverlay.name}）はイオンになりにくい
                </div>
              ) : (
                <div style={{ margin: "3px 0" }}>
                  <ChargeIon sym={chOverlay.sym} ans={chOverlay.ans} size="1.7rem" />
                  <span style={{ fontWeight: 800, color: C.ink, marginLeft: 10, fontSize: "1.1rem" }}>
                    {chOverlay.ionName}
                  </span>
                </div>
              )}
              {chOverlay.note && (
                <div style={{ fontSize: "0.8rem", color: "rgba(241,245,249,0.7)" }}>{chOverlay.note}</div>
              )}
            </div>
          )}
        </div>
      )}

      {chScreen === "result" && chResult && (
        <div style={{ textAlign: "center", padding: "6px 0" }}>
          {chResult.phase === "main" ? (
            <>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "rgba(241,245,249,0.55)" }}>結果</div>
              <div style={{ fontFamily: "'Lexend', sans-serif", fontWeight: 700, fontSize: "2.6rem", color: C.ink }}>
                {chResult.sec.toFixed(1)} <span style={{ fontSize: "1rem" }}>秒</span>
              </div>
              {(() => {
                const gr = gradeForChargeSeconds(chResult.sec);
                return (
                  <div style={{ margin: "4px 0 8px" }}>
                    <span style={{
                      display: "inline-block", background: C.gold, color: "#422006",
                      borderRadius: 10, padding: "4px 16px", fontWeight: 800, fontSize: "1.3rem",
                      fontFamily: "'Lexend', sans-serif",
                    }}>
                      {gr.grade}
                    </span>
                    <div style={{ fontWeight: 800, color: C.ink, marginTop: 6 }}>{gr.title}</div>
                    <div style={{ fontSize: "0.85rem", color: "rgba(241,245,249,0.78)", marginTop: 2 }}>{gr.comment}</div>
                  </div>
                );
              })()}
              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "rgba(241,245,249,0.78)" }}>
                ミス：{chResult.miss} 回
                {chResult.isNewBest && (
                  <span style={{ color: "#FBBF24", marginLeft: 10 }}>ベスト更新！</span>
                )}
              </div>
              {!chResult.recordable && (
                <div style={{ fontSize: "0.8rem", color: "#FDA4AF", fontWeight: 700, marginTop: 4 }}>
                  ミスが多いため、今回のタイムは記録されませんでした。
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800, fontSize: "1.05rem", color: C.ink }}>復習終了</div>
              <div style={{ fontSize: "0.88rem", color: "rgba(241,245,249,0.78)", marginTop: 4 }}>
                復習中のミス：{chResult.miss} 回
              </div>
            </>
          )}

          {chResult.missed.length > 0 && (
            <div style={{
              marginTop: 12, background: "rgba(255,255,255,0.06)", borderRadius: 12,
              padding: "10px 12px", textAlign: "left",
            }}>
              <div style={{ fontSize: "0.82rem", fontWeight: 800, color: C.ink, marginBottom: 6 }}>
                ミスした元素（確認しておきましょう）
              </div>
              {chResult.missed.map((el, i) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 10, padding: "3px 0", fontSize: "0.9rem" }}>
                  <span style={{ fontWeight: 700, color: C.ink, fontFamily: "'Lexend', sans-serif", minWidth: 34 }}>
                    {el.sym}
                  </span>
                  <span style={{ color: "rgba(241,245,249,0.78)" }}>
                    {el.ans === "none"
                      ? `${el.name}：イオンになりにくい`
                      : <>{el.name}：<ChargeIon sym={el.sym} ans={el.ans} size="1rem" />（{el.ionName}）</>}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
            {chResult.phase === "main" && chResult.missed.length > 0 && (
              <button onClick={() => startCharge("review", shuffle(chResult.missed))} style={btn(C.gold, "#422006")}>
                ミスした元素を復習する
              </button>
            )}
            <button onClick={() => startCharge("main")} style={btn(C.green, "#022C22")}>
              もう一度挑戦する
            </button>
            <button onClick={quitCharge} style={btn("rgba(255,255,255,0.10)", C.ink)}>
              もどる
            </button>
          </div>
        </div>
      )}
    </div>
  );

  /* ---------- 練習パネル ---------- */
  const quizPanel = (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontWeight: 800, fontSize: "0.85rem" }}>レベル：</span>
        {[1, 2, 3].map((lv) => (
          <button key={lv} onClick={() => { setQuizLv(lv); nextQuiz(lv); }} style={{
            border: "none", borderRadius: 10, padding: "6px 12px", fontFamily: "inherit",
            fontWeight: 800, fontSize: "0.82rem", cursor: "pointer",
            background: quizLv === lv ? C.gold : "rgba(255,255,255,0.08)",
            color: quizLv === lv ? "#422006" : "rgba(241,245,249,0.55)",
          }}>
            {"★".repeat(lv)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", fontWeight: 800, color: "rgba(241,245,249,0.55)" }}>
          {quizScore} 点 {streak >= 2 && <span style={{ color: "#FB923C" }}>{streak}連続正解</span>}
        </span>
      </div>
      {quizQ && (
        <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
          <div style={{ fontSize: "0.8rem", color: "rgba(241,245,249,0.55)", fontWeight: 700 }}>次の物質をブロックで組み立てよ</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: C.ink, margin: "2px 0 8px" }}>
            「{targetName}」
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={checkQuiz} style={btn(C.green, "#022C22")}>判定する</button>
            <button onClick={() => nextQuiz()} style={btn("rgba(255,255,255,0.10)", C.ink)}>パスして次へ</button>
          </div>
        </div>
      )}
      {quizResult && (
        <div style={{
          marginTop: 12, padding: "10px 12px", borderRadius: 12, fontWeight: 700,
          fontSize: "0.9rem", animation: "slideup 0.3s",
          background: quizResult.ok ? "rgba(52,211,153,0.15)" : "rgba(244,63,94,0.15)",
          color: quizResult.ok ? "#6EE7B7" : "#FDA4AF",
        }}>
          {quizResult.msg}
          {quizResult.ok && (
            <div style={{ marginTop: 8, textAlign: "center" }}>
              <button onClick={() => nextQuiz()} style={btn(C.green, "#022C22")}>次の問題へ</button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  /* ---------- レイアウト ---------- */
  const showWorkspace =
    mode === "build" || mode === "quiz" || (mode === "ta" && taScreen === "run");

  const leftColumn = (
    <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
      {mode === "quiz" && quizPanel}
      {mode === "ta" && taPanel}
      {showWorkspace && workspace}
      {mode === "build" && resultCard}
      {mode === "quiz" && quizResult && quizResult.ok && resultCard}
      {mode === "build" && (
        <div style={{
          background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
          borderRadius: 14, padding: "10px 14px",
          fontSize: "0.8rem", color: "rgba(241,245,249,0.78)", lineHeight: 1.7,
        }}>
          <b>使い方</b>：イオンの一覧からブロックを選んで置きます（同じイオンを選ぶと個数が増えます）。
          置いたブロックをタップすると取り外せます。赤と青のブロックの<b>幅がそろう</b>と＋と−の電気がつり合い、
          組成式と物質名が表示されます。
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh", colorScheme: "dark",
      background: "linear-gradient(180deg, #020617 0%, #03201D 55%, #052E2B 100%)",
      color: C.ink,
      fontFamily: "'M PLUS Rounded 1c', 'Hiragino Maru Gothic ProN', 'BIZ UDPGothic', sans-serif",
      paddingBottom: 60,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@500;700;800&family=Lexend:wght@600;700&display=swap');
        @keyframes pop { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes slideup { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        button:active { transform: translateY(1px); }
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        .layout { display: grid; gap: 14px; align-items: start; }
        .list-grid { display: grid; gap: 14px; }
        /* iPad 横画面を主対象：2カラム配置（左＝出題・組み立て、右＝イオン選択） */
        @media (min-width: 880px) {
          .layout { grid-template-columns: minmax(0, 11fr) minmax(0, 9fr); }
          .layout > .right { position: sticky; top: 12px; }
          .list-grid { grid-template-columns: 1fr 1fr; align-items: start; }
        }
      `}</style>

      {/* ヘッダー */}
      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "14px 16px 12px",
      }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, letterSpacing: 1, color: C.ink, display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 12, height: 12, borderRadius: 4, background: C.green, display: "inline-block", boxShadow: "0 0 12px rgba(52,211,153,0.8)" }} />
            イオンブロック・ラボ
          </h1>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            <RecordChip label="タイムアタック" best={taBest} gradeFn={gradeForSeconds} />
            <RecordChip label="電荷クイズ" best={chBest} gradeFn={gradeForChargeSeconds} />
          </div>
        </div>
      </header>

      {/* タブ */}
      <nav style={{
        maxWidth: 1180, margin: "12px auto 0", padding: "0 12px",
        display: "flex", gap: 8,
      }}>
        {[["build", "自由制作"], ["quiz", "練習"], ["ta", "タイムアタック"], ["charge", "電荷クイズ"], ["list", "イオン一覧"]].map(([m, label]) => (
          <button key={m} onClick={() => switchMode(m)}
            style={{
              flex: 1, maxWidth: 200, padding: "10px 4px", borderRadius: 12,
              fontFamily: "inherit", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer",
              background: mode === m ? "#F1F5F9" : "rgba(255,255,255,0.06)",
              color: mode === m ? "#020617" : C.ink,
              border: mode === m ? "1px solid #F1F5F9" : `1px solid ${C.border}`,
            }}>
            {label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 1180, margin: "14px auto 0", padding: "0 12px" }}>
        {mode === "list" ? (
          listView
        ) : mode === "charge" ? (
          chargePanel
        ) : (
          <div className="layout">
            {leftColumn}
            <div className="right">
              <FitToViewport>{palette}</FitToViewport>
            </div>
          </div>
        )}
      </main>

      {/* トースト */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 18, left: "50%", transform: "translateX(-50%)",
          background: "#F1F5F9", color: "#020617", borderRadius: 999, padding: "9px 18px",
          fontSize: "0.82rem", fontWeight: 700, boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
          animation: "slideup 0.25s", zIndex: 50, whiteSpace: "nowrap",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
