"use strict";

/* Clickjacking guard: a meta CSP cannot stop framing, so a framed copy of the site hides itself */
try { if (window.top !== window.self) { document.documentElement.style.display = "none"; window.top.location = window.self.location; } } catch (e) { document.documentElement.style.display = "none"; }

/* Old iPhones (before iOS 15.4) have no <dialog>.showModal(): add a simple fallback so booking still works */
(function dialogFallback() {
  if (typeof HTMLDialogElement === "function" && HTMLDialogElement.prototype.showModal) return;
  document.documentElement.classList.add("no-dialog");
  document.querySelectorAll("dialog").forEach((dlg) => {
    Object.defineProperty(dlg, "open", { get() { return dlg.hasAttribute("open"); } });
    dlg.showModal = () => dlg.setAttribute("open", "");
    dlg.close = () => { if (dlg.hasAttribute("open")) { dlg.removeAttribute("open"); dlg.dispatchEvent(new Event("close")); } };
  });
})();

/* =====================================================================
   EDITABLE CONFIGURATION: change values here, the whole page updates.
   Everything below marked SAMPLE is demonstration data, not confirmed
   by the laboratory. Replace it before launch.
   ===================================================================== */
const BUSINESS_INFO = {
  name: "Shiva Sathvika Diagnostic Lab & X-ray Imaging",
  location: "Chikkaballapur, Karnataka, India",
  hours: "Monday–Saturday, 7:00 AM–8:30 PM",
  openFrom: "07:00",
  openTo: "20:30"
};
const PHONE_NUMBER = "8217654091";
const WHATSAPP_NUMBER = "918217654091";   // Digits only with country code. Empty = disabled.
const SETTINGS = {
  reportHours: 24,                                   // SAMPLE target, confirm with lab
  collectionArea: "Within 5 km of the lab",
  collectionHours: "To be confirmed by the lab",     // REPLACE with real timings
  slotsPerDay: 50                                    // home-collection slots per day (today + tomorrow only)
};

const SINCE_YEAR = 1992;
const CATS = { H:"Haematology", U:"Urine Analysis", S:"Stool Analysis", B:"Bio-chemistry", L:"Lipid Profile", V:"Liver Function", O:"Hormones", R:"Serology", M:"Microbiology" };
const SAMPLE_BY_CAT = { H:"Blood", U:"Urine", S:"Stool", B:"Blood", L:"Blood", V:"Blood", O:"Blood", R:"Blood", M:"As named in the test" };

// Test catalogue. Row: [name, category, plain-language description, preparation (optional), sample (optional)].
// Prices are intentionally NOT stored or shown. Preparation shown is general guidance: the lab confirms for your case.
const TEST_ROWS = [
  ["HB%","H","Measures haemoglobin, the part of red blood cells that carries oxygen. Low levels can mean anaemia."],
  ["RBC Count","H","Counts the red blood cells that carry oxygen around your body."],
  ["WBC Count","H","Counts white blood cells, which fight infection. A high count often points to infection or inflammation."],
  ["D.C. (Differential Count)","H","Shows the share of each type of white blood cell. Helps find the cause of infection, allergy or other problems."],
  ["ESR","H","Shows how fast red cells settle in a tube of blood. A raised value is a general sign of inflammation in the body."],
  ["AEC (Absolute Eosinophil Count)","H","Counts eosinophils, white cells that rise in allergies, asthma and some worm infections."],
  ["CBC","H","Complete Blood Count: a broad check of red cells, white cells and platelets. Often the first test a doctor asks for."],
  ["PCV","H","Packed Cell Volume: the percentage of your blood made up of red cells."],
  ["MCV","H","The average size of your red blood cells. Helps tell the type of anaemia."],
  ["MCH","H","The average amount of haemoglobin in each red blood cell."],
  ["MCHC","H","How concentrated the haemoglobin is inside your red blood cells."],
  ["BT (Bleeding Time)","H","How long a tiny cut takes to stop bleeding. Checks how well platelets and blood vessels work."],
  ["CT (Clotting Time)","H","How long blood takes to clot. Checks your blood's ability to form a clot."],
  ["Platelet Count","H","Counts platelets, the cells that help blood clot. Important in dengue and bleeding problems."],
  ["PT with INR","H","Shows how quickly your blood clots. Used to monitor blood-thinner medicines and to check clotting and liver health."],
  ["Reticulocyte Count","H","Counts young red blood cells to show how well the bone marrow is making new red cells."],
  ["LE Cell Phenomenon","H","A blood smear test once used to help detect lupus (SLE), an autoimmune condition."],
  ["Peripheral Smear","H","Blood is viewed under a microscope to check the shape and look of blood cells. Helps find anaemia, infection and blood disorders."],
  ["Malarial Parasites","H","Looks for malaria parasites in a blood smear under the microscope. Malaria is a mosquito-borne fever illness."],
  ["Blood Group & Rh","H","Finds your ABO blood group and whether you are Rh positive or negative. Needed for transfusions and in pregnancy."],
  ["Dengue NS1, IgM, IgG","H","Detects the dengue virus and your body's antibodies against it. Dengue is a mosquito-borne fever with low platelets."],
  ["Pf / Pv (Malaria)","H","A rapid test for the two common malaria parasites, P. falciparum (Pf) and P. vivax (Pv). Malaria causes fever with chills."],
  ["Urine Sugar","U","Checks for sugar (glucose) in urine, which can be a sign of diabetes."],
  ["Urine Albumin","U","Checks for the protein albumin in urine. Protein in urine can point to kidney problems."],
  ["Urine Microscopy","U","Looks at urine under a microscope for pus cells, red cells, crystals and germs. Helps find urine infection and stones."],
  ["Bile Salt","U","Checks urine for bile salts, which can appear in some liver and bile duct problems."],
  ["Bile Pigment","U","Checks urine for bile pigment (bilirubin), seen in jaundice and liver disease."],
  ["Ketone Bodies","U","Checks for ketones, made when the body burns fat for energy. Important in uncontrolled diabetes, vomiting and starvation."],
  ["24 Hrs Urine Protein","U","Measures the total protein lost in urine over a full day. Used to assess kidney function.","Collect all urine for 24 hours in the container the lab gives you."],
  ["Urobilinogen","U","Checks urine for urobilinogen, which changes in liver disease and some blood disorders."],
  ["Bence Jones Protein","U","Looks for a special protein in urine linked to a bone marrow condition called multiple myeloma."],
  ["Pregnancy Test","U","Detects the pregnancy hormone (hCG) in urine.","First-morning urine gives the most reliable result."],
  ["Stool Routine","S","Examines stool for colour, mucus, blood, parasites and pus cells. Finds infections and digestive problems.","Bring a fresh sample in the container the lab gives you."],
  ["Stool Occult","S","Looks for hidden blood in stool, which can be a sign of bleeding in the digestive tract.","Bring a fresh sample in the container the lab gives you."],
  ["Stool Substances","S","Checks stool for unabsorbed substances such as sugars. Helps explain digestion problems and loose motions.","Bring a fresh sample in the container the lab gives you."],
  ["FBS (Fasting Blood Sugar)","B","Blood sugar after fasting. Used to detect and keep track of diabetes.","Fast for 8 to 10 hours. Plain water is fine."],
  ["PPBS (Post-Prandial Blood Sugar)","B","Blood sugar after a meal. Shows how well your body handles sugar.","Taken 2 hours after you start a meal."],
  ["RBS (Random Blood Sugar)","B","Blood sugar at any time of day. No fasting needed.","No fasting needed."],
  ["GTT (Glucose Tolerance Test)","B","Measures how your body clears sugar after a sugar drink. Used to diagnose diabetes, including diabetes in pregnancy.","Fast overnight (8 to 12 hours). The test takes a couple of hours at the lab."],
  ["Glycosylated Hb (HbA1c)","B","Your average blood sugar over the last 2 to 3 months. The best test to see long-term diabetes control.","No fasting needed."],
  ["Urea","B","A waste product filtered by the kidneys. High levels can mean the kidneys are not working well."],
  ["S. Creatinine","B","A muscle waste filtered by the kidneys. A key test of kidney function."],
  ["Uric Acid","B","High levels can cause gout (joint pain) and kidney stones."],
  ["RFT (Renal Function Test)","B","A group of tests, such as urea and creatinine, that show how well your kidneys are working."],
  ["S. Calcium","B","Calcium in the blood. Important for bones, nerves and muscles. Checks bone, kidney and parathyroid health."],
  ["CPK","B","An enzyme that rises when muscles or the heart are damaged."],
  ["CPK-MB","B","The heart-specific part of CPK. Rises after heart muscle injury such as a heart attack."],
  ["Amylase","B","An enzyme made by the pancreas. High levels can suggest pancreatitis (pain in the upper belly)."],
  ["Sodium","B","A salt that balances body fluids. Abnormal levels can cause weakness, cramps or confusion."],
  ["Potassium","B","A mineral vital for the heart and muscles. Too high or too low can affect heart rhythm."],
  ["Acid Phosphatase","B","An enzyme test sometimes used to check prostate conditions."],
  ["CA 125","B","A marker that can be raised in some ovarian conditions. Doctors use it along with other tests, never alone to diagnose cancer."],
  ["Lipid Profile","L","Measures cholesterol and fats in your blood to check your risk of heart disease.","Fast for 9 to 12 hours. Plain water is fine."],
  ["Total Cholesterol","L","The total amount of cholesterol in your blood. High levels raise the risk of heart disease."],
  ["Triglycerides","L","A type of fat in the blood. High levels raise the risk of heart disease and pancreatitis.","Fast for 9 to 12 hours. Plain water is fine."],
  ["HDL","L","The 'good' cholesterol that helps clear other cholesterol from your arteries. Higher is better."],
  ["LDL & VLDL","L","The 'bad' cholesterol types that build up in arteries and harm the heart. Lower is better."],
  ["Liver Function Test (LFT)","V","A group of tests (bilirubin, proteins and liver enzymes) that show how well your liver is working."],
  ["T. Bilirubin","V","Total bilirubin, a yellow pigment. High levels cause jaundice (yellow eyes and skin)."],
  ["D. Bilirubin","V","Direct bilirubin. Helps tell whether jaundice comes from the liver or the bile ducts."],
  ["T. Protein","V","Total protein in the blood (albumin and globulin). Reflects liver and kidney health and nutrition."],
  ["Albumin (Serum)","V","The main protein made by the liver. Low levels may suggest liver or kidney disease, or poor nutrition."],
  ["Globulin","V","Blood proteins that include antibodies. Changes can point to infection, liver disease or immune conditions."],
  ["A/G Ratio","V","The ratio of albumin to globulin. An unusual ratio can hint at liver, kidney or immune problems."],
  ["SGPT","V","Also called ALT. A liver enzyme that rises when liver cells are damaged."],
  ["SGOT","V","Also called AST. An enzyme from the liver, heart and muscle. Rises with liver or muscle damage."],
  ["Alkaline Phosphatase","V","An enzyme from the liver and bones. High levels may point to bile duct or bone conditions."],
  ["T3, T4, TSH","O","The thyroid profile. Shows whether your thyroid gland is underactive or overactive."],
  ["LH / FSH / Prolactin","O","Hormones that control periods, ovulation and sperm production. Checked in fertility and period problems."],
  ["Testosterone","O","The main male hormone. Also checked in women with excess hair growth or irregular periods."],
  ["TORCH","O","Screens for infections (Toxoplasma, Rubella, CMV, Herpes) that can harm an unborn baby. Often done in pregnancy or when planning one."],
  ["B-HCG","O","Measures the pregnancy hormone in blood. Confirms pregnancy earlier than a urine test."],
  ["Widal","R","A blood test used to help diagnose typhoid fever."],
  ["VDRL","R","A screening test for syphilis."],
  ["RA Factor","R","Helps diagnose rheumatoid arthritis, a cause of painful, swollen joints."],
  ["HIV","R","Screens for HIV infection."],
  ["CRP","R","C-reactive protein. Rises with infection and inflammation."],
  ["ASLO","R","Checks for a past streptococcal (throat) infection, linked to rheumatic fever."],
  ["Dilution (each)","R","Repeats a serology test at different dilutions to measure how strong the antibody level is."],
  ["HBsAg","R","Screens for Hepatitis B infection, a virus that affects the liver."],
  ["Mantoux","R","A skin test for tuberculosis (TB) exposure. A small injection is given on the forearm.","You must come back after 48 to 72 hours to have it read.","Skin test (forearm)"],
  ["Urine (Microbiology)","M","A urine culture. Grows germs from urine to find a urine infection and the antibiotic that works.","Collect a midstream sample in a sterile container from the lab.","Urine"],
  ["Faeces (Microbiology)","M","A stool culture. Finds germs causing loose motions or infection and the antibiotic that works.","Bring a fresh sample in the container the lab gives you.","Stool"],
  ["Pus (Microbiology)","M","A culture of pus from a wound or abscess to find the germ and the antibiotic that works.","","Pus"],
  ["Throat (Microbiology)","M","A culture of a throat swab to find germs causing a sore throat.","","Throat swab"],
  ["Swab (Microbiology)","M","A culture of a swab from a wound or body site to find the infecting germ.","","Swab"],
  ["Sputum (Microbiology)","M","A culture of coughed-up sputum to find germs causing a chest infection.","Rinse your mouth, then cough deeply. Early morning is best.","Sputum"],
  ["Sputum for AFB","M","Looks for tuberculosis (TB) bacteria in sputum.","Early-morning sputum is best. The lab may ask for more than one sample.","Sputum"],
  ["Gram Stain","M","A quick stain that shows whether bacteria are present and what type. Guides treatment.","","Sample as advised by the lab"],
  ["Semen Analysis","M","Checks sperm count, movement and shape. Used in fertility checks.","Abstain for 2 to 7 days before. Follow the lab's collection instructions.","Semen"],
  ["Blood (Microbiology)","M","A blood culture. Grows germs from blood to find serious infections and the antibiotic that works.","Best collected before you start antibiotics.","Blood"],
  ["Histopathology","M","A microscope study of a tissue sample (biopsy) to diagnose conditions, including cancer.","","Tissue sample"]
];
const POPULAR_TEST_IDS = ["cbc","fbs-fasting-blood-sugar","glycosylated-hb-hba1c","lipid-profile","t3-t4-tsh","liver-function-test-lft","rft-renal-function-test","esr","crp","widal"];

// HEALTH CHECKUP packages built from the tests above (no prices).
const PACKAGES = [
  { name:"Basic Health Check", desc:"A starting set of routine checks.", who:"Yearly routine check", tests:["CBC","FBS (Fasting Blood Sugar)","Lipid Profile","Urine Sugar","Urine Albumin","Urine Microscopy"] },
  { name:"Full Body Checkup", desc:"A wider panel covering several body systems.", who:"Complete peace of mind", tests:["CBC","ESR","FBS (Fasting Blood Sugar)","Glycosylated Hb (HbA1c)","Lipid Profile","Liver Function Test (LFT)","RFT (Renal Function Test)","T3, T4, TSH","Urine Sugar","Urine Albumin","Urine Microscopy"], disc:20, badge:"Most Popular" },
  { name:"Diabetes Care", desc:"Sugar-related checks and kidney markers.", who:"For diabetics and at-risk adults", tests:["FBS (Fasting Blood Sugar)","PPBS (Post-Prandial Blood Sugar)","Glycosylated Hb (HbA1c)","Urine Sugar","Urine Albumin","RFT (Renal Function Test)"] },
  { name:"Heart Health", desc:"Cholesterol and related heart markers.", who:"For heart-health tracking", tests:["Lipid Profile","CRP","CPK","CPK-MB","FBS (Fasting Blood Sugar)"] },
  { name:"Thyroid Profile", desc:"Thyroid hormones with a blood count and lipid check.", who:"For thyroid follow-up", tests:["T3, T4, TSH","CBC","Lipid Profile"] },
  { name:"Senior Citizen", desc:"A routine panel for older adults.", who:"Ages 60 and above", tests:["CBC","FBS (Fasting Blood Sugar)","Glycosylated Hb (HbA1c)","Lipid Profile","Liver Function Test (LFT)","RFT (Renal Function Test)","S. Calcium","Urine Sugar","Urine Albumin"] },
  { name:"Women's Wellness", desc:"Common checks for women's health.", who:"For women of all ages", tests:["CBC","ESR","T3, T4, TSH","S. Calcium","Blood Group & Rh","Urine Microscopy"] }
];


const FAQ_GROUPS = [
  { id:"web", label:"Website", items:[
    ["How do I add a test?", "Type a test name (or a need like sugar or thyroid) in the search bar and tap the test you want. It is added to My Tests, the test tube icon at the top. You can add as many tests as you need."],
    ["How do I book?", "Tap the test tube icon (My Tests), choose today or tomorrow, fill in the patient's details and tap Book Home Collection. WhatsApp opens with your details. Press Send to finish your booking."],
    ["Do I need to create an account?", "No. You do not need to sign up or log in."],
    ["Is my personal information safe?", "Your details are used only to book your home collection. They are not saved in your browser, and the form is cleared after you book."],
    ["Can I just walk in without booking?", "Yes. You can walk in during working hours (Monday to Saturday, 7:00 AM to 8:30 PM). Use Get Directions in the Contact section to find us, behind Sadhur Matt."],
    ["How do I get my reports?", "Your reports are sent to you online, so you do not need to come back to the lab."]
  ]},
  { id:"tests", label:"Tests", items:[
    ["How do I know which test I need?", "Your doctor decides which tests you need. On this site, tap any test name to read in simple words what it checks. Health packages group common tests together."],
    ["Do I need to fast before my test?", "Some tests need fasting, for example fasting blood sugar and lipid profile (usually 8 to 12 hours, plain water is fine). Many tests, such as HbA1c and CBC, do not. Each test's details show the usual preparation. Follow your doctor's advice and confirm with the lab."],
    ["How long do reports take?", "Timing depends on the test. Ask the lab for the expected report time when you book."],
    ["What sample will be taken?", "Most tests use a small blood sample. Others use urine, stool or a swab. The test details show the sample type."],
    ["Can I take my regular medicines before the test?", "Usually yes, but some tests need special care. Ask your doctor, and tell the lab which medicines you take."],
    ["Will the test details here replace my doctor's advice?", "No. The descriptions are general information to help you understand each test. Your doctor will explain what your result means for you."]
  ]},
  { id:"home", label:"Home Collection", items:[
    ["Is home sample collection available at my address?", "Yes, if your address is within 5 km of the lab (Behind Sadhur Matt, Chikkaballapur). The booking form asks you to confirm this. If you live further away, please call the lab."],
    ["How many bookings are taken each day?", "Slots are limited each day. You can book for today until 4 PM. If today is full, book for tomorrow, which is open at any time."],
    ["When will the team reach my home?", "After you tap Book, WhatsApp opens with your details. Press Send. Our team then confirms with you on WhatsApp. Please keep your phone with you."],
    ["How should I prepare at home?", "If your test needs fasting, follow the instructions shown for it. Stay at the address you gave and keep your phone switched on."],
    ["Can I book for another person, such as my parent?", "Yes. Enter the patient's name, age and your contact number. Use My Tests to add the tests, and tap Add another if the same test is needed for two people."],
    ["Is there a charge for home collection?", "Please confirm the charges with the lab on WhatsApp or by phone before the visit."]
  ]}
];

/* =====================================================================
   DATA BUILD AND VALIDATION
   ===================================================================== */
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const TESTS = TEST_ROWS.map(([name, c, desc, prep, sample]) => ({
  id: slug(name), name, cat: CATS[c], catKey: c, desc: desc || "",
  prep: prep || "", sample: sample || SAMPLE_BY_CAT[c]
}));
const TEST_MAP = new Map(TESTS.map((t) => [t.id, t]));
if (TEST_MAP.size !== TESTS.length) console.warn("Duplicate test IDs found.");
PACKAGES.forEach((p) => {
  p.id = "pkg-" + slug(p.name);
  p.testIds = p.tests.map(slug);
  p.testIds.forEach((id) => { if (!TEST_MAP.has(id)) console.warn("Package", p.name, "references unknown test", id); });
});
POPULAR_TEST_IDS.forEach((id) => { if (!TEST_MAP.has(id)) console.warn("Unknown popular test", id); });
const PKG_MAP = new Map(PACKAGES.map((p) => [p.id, p]));
const getItem = (id) => TEST_MAP.get(id) || PKG_MAP.get(id);

/* =====================================================================
   HELPERS
   ===================================================================== */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Click effects: ripple on buttons, sparks and "+1" on add/claim */
let lastPt = { x: innerWidth / 2, y: innerHeight / 2 };
document.addEventListener("click", (e) => {
  const t = e.target.closest(".btn,.tab,.fab");
  const r = t ? t.getBoundingClientRect() : null;
  lastPt = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : lastPt;
  if (!t || reduceMotion) return;
  const d = Math.max(r.width, r.height), s = h("span", "ripple");
  s.style.cssText = "width:" + d + "px;height:" + d + "px;left:" + (lastPt.x - r.left - d / 2) + "px;top:" + (lastPt.y - r.top - d / 2) + "px";
  t.append(s);
  setTimeout(() => s.remove(), 650);
}, true);
function burst(n) {
  if (reduceMotion) return;
  for (let i = 0; i < n; i++) {
    const s = h("span", "spark"), a = (i / n) * Math.PI * 2, d = 34 + (i % 3) * 14;
    s.style.cssText = "left:" + lastPt.x + "px;top:" + lastPt.y + "px;--dx:" + Math.cos(a) * d + "px;--dy:" + Math.sin(a) * d + "px";
    document.body.append(s);
    setTimeout(() => s.remove(), 750);
  }
}
function fxAdd() {
  if (reduceMotion) return;
  burst(8);
  const p = h("span", "plus", "+1");
  p.style.cssText = "left:" + (lastPt.x - 18) + "px;top:" + (lastPt.y - 30) + "px";
  document.body.append(p);
  setTimeout(() => p.remove(), 950);
}
function h(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function btn(label, cls, onClick, aria) {
  const b = h("button", cls, label);
  b.type = "button";
  if (aria) b.setAttribute("aria-label", aria);
  b.addEventListener("click", onClick);
  return b;
}
/* Input safety: everything typed by a visitor is cleaned before it is sent to WhatsApp, the sheet or email.
   (The page itself only uses textContent, never innerHTML, so typed text can never run as code.) */
const BAD_CHARS = /[\u0000-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;
function clean(v, max) {
  return String(v == null ? "" : v).replace(/[\r\n]+/g, ", ").replace(BAD_CHARS, " ").replace(/[<>`*~\\]/g, "").replace(/\s{2,}/g, " ").trim().slice(0, max);
}
function cleanLines(v, max) {
  return String(v == null ? "" : v).replace(/\r/g, "").replace(/[\u0000-\u0009\u000B-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g, "").replace(/[<>]/g, "").trim().slice(0, max);
}
const NAME_OK = /^[\p{L}\p{M}][\p{L}\p{M} .'\-]{1,59}$/u;
const phoneDigits = PHONE_NUMBER.replace(/[^\d+]/g, "");
const phoneOk = /^\+?\d{8,15}$/.test(phoneDigits);
const waOk = /^\d{11,15}$/.test(WHATSAPP_NUMBER);

let toastTimer;
function toast(msg, linkText, href) {
  const t = $("#toast");
  t.textContent = msg;
  if (linkText) { const a = h("a", "", linkText); a.href = href; t.append(a); }
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove("show"); setTimeout(() => { if (!t.classList.contains("show")) t.textContent = ""; }, 500); }, linkText ? 6000 : 4000);   // links (may hold booking details) are removed once hidden
}

/* =====================================================================
   STATIC BINDINGS
   ===================================================================== */
$("#year").textContent = new Date().getFullYear();
$$("[data-phone]").forEach((a) => {
  if (phoneOk) { a.href = "tel:" + phoneDigits; a.textContent = "Call"; }
  else { a.textContent = "Phone to be added"; a.removeAttribute("href"); }
});

/* =====================================================================
   OFFERS MARQUEE AND OFFER CARDS
   ===================================================================== */
const MARQUEE = [
  "Trusted Diagnostic Services",
  "Blood Tests",
  "X-ray Imaging",
  "Urine and Stool Analysis",
  "Serology and Hormones",
  "Microbiology and Histopathology"
];
(function marquee() {
  const track = $("#marquee");
  for (let i = 0; i < 2; i++) {
    const g = h("div"); g.style.display = "flex";
    if (i) g.setAttribute("aria-hidden", "true");
    MARQUEE.forEach((t) => g.append(h("span", "", "✦ " + t)));
    track.append(g);
  }
})();

/* =====================================================================
   ENQUIRE: pre-selects a test or package in the enquiry form
   ===================================================================== */
/* =====================================================================
   MY TESTS (basket): pick one or more tests/packages, then Book Home Collection
   opens WhatsApp with the whole list. WhatsApp is never reached with an empty list.
   Repeats and package overlaps are checked with the patient before adding.
   ===================================================================== */
const CART_KEY = "ssdl_my_tests";
let cart = [];   // [{ id, n }]
const CART_TTL = 6 * 3600 * 1000;   // a forgotten list is wiped after 6 hours
function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) || "null");
    if (!raw || Array.isArray(raw) || !raw.t || Date.now() - raw.t > CART_TTL || !Array.isArray(raw.items)) { localStorage.removeItem(CART_KEY); return []; }
    return raw.items
      .filter((x) => x && typeof x.id === "string" && getItem(x.id))
      .map((x) => ({ id: x.id, n: Math.min(9, Math.max(1, x.n | 0 || 1)) }));
  } catch (e) { return []; }
}
cart = loadCart();
let offerNote = "", flash = null, undoCart = null;
const cartDlg = $("#cartDialog"), askDlg = $("#askDialog");
const find = (id) => cart.find((x) => x.id === id);
const qtyOf = (id) => (find(id) ? find(id).n : 0);
const cartCount = () => cart.reduce((sum, x) => sum + x.n, 0);
const cartLines = () => cart.map((x, i) => { const it = getItem(x.id); return (i + 1) + ". " + it.name + (it.testIds ? " (checkup, " + it.tests.length + " tests)" : "") + (x.n > 1 ? " x" + x.n : ""); });
const saveCart = () => { try { if (cart.length) localStorage.setItem(CART_KEY, JSON.stringify({ t: Date.now(), items: cart })); else localStorage.removeItem(CART_KEY); } catch (e) {} };

/* ---- Live test tube: fills as tests are added. Blood = red, urine = yellow, both together = mixed orange ---- */
const TUBE_COL = { red: [211, 32, 46], orange: [240, 130, 24], yellow: [247, 203, 42], clear: [143, 211, 198] };
const rgbCss = (c) => "rgb(" + c.map((v) => Math.round(v)).join(",") + ")";
const lerpCol = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
function sampleKind(t) { const s = String((t && t.sample) || "").toLowerCase(); return /blood|serum|plasma/.test(s) ? "b" : /urine/.test(s) ? "u" : "o"; }
function kindWeights(id) {
  const it = getItem(id), w = { b: 0, u: 0, o: 0 };
  if (!it) return w;
  const ts = (it.testIds || [it.id]).map((i) => TEST_MAP.get(i)).filter(Boolean);
  ts.forEach((t) => { w[sampleKind(t)] += 1 / ts.length; });
  return w;
}
function liquidColour(w) {
  if (w.b > 0 && w.u > 0) { const r = 0.25 + 0.5 * (w.u / (w.b + w.u)); return r <= 0.5 ? lerpCol(TUBE_COL.red, TUBE_COL.orange, r / 0.5) : lerpCol(TUBE_COL.orange, TUBE_COL.yellow, (r - 0.5) / 0.5); }
  return w.b > 0 ? TUBE_COL.red : w.u > 0 ? TUBE_COL.yellow : TUBE_COL.clear;
}
const itemColour = (id) => liquidColour(kindWeights(id));
const TUBE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" class="tube" viewBox="0 0 48 120" aria-hidden="true" focusable="false">' +
  '<path d="M10 20V92a14 14 0 0 0 28 0V20z" fill="url(#gl-glass)"/>' +
  '<g clip-path="url(#gl-tclip)"><g class="tb-liq" style="transform:translateY(80px)">' +
  '<rect class="tb-base" x="8" y="26" width="32" height="90" fill="rgb(143,211,198)"/>' +
  '<rect class="tb-layer" x="8" y="26" width="32" height="0" opacity="0"/>' +
  '<g class="tb-swirl" opacity="0"><path d="M0 40q7-6 14 0t14 0t14 0t14 0t14 0" fill="none" stroke="#D3202E" stroke-width="4" stroke-linecap="round"/><path d="M0 56q7 6 14 0t14 0t14 0t14 0t14 0" fill="none" stroke="#F7CB2A" stroke-width="4" stroke-linecap="round"/><path d="M0 72q7-6 14 0t14 0t14 0t14 0t14 0" fill="none" stroke="#D3202E" stroke-width="3.5" stroke-linecap="round"/></g>' +
  '<rect x="8" y="26" width="32" height="90" fill="url(#gl-tshade)"/>' +
  '<ellipse class="tb-men" cx="24" cy="26.500" rx="14" ry="2.800" fill="#fff" opacity=".4"/>' +
  '<g class="tb-bubs" opacity="0"><circle cx="18" cy="96" r="2" fill="#fff" opacity=".7"/><circle cx="28" cy="88" r="1.500" fill="#fff" opacity=".7"/><circle cx="22" cy="80" r="1.200" fill="#fff" opacity=".7"/></g>' +
  '</g></g>' +
  '<path d="M10 20V92a14 14 0 0 0 28 0V20" fill="none" stroke="#6E9CB0" stroke-width="1.600" stroke-linecap="round"/>' +
  '<path d="M14 28v58" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"/><path d="M34 34v40" stroke="#fff" stroke-width="1.400" stroke-linecap="round" opacity=".45"/>' +
  '<path d="M36 40h-4M36 54h-3M36 68h-4M36 82h-3" stroke="#4F6B77" stroke-width="1.100" stroke-linecap="round" opacity=".7"/>' +
  '<rect x="8" y="17" width="32" height="6" rx="2.500" fill="#B9C6CD" stroke="#6E9CB0" stroke-width=".8"/>' +
  '<path d="M6 12a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" fill="url(#gl-purple)" stroke="#33195F" stroke-width=".9"/>' +
  '<path d="M10 12h28" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".45"/></svg>';
const tubes = [];
let tubeSt = { level: 0, mixed: false, col: TUBE_COL.clear, init: false }, lastAdd = null, holdTube = false;
function buildTubes() {
  $$("[data-tube]").forEach((host) => {
    if (host.firstChild) return;
    const svg = document.importNode(new DOMParser().parseFromString(TUBE_SVG, "image/svg+xml").documentElement, true);
    host.append(svg);
    tubes.push({ svg, liq: $(".tb-liq", svg), base: $(".tb-base", svg), layer: $(".tb-layer", svg), swirl: $(".tb-swirl", svg), men: $(".tb-men", svg), bubs: $(".tb-bubs", svg), tm: 0 });
  });
}
function paintTube(T, level, col, o) {
  clearTimeout(T.tm);
  const still = reduceMotion || o.instant;
  T.liq.style.transition = still ? "none" : "transform .9s cubic-bezier(.22,1,.36,1)";
  T.liq.style.transform = "translateY(" + (1 - level) * 80 + "px)";
  const settle = () => {
    T.base.style.transition = still ? "none" : "fill .9s ease"; T.base.style.fill = rgbCss(col);
    T.layer.style.transition = "none"; T.layer.style.opacity = "0";
  };
  if (o.pour && !still) {
    T.base.style.transition = "none"; T.base.style.fill = rgbCss(o.prevCol);
    T.layer.setAttribute("height", String(Math.max(8, 80 * (level - o.from) + 4)));
    T.layer.style.transition = "none"; T.layer.style.fill = rgbCss(o.addCol); T.layer.style.opacity = "1";
    void T.base.getBoundingClientRect();
    T.tm = setTimeout(() => {   // the new sample has settled on top: now they blend into a new colour
      T.base.style.transition = "fill 1.4s ease"; T.base.style.fill = rgbCss(col);
      T.layer.style.transition = "opacity 1.4s ease, fill 1.4s ease"; T.layer.style.fill = rgbCss(col); T.layer.style.opacity = "0";
      if (T.swirl.animate) {
        T.swirl.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.2 }, { opacity: 0.95, offset: 0.7 }, { opacity: 0 }], { duration: 1600 });
        T.swirl.firstElementChild.animate([{ transform: "translateX(0)" }, { transform: "translateX(-14px)" }], { duration: 400, iterations: 4 });
        T.swirl.children[1].animate([{ transform: "translateX(-14px)" }, { transform: "translateX(0)" }], { duration: 400, iterations: 4 });
      }
    }, 800);
  } else settle();
  if (!still && o.grew && T.bubs.animate) {
    T.bubs.animate([{ opacity: 0, transform: "translateY(0)" }, { opacity: 1, offset: 0.2 }, { opacity: 0, transform: "translateY(-34px)" }], { duration: 1200, delay: 200 });
    T.men.animate([{ transform: "scaleY(1)" }, { transform: "scaleY(1.9)", offset: 0.35 }, { transform: "scaleY(1)" }], { duration: 700, delay: 350 });
  }
}
function syncTubes() {
  if (holdTube) return;
  const n = cartCount(), w = { b: 0, u: 0, o: 0 };
  cart.forEach((x) => { const k = kindWeights(x.id); w.b += k.b * x.n; w.u += k.u * x.n; w.o += k.o * x.n; });
  const level = n ? Math.min(1, n / 8) : 0, col = liquidColour(w), mixed = w.b > 0 && w.u > 0, prev = tubeSt;
  const pour = prev.init && level > prev.level && mixed && !prev.mixed && prev.level > 0 && !!lastAdd;
  tubes.forEach((T) => paintTube(T, level, col, { instant: !prev.init, pour, prevCol: prev.col, addCol: lastAdd || col, from: prev.level, grew: level > prev.level }));
  tubeSt = { level, mixed, col, init: true }; lastAdd = null;
  const box = $("#ctTubeBox"), note = $("#ctTubeN");
  if (box) {
    box.hidden = !cart.length;
    note.textContent = mixed ? "Blood and urine samples, shown mixed in one tube." : w.b > 0 ? "Blood sample." + (w.o > 0 ? " Other samples are collected separately." : "") : w.u > 0 ? "Urine sample." + (w.o > 0 ? " Other samples are collected separately." : "") : "Sample is collected as described in each test.";
  }
}

/* ---- Home collection form: landmarks (edit this list to match your area) ---- */
/* Landmark (main locality) -> areas shown after it is chosen. Edit freely: add a landmark, or add/remove areas. */
const LANDMARK_AREAS = {
  "Vapasandra": ["Vapasandra", "Manchanabelle Road"],
  "Reshmigudu Market": ["Reshmigudu Market"],
  "Bhagath Singh Nagar": ["Bhagath Singh Nagar", "Darga Mohalla"],
  "Prashanth Nagar": ["Prashanth Nagar"],
  "Police Quarters": ["Police Quarters", "Timmakka Layout", "Prashanth Nagar"],
  "Municipal Layout": ["Municipal Layout", "Dinnehosahalli Road"],
  "Gangamidde": ["Gangamidde", "Nimalakalakunte"],
  "New District Hospital": ["New District Hospital", "TG Bank"],
  "Newton Grammar School": ["Newton Grammar School", "Municipal College", "Sweepers Colony"],
  "Municipal Corporation": ["Municipal Corporation", "Doddamasudi"],
  "Alaragadda": ["Alaragadda", "Walasanna", "Nagarthapete", "Kandwarapete"],
  "A.K. Colony": ["A.K. Colony", "Al-Kalam School"],
  "Bapuji Nagar": ["Bapuji Nagar"],
  "Kandavara": ["Kandavara"],
  "Nandi Road": ["Nandi Road", "Quasar Nagar"],
  "Girls School": ["Girls School", "Basavanagudi"],
  "Fort Area": ["Fort Area"],
  "Sir M. Visvesvaraya Layout": ["Sir M. Visvesvaraya Layout"],
  "Karkane Pete": ["Karkane Pete", "Dharmachatra Road"],
  "Darga Mohalla": ["Darga Mohalla", "KSRTC Road"],
  "Shanti Nagar": ["Shanti Nagar", "H.S. Garden"],
  "Kelaginatotagalu": ["Kelaginatotagalu"],
  "Chamarajapete": ["Chamarajapete", "Nakkalakunte", "Sunnakalu Street"],
  "DVT Pete": ["DVT Pete", "Karkane Pete"],
  "Garakarollu": ["Garakarollu", "DBM Road"],
  "Yelepete": ["Yelepete", "Kurubara Street"],
  "Koracharapete": ["Koracharapete", "Venugopalaswamy Temple"],
  "Ambedkar Nagar": ["Ambedkar Nagar"],
  "Sunnakalu Street": ["Sunnakalu Street", "Indiranagar", "Badavara Sangha Colony", "Vapasandra"]
};
const LANDMARKS = Object.keys(LANDMARK_AREAS);
const AREAS = [...new Set(Object.values(LANDMARK_AREAS).flat())].sort((x, y) => x.localeCompare(y));
/* ---- Google Sheets booking + 50 slots per day ----
   Paste the Web app URL of your Google Apps Script here (see SETUP-GOOGLE-SHEET.md).
   Leave empty to book on WhatsApp only (no slot counting). */
const BOOKING_API_URL = "https://script.google.com/macros/s/AKfycbz9us05aWxg1QieVBxqqXz0CBqRgWan5sNNX9WAXndoeVRMmRltnhK6L3urqnQ6KCZ5-g/exec";   // MUST look like https://script.google.com/macros/s/AKfy.../exec  (NOT a /macros/library/ link)
/* Spam protection (Cloudflare Turnstile, free). Paste your SITE key here to turn it on.
   Leave empty to keep it off. The SECRET key goes in Apps Script, never here (see SETUP-GOOGLE-SHEET.md). */
const BOOKING_API = /^https:\/\/script\.google\.com\//.test(BOOKING_API_URL) ? BOOKING_API_URL : "";   // not set up yet = WhatsApp only, no errors shown
const TURNSTILE_SITE_KEY = "";
let tsWidget = null, tsToken = "", tsLoading = false;
function setupTurnstile() {
  if (!TURNSTILE_SITE_KEY || tsWidget !== null || tsLoading) return;
  const box = $("#tsBox"); if (!box) return;
  const draw = () => { tsWidget = window.turnstile.render(box, { sitekey: TURNSTILE_SITE_KEY, callback: (t) => { tsToken = t; }, "expired-callback": () => { tsToken = ""; }, "error-callback": () => { tsToken = ""; } }); };
  if (window.turnstile) { draw(); return; }
  tsLoading = true;
  const sc = document.createElement("script");
  sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  sc.async = true; sc.onload = () => { tsLoading = false; draw(); }; sc.onerror = () => { tsLoading = false; };
  document.head.appendChild(sc);
}
function resetTurnstile() { tsToken = ""; if (tsWidget !== null && window.turnstile) { try { window.turnstile.reset(tsWidget); } catch (e) {} } }
/* Clears every patient field so nothing is left on screen after booking */
/* Area list: only the areas of the chosen landmark, then "Other" to type your own.
   If the landmark is "Other", every area is offered. */
function buildAreaOptions() {
  const as = bk("bkArea"), keep = as.value, lm = bk("bkLandmark").value;
  as.textContent = "";
  if (!lm) { as.append(new Option("Select landmark first", "")); bk("bkAreaOtherWrap").hidden = true; return; }
  const list = LANDMARK_AREAS[lm] || AREAS;
  as.append(new Option("Select your area", ""));
  list.forEach((x) => as.append(new Option(x, x)));
  as.append(new Option("Other (type your area)", "Other"));
  if (keep && [...as.options].some((o) => o.value === keep)) as.value = keep;
  else if (list.length === 1) as.value = list[0];
  bk("bkAreaOtherWrap").hidden = as.value !== "Other";
}
function clearBkForm() {
  const f = $("#bkForm"); if (f) f.reset();   // the doctor box goes back to "Self"
  bk("bkOtherWrap").hidden = true;
  bk("bkAreaOtherWrap").hidden = true;
  buildAreaOptions();
  buildDayOptions();
}
/* Opens the WhatsApp app directly (whatsapp://), not the wa.me web page.
   The wa.me link is only kept as a small backup if the app does not open. */
function waApp(text) { return "whatsapp://send?phone=" + WHATSAPP_NUMBER + "&text=" + encodeURIComponent(text); }
function waLink(text) { return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text); }
/* Phone: open the WhatsApp app directly. Computer: whatsapp:// does nothing there, so use the wa.me link (opens WhatsApp Desktop or WhatsApp Web) */
const IS_MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform));
const DETAIL_KEY = "ssdl_patient";
const bk = (id) => $("#" + id);
function readDetails() {
  const lm = bk("bkLandmark").value === "Other" ? clean(bk("bkOther").value, 60) : (LANDMARKS.includes(bk("bkLandmark").value) ? bk("bkLandmark").value : "");
  return { name: clean(bk("bkName").value, 60), age: (() => { const a = parseInt(bk("bkAge").value, 10); return Number.isFinite(a) ? String(a).slice(0, 3) : ""; })(), phone: bk("bkPhone").value.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "").slice(0, 10),
    doctor: clean(bk("bkDoctor").value, 60) || "Self", landmark: lm,
    gender: ["Male", "Female", "Other"].includes(bk("bkGender").value) ? bk("bkGender").value : "",
    area: bk("bkArea").value === "Other" ? clean(bk("bkAreaOther").value, 60) : (AREAS.includes(bk("bkArea").value) ? bk("bkArea").value : "") };
}
function dayLabel(offset) {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
function cartMessage(no) {
  const d = readDetails(), o = +bk("bkDay").value;
  return "Hello Shiva Sathvika Lab 🙏\nI want to confirm my *Home Sample Collection* booking." + (no ? "\nBooking No: " + no : "") +
    "\n\n📅 " + (o ? "Tomorrow" : "Today") + ", " + dayLabel(o) +
    "\n\n*Tests*\n" + cartLines().join("\n") +
    "\n\n*Patient*\n" + d.name + ", " + d.age + " yrs, " + d.gender + "\n📞 " + d.phone + "\nDoctor: " + d.doctor +
    "\n\n📍 " + d.area + "\nLandmark: " + d.landmark +
    "\n\nPlease confirm my slot. Thank you.";
}
/* Slots: read from the Google Sheet (server counts, max 50 per day) */
let slots = null;
const allFull = () => !!(slots && slots.days.every((x) => x.left <= 0 || x.open === false || (x.offset === 0 && istHour() >= 16)));
function fetchTimeout(url, opt, ms) {
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms);
  return fetch(url, { ...opt, signal: c.signal }).finally(() => clearTimeout(t));
}
/* Current hour in India, so the 4 PM cutoff is the same for every visitor */
function istHour() { return +new Intl.DateTimeFormat("en-GB", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()) % 24; }
/* Friendly message when a day cannot be booked */
function dayMsg(o, closed) {
  return closed
    ? "🕓 Today's booking is closed (after 4 PM).\nPlease book for tomorrow - slots are open now."
    : "😊 Slots for " + (o ? "tomorrow" : "today") + " are full.\nPlease book for " + (o ? "the next day" : "tomorrow") + ".";
}
function buildDayOptions() {
  const sel = bk("bkDay"), keep = sel.value || "0";
  sel.replaceChildren();
  [0, 1].forEach((o) => {
    const info = slots && slots.days.find((x) => x.offset === o), closed = !!info && info.open === false || (o === 0 && istHour() >= 16), full = !!info && info.left <= 0, off = closed || full;
    const op = new Option((o ? "Tomorrow" : "Today") + " (" + dayLabel(o) + ")" + (closed ? " - Closed after 4 PM" : info ? (full ? " - Full, book for tomorrow" : " - Slots available") : ""), String(o));
    op.disabled = off; sel.append(op);
  });
  const opts = Array.from(sel.options), pick = opts.find((x) => !x.disabled && x.value === keep) || opts.find((x) => !x.disabled);
  if (pick) sel.value = pick.value;
  const av = $("#slotAvail");
  if (av) {
    const t0 = opts[0] && !opts[0].disabled;
    av.innerHTML = t0 ? "<b>Slots available today.</b> You can also book for tomorrow." : (pick ? "<b>Today's slots are full.</b> Please book for tomorrow." : "<b>All slots are full right now.</b> Please call the lab.");
  }
}
function setSlotStatus(t) { const e = $("#slotStatus"); if (e) { e.textContent = t; e.hidden = !t; } }
let slotsBusy = false, slotsAt = 0;
async function refreshSlots(force) {
  if (!BOOKING_API || slotsBusy) return;
  if (!force && slots && Date.now() - slotsAt < 45000) return;   // fresh enough: open instantly
  if (!/^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[^/]+\/exec$/.test(BOOKING_API)) {
    setSlotStatus("Booking link is wrong. It must be the Web app URL ending with /exec."); return;
  }
  slotsBusy = true; setSlotStatus("Checking slots…");
  let got = null, why = "";
  for (let i = 0; i < 2 && !got; i++) {                       // Google can be slow to wake up: try twice
    try {
      const r = await fetchTimeout(BOOKING_API + (BOOKING_API.indexOf("?") > -1 ? "&" : "?") + "action=slots&t=" + Date.now(), {}, 8000);
      const j = await r.json();
      if (j && j.days) got = j; else why = j && j.error ? String(j.error).slice(0, 80) : "bad reply";
    } catch (e) { why = "no reply"; }
    if (!got && i < 2) await new Promise((res) => setTimeout(res, 800 * (i + 1)));
  }
  slotsBusy = false;
  if (got) { slots = got; slotsAt = Date.now(); buildDayOptions(); renderCart(); setSlotStatus(""); }   // on failure the last known counts stay on screen
  else setSlotStatus("Could not check slots (" + why + "). Tap here to try again.");
}
function newReqId() {
  const a = new Uint32Array(3);
  (window.crypto || window.msCrypto).getRandomValues(a);
  return [...a].map((n) => n.toString(36)).join("");
}
async function submitBooking(d) {
  if (!BOOKING_API) return { ok: true, offline: true };   // no sheet connected: WhatsApp only, no slot counting
  // The same request id is sent on a retry, so the server can never save the same booking twice
  const body = JSON.stringify({ ...d, day: +bk("bkDay").value, tests: cartLines().join("; "), hp: (bk("bkHp") ? bk("bkHp").value : ""), ts: tsToken, rid: newReqId(), ft: Date.now() - formOpenedAt });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetchTimeout(BOOKING_API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body }, attempt ? 15000 : 20000);
      const j = await r.json();
      if (j && typeof j.ok === "boolean") return j;
    } catch (e) {}
  }
  return { ok: false, network: true };
}
(function initBkForm() {
  buildDayOptions();
  const ss = $("#slotStatus"); if (ss) { ss.addEventListener("click", () => refreshSlots(true)); }
  const sel = bk("bkLandmark");
  sel.append(new Option("Select nearest landmark", ""));
  LANDMARKS.forEach((l) => sel.append(new Option(l, l)));
  sel.append(new Option("Other (type below)", "Other"));
  sel.addEventListener("change", () => { bk("bkOtherWrap").hidden = sel.value !== "Other"; buildAreaOptions(); });
  bk("bkArea").addEventListener("change", () => { bk("bkAreaOtherWrap").hidden = bk("bkArea").value !== "Other"; });
  buildAreaOptions();
  bk("bkDoctor").addEventListener("focus", (e) => { if (e.target.value === "Self") e.target.select(); });   // type to replace "Self"
  bk("bkDoctor").addEventListener("blur", (e) => { if (!e.target.value.trim()) e.target.value = "Self"; });
  setTimeout(() => refreshSlots(true), 1200);   // warm up the booking server while the visitor browses, so booking later is fast
  try { localStorage.removeItem(DETAIL_KEY); } catch (e) {}   // privacy: patient details are never kept in the browser (also wipes data saved by older versions)
})();
["bkName", "bkAge", "bkGender", "bkPhone", "bkLandmark", "bkOther", "bkArea", "bkAreaOther", "bkRadius"].forEach((id) => {
  const clear = () => { bk("e-" + id).textContent = ""; bk(id).removeAttribute("aria-invalid"); };
  bk(id).addEventListener("input", clear); bk(id).addEventListener("change", clear);
});
function validateBk() {
  const d = readDetails(), errs = {};
  if (d.name.length < 2) errs.bkName = "Please enter the patient's name.";
  else if (!NAME_OK.test(d.name)) errs.bkName = "Use letters only in the name.";
  const age = Number(d.age);
  if (!d.age || !(age >= 0 && age <= 120)) errs.bkAge = "Enter a valid age.";
  if (!/^[6-9]\d{9}$/.test(d.phone)) errs.bkPhone = "Enter a valid 10-digit mobile number.";
  if (!bk("bkLandmark").value) errs.bkLandmark = "Please choose a landmark.";
  else if (!d.landmark) errs.bkOther = "Please type your landmark.";
  if (!d.gender) errs.bkGender = "Please select gender.";
  if (!bk("bkArea").value) errs.bkArea = "Please select your area.";
  else if (!d.area) errs.bkAreaOther = "Please type your area.";
  if (!bk("bkRadius").checked) errs.bkRadius = "Home collection is only within 5 km of the lab. Please call us if you live further away.";
  ["bkName", "bkAge", "bkGender", "bkPhone", "bkLandmark", "bkOther", "bkArea", "bkAreaOther", "bkRadius"].forEach((id) => {
    bk("e-" + id).textContent = errs[id] || "";
    bk(id).toggleAttribute("aria-invalid", !!errs[id]);
  });
  const first = Object.keys(errs)[0];
  if (first) { bk(first).focus(); return null; }
  return d;
}

/* Cross-check: does this item share tests with something already in the list? */
const testsOf = (it) => it.testIds || [it.id];
function overlapText(id) {
  const it = getItem(id), out = [];
  cart.forEach((x) => {
    if (x.id === id) return;
    const ot = getItem(x.id), shared = testsOf(it).filter((t) => testsOf(ot).includes(t));
    if (!shared.length) return;
    const names = shared.map((t) => TEST_MAP.get(t).name), list = names.slice(0, 3).join(", ") + (names.length > 3 ? " +" + (names.length - 3) + " more" : "");
    if (!it.testIds) out.push(it.name + " is already part of " + ot.name + ".");
    else if (!ot.testIds) out.push(ot.name + " is already in your list and is part of " + it.name + ".");
    else out.push(it.name + " and " + ot.name + " both include " + list + ".");
  });
  return out.join(" ");
}

/* Small question dialog */
function ask(title, msg, actions) {
  $("#askT").textContent = title; $("#askM").textContent = msg;
  const box = $("#askBtns"); box.replaceChildren();
  actions.forEach((a) => box.append(btn(a.label, a.cls, () => { askDlg.close(); if (a.fn) a.fn(); })));
  askDlg.showModal();
}
askDlg.addEventListener("click", (e) => { if (e.target === askDlg) askDlg.close(); });

/* Animations */
function bump(t) {
  if (reduceMotion) return;
  [...$$(".cart-n"), t].filter(Boolean).forEach((e) => { e.classList.remove("bump"); void e.offsetWidth; e.classList.add("bump"); setTimeout(() => e.classList.remove("bump"), 520); });
}
function holdTubeFor() {   // the tube starts filling when the flying drop lands
  holdTube = true;
  setTimeout(() => { holdTube = false; syncTubes(); }, reduceMotion ? 0 : 620);
}
function fly(src, col) {
  if (reduceMotion) return;
  const target = [".tabbar .tb-book i", "#cartBtn", "#waFab"].map((q) => $(q)).find((e) => e && e.getBoundingClientRect().width > 0);
  if (!target) return;
  const r = src && src.getBoundingClientRect().width ? src.getBoundingClientRect() : { left: lastPt.x, top: lastPt.y, width: 0, height: 0 };
  const t = target.getBoundingClientRect();
  const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2, dx = t.left + t.width / 2 - x0, dy = t.top + t.height / 2 - y0;
  const dot = h("span", "fly", "+");
  if (col) dot.style.background = rgbCss(col);
  dot.style.left = x0 - 16 + "px"; dot.style.top = y0 - 16 + "px";
  document.body.append(dot);
  dot.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: "translate(" + dx * 0.5 + "px," + (dy * 0.5 - 70) + "px) scale(1.2)", opacity: 1, offset: 0.5 },
    { transform: "translate(" + dx + "px," + dy + "px) scale(.35)", opacity: 0.5 }
  ], { duration: 700, easing: "cubic-bezier(.5,0,.25,1)" }).onfinish = () => { dot.remove(); bump(target); };
}

/* Add / change / remove */
function syncBtn(b) {
  const n = qtyOf(b.dataset.add), on = n > 0, it = getItem(b.dataset.add), was = b.dataset.on;
  b.dataset.on = on ? "1" : "0";
  b.textContent = on ? "✓ Added" + (n > 1 ? " ×" + n : "") : (b.classList.contains("rb") ? "Add" : "Add to My Tests");
  b.classList.toggle("added", on);
  b.setAttribute("aria-pressed", String(on));
  if (it) b.setAttribute("aria-label", it.name + (on ? " is in My Tests. Tap to change." : ": add to My Tests"));
  if (was !== undefined && was !== b.dataset.on && !reduceMotion) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
}
function addBtn(id, cls) { const b = btn("", cls, () => onAddTap(id, b)); b.dataset.add = id; syncBtn(b); return b; }
function onAddTap(id, src) {
  const it = getItem(id); if (!it) return;
  if (find(id)) {
    ask("Already in My Tests", it.name + " is already in your list" + (qtyOf(id) > 1 ? " (×" + qtyOf(id) + ")" : "") + ". Is this for another person?", [
      { label: "Add another", cls: "btn btn-p", fn: () => changeQty(id, 1, src) },
      { label: "Remove it", cls: "btn btn-o", fn: () => removeItem(id) },
      { label: "Keep as it is", cls: "link-btn" }
    ]);
    return;
  }
  const ov = overlapText(id);
  if (ov) {
    ask("Please check your list", ov + " Do you still want to add it?", [
      { label: "Yes, add it", cls: "btn btn-p", fn: () => addItem(id, src) },
      { label: "No, don't add", cls: "btn btn-o" }
    ]);
    return;
  }
  addItem(id, src);
}
function addItem(id, src) {
  cart.push({ id, n: 1 }); flash = { id, type: "add" };
  lastAdd = itemColour(id); holdTubeFor();
  saveCart(); renderCart(); fxAdd(); fly(src, lastAdd);
  document.dispatchEvent(new Event("ssdl:added"));
  toast(getItem(id).name + " added to My Tests.", "View", "#cart");
}
function changeQty(id, d, src) {
  const x = find(id); if (!x) return;
  if (x.n + d < 1) { removeItem(id); return; }
  if (x.n + d > 9) { toast("Maximum 9 of one test per booking."); return; }
  x.n += d; flash = { id, type: "qty" };
  if (d > 0) { lastAdd = itemColour(id); holdTubeFor(); }
  saveCart(); renderCart();
  if (d > 0) { fxAdd(); fly(src, lastAdd); } else bump();
  if (d > 0 && !src) bump();
}
function removeItem(id) {
  const li = cartDlg.open && $('#ctList [data-id="' + id + '"]');
  const done = () => {
    const it = getItem(id);
    cart = cart.filter((x) => x.id !== id); saveCart(); renderCart(); bump();
    if (!cartDlg.open) toast(it.name + " removed from My Tests.");
  };
  if (li && !reduceMotion && li.animate) {
    li.style.overflow = "hidden";
    li.animate([
      { opacity: 1, transform: "none", height: li.offsetHeight + "px" },
      { opacity: 0, transform: "translateX(44px) scale(.95)", height: "0px", paddingTop: "0px", paddingBottom: "0px", borderWidth: "0px" }
    ], { duration: 320, easing: "cubic-bezier(.4,0,.2,1)", fill: "forwards" }).onfinish = done;
  } else done();
}

function renderCart() {
  const n = cartCount();
  $$(".cart-n").forEach((e) => { e.textContent = n; e.hidden = !n; });
  syncTubes();
  $$("[data-add]").forEach(syncBtn);
  const list = $("#ctList");
  list.replaceChildren();
  cart.forEach((x) => {
    const it = getItem(x.id), li = h("li", "ct-item"), info = h("div", "ct-info");
    li.dataset.id = x.id;
    if (flash && flash.id === x.id) li.classList.add(flash.type === "add" ? "ct-add" : "ct-pulse");
    info.append(h("b", "", it.name), h("span", "", it.testIds ? "Checkup offer · " + it.tests.length + " tests" : it.cat));
    const warn = overlapText(x.id);
    if (warn) info.append(h("p", "ct-warn", "⚠ " + warn));
    const qty = h("div", "ct-qty");
    qty.append(btn("−", "", () => changeQty(x.id, -1), "Decrease quantity of " + it.name), h("span", "", String(x.n)), btn("+", "", () => changeQty(x.id, 1), "Increase quantity of " + it.name));
    const row = h("div", "ct-row2");
    row.append(qty);
    li.append(info, btn("×", "ct-rm", () => removeItem(x.id), "Remove " + it.name), row);
    list.append(li);
  });
  const of = $("#ctOffer");
  of.hidden = !offerNote; of.textContent = offerNote ? "🏷 " + offerNote : "";
  $("#ctEmpty").hidden = cart.length > 0;
  $("#ctMore").hidden = !cart.length; $("#ctAddNote").hidden = !cart.length; $("#ctNext").hidden = !cart.length;
  $("#ctSumN").textContent = n + (n === 1 ? " test selected" : " tests selected");
  $("#ctTab2").classList.toggle("off", !cart.length);
  if (!cart.length && !$("#ctStep2").hidden) setStep(1);
  const go = $("#ctGo"), hint = $("#ctHint");
  if (cart.length && waOk && allFull()) {
    go.setAttribute("aria-disabled", "true"); hint.hidden = false;
    hint.textContent = "😊 Slots are full right now. Please try the next day or call the lab.";
  } else if (cart.length && waOk) { go.href = "#"; go.removeAttribute("aria-disabled"); hint.hidden = true; }
  else {
    go.removeAttribute("href"); go.setAttribute("aria-disabled", "true"); hint.hidden = false;
    hint.textContent = !cart.length ? "Select at least one test or package to continue." : "WhatsApp is not set up yet. Please call the lab.";
  }
  flash = null;
}
function setStep(n) {
  if (n === 2 && !cart.length) n = 1;
  $("#ctStep1").hidden = n !== 1; $("#ctStep2").hidden = n !== 2;
  [1, 2].forEach((i) => { const t = $("#ctTab" + i); t.classList.toggle("on", i === n); t.setAttribute("aria-selected", String(i === n)); });
  const body = $("#cartDialog .ct-body"); if (body) body.scrollTop = 0;
}
$$("#ctTabs [data-step]").forEach((t) => t.addEventListener("click", () => {
  if (t.dataset.step === "2" && !cart.length) { toast("Add at least one test first."); return; }
  setStep(+t.dataset.step);
}));
$("#ctNext").addEventListener("click", () => setStep(2));
$("#ctEdit").addEventListener("click", () => setStep(1));
let formOpenedAt = Date.now();   // sent with a booking so the server can tell a person from a script
function openCart() { formOpenedAt = Date.now(); setStep(1); renderCart(); setMenu(false); if (!cartDlg.open) cartDlg.showModal(); refreshSlots(); setupTurnstile(); }
$("#ctClose").addEventListener("click", () => cartDlg.close());
$("#ctCancel").addEventListener("click", () => {
  const prev = cart.map((x) => ({ ...x })), prevNote = offerNote;
  cart = []; offerNote = "";
  saveCart(); renderCart(); bump();
  cartDlg.close();
  if (prev.length) {
    toast("My Tests cleared.", "Undo", "#undo");
    undoCart = () => { cart = prev; offerNote = prevNote; saveCart(); renderCart(); toast("My Tests restored."); };
  }
});
cartDlg.addEventListener("click", (e) => { if (e.target === cartDlg) cartDlg.close(); });
/* After Book: WhatsApp must be SENT to finish. Three stages:
   start = "One last step", back = asked when the visitor returns from WhatsApp, done = "Booking placed". */
let doneTimer = null, doneState = null;
const doneDlg = $("#doneDialog");
function setDoneStage(stage) {
  const st = doneState; if (!st) return;
  st.stage = stage;
  const first = st.res.offline ? "Send the WhatsApp message to book your slot for " + st.when + "."
    : (st.res.duplicate ? "You already have a slot for " + st.when + ". " : "Your slot for " + st.when + " is saved. ") + "Send us the WhatsApp message to confirm it.";
  const open = $("#doneWa"), sent = $("#doneSent"), close = $("#doneClose");
  $("#doneSteps").hidden = stage !== "start";
  $("#doneWarn").hidden = stage === "done";
  $("#doneAlt").hidden = stage === "done";
  open.hidden = stage === "done"; sent.hidden = stage === "done"; close.hidden = stage !== "done";
  doneDlg.classList.toggle("is-done", stage === "done");
  if (stage === "start") {
    $("#doneT").textContent = "One last step";
    $("#doneMsg").textContent = first;
    open.textContent = "Open WhatsApp"; sent.textContent = "I sent the message";
  } else if (stage === "back") {
    $("#doneT").textContent = "Did you press Send in WhatsApp?";
    $("#doneMsg").textContent = "Your booking is complete only after we receive your message.";
    open.textContent = "No, open WhatsApp again"; sent.textContent = "Yes, I sent it";
  } else {
    $("#doneT").textContent = "✅ Booking placed";
    $("#doneMsg").textContent = "Thank you! We got your request for " + st.when + ". Our team will check it and confirm on WhatsApp soon." + (st.res.bookingNo ? " Your booking no. is " + st.res.bookingNo + "." : "") + " Please keep your phone with you.";
  }
}
function openWhatsApp() {
  if (!doneState) return;
  doneState.opened = true; clearTimeout(doneTimer);
  const url = doneState.wa.app;
  if (IS_MOBILE) { location.href = url; return; }
  const w = window.open(url, "_blank", "noopener");   // computer: new tab, so this page stays open
  if (!w) location.href = url;
}
function showDone(res, wa, when) {
  doneState = { res, wa, when, stage: "start", opened: false };
  $("#doneWa").href = wa.app;
  $("#doneWeb").href = wa.web;
  setDoneStage("start");
  doneDlg.showModal();
  clearTimeout(doneTimer);
  doneTimer = setTimeout(openWhatsApp, 400);   // opens WhatsApp for them; the button is there if it does not
}
$("#doneWa").addEventListener("click", (e) => { e.preventDefault(); openWhatsApp(); });
$("#doneWeb").addEventListener("click", () => { clearTimeout(doneTimer); if (doneState) doneState.opened = true; });
$("#doneSent").addEventListener("click", () => { clearTimeout(doneTimer); setDoneStage("done"); wipeDoneLinks(); if (doneState) doneState.wa = { app: "#", web: "#" }; });
/* Wipes every trace of the booking: list, form, undo copy, links that hold the patient's details */
function wipeBooking() {
  cart = []; offerNote = ""; undoCart = null;
  try { localStorage.removeItem(CART_KEY); localStorage.removeItem(DETAIL_KEY); } catch (e) {}
  clearBkForm();
  renderCart();
}
function wipeDoneLinks() {
  const a = $("#doneWa"), w = $("#doneWeb");
  if (a) a.setAttribute("href", "#"); if (w) w.setAttribute("href", "#");
}
function closeDone() {
  clearTimeout(doneTimer);
  const st = doneState; doneDlg.close();
  if (st && st.stage !== "done") toast("Your booking is not complete yet. Send the WhatsApp message to finish.", "Open WhatsApp", st.wa.app);
  else wipeDoneLinks();   // booking finished: the WhatsApp text (name, phone, address) must not stay on the page
  doneState = null;
}
$("#doneClose").addEventListener("click", closeDone);
doneDlg.addEventListener("cancel", (e) => { e.preventDefault(); closeDone(); });
/* Coming back from WhatsApp: ask if they pressed Send */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && doneDlg.open && doneState && doneState.opened && doneState.stage === "start") setDoneStage("back");
});
$("#ctGo").addEventListener("click", async (e) => {
  e.preventDefault();
  const go = e.currentTarget;
  if (go.getAttribute("aria-disabled") === "true" || go.dataset.busy) return;
  const d = validateBk();
  if (!d) return;
  if (TURNSTILE_SITE_KEY && !tsToken) { const h = $("#ctHint"); h.hidden = false; h.textContent = "Please wait for the security check to finish, then tap Book again."; setupTurnstile(); return; }
  go.dataset.busy = "1"; go.setAttribute("aria-disabled", "true");
  const label = go.textContent; go.textContent = "Booking…";
  let res = await submitBooking(d);
  delete go.dataset.busy; go.textContent = label; go.removeAttribute("aria-disabled");
  resetTurnstile();
  /* Only "closed" and "full" stop a booking. Any other server problem (busy, slow, error): do NOT lose the patient,
     still open WhatsApp so the lab receives the request. */
  if (res && res.ok === false && !res.closed && !res.full) res = { ok: true, offline: true, fallback: true };
  if (!res || res.ok === false) {
    const hint = $("#ctHint"); hint.hidden = false;
    hint.textContent = res && res.closed ? dayMsg(0, true) : res && res.full ? dayMsg(+bk("bkDay").value, false) : (res && res.network ? "Could not reach the booking system. Check your internet and try again, or call the lab." : "Could not book right now" + (res && res.error ? " (" + String(res.error).slice(0, 60) + ")" : "") + ". Please try again or call the lab.");
    refreshSlots();
    return;
  }
  const o = +bk("bkDay").value, when = (o ? "tomorrow" : "today") + ", " + dayLabel(o);
  const msg = cartMessage(res.bookingNo), wa = { app: IS_MOBILE ? waApp(msg) : waLink(msg), web: waLink(msg) };
  cartDlg.close();
  wipeBooking(); bump();
  slotsAt = 0; refreshSlots(true);   // the slot count has changed
  showDone(res, wa, when);
});
["#ctBrowse", "#ctMore"].forEach((q) => $(q).addEventListener("click", () => { cartDlg.close(); openCatalogue(); }));
$("#cartBtn").addEventListener("click", () => openCart());
$("#toast").addEventListener("click", (e) => {
  if (e.target.closest('a[href="#cart"]')) { e.preventDefault(); openCart(); }
  if (e.target.closest('a[href="#undo"]')) { e.preventDefault(); if (undoCart) undoCart(); undoCart = null; }
});
$$('[data-action="book"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openCart(); }));
buildTubes();
renderCart();

/* =====================================================================
   CARDS: POPULAR TESTS, CATALOGUE, PACKAGES
   ===================================================================== */
let detailId = null;
function openDetail(id) {
  const t = TEST_MAP.get(id);
  detailId = id;
  $("#dTitle").textContent = t.name;
  const f = $("#dFacts");
  f.replaceChildren();
  [["What it checks", t.desc], ["Sample", t.sample], ["Preparation", t.prep || "No special preparation is usually needed. Confirm with the lab."], ["Category", t.cat]].forEach(([k, v]) => {
    const d = h("div"); d.append(h("dt", "", k), h("dd", "", v)); f.append(d);
  });
  const da = $("#dAdd"); da.dataset.add = id; syncBtn(da);
  $("#detail").showModal();
}
$("#dAdd").addEventListener("click", () => { $("#detail").close(); onAddTap(detailId); });
$("#dClose").addEventListener("click", () => $("#detail").close());
$("#detail").addEventListener("click", (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

/* Popular cards: category colour + lab icon, sample / fasting chips, full-width Add button */
const CAT_STYLE = {   // [main colour, dark colour, soft tint, icon]
  H: ["#E8695A", "#B3261E", "#FDECE8", "tubes"], U: ["#E8C547", "#8A6A00", "#FFF6D6", "cup"],
  S: ["#A1887F", "#6D4C41", "#F3ECE8", "cup"], B: ["#1F9D74", "#0F7A5C", "#E3F3EA", "pipette"],
  L: ["#F59E0B", "#B45309", "#FEF3E0", "tubes"], V: ["#8BAA3E", "#4C6B14", "#EEF4DC", "centrifuge"],
  O: ["#8B5CF6", "#6D28D9", "#F0EAFE", "microscope"], R: ["#3B82F6", "#1D4ED8", "#E6EFFE", "microscope"],
  M: ["#14B8A6", "#0F766E", "#DDF5F1", "microscope"]
};
function labIcon(name) {
  const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"), use = document.createElementNS(NS, "use");
  svg.setAttribute("viewBox", "0 0 120 120"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  use.setAttribute("href", "#i-" + name); svg.append(use);
  return svg;
}
POPULAR_TEST_IDS.forEach((id, i) => {
  const t = TEST_MAP.get(id);
  if (!t) return;
  const base = CAT_STYLE[t.catKey] || CAT_STYLE.B;
  const st = ["#1F9D74", "#0F7A5C", "#E3F3EA", base[3]];   // same green on every popular card
  const c = h("article", "card pop-card reveal");
  c.style.setProperty("--i", i % 5);
  c.style.setProperty("--c1", st[0]); c.style.setProperty("--c2", st[1]); c.style.setProperty("--tint", st[2]);
  const top = h("div", "pop-top"), ico = h("span", "pop-ico");
  ico.append(labIcon(st[3]));
  top.append(ico, h("span", "pop-flag", "★ Popular"));
  const chips = h("ul", "pop-chips");
  chips.append(h("li", "", t.sample === "Blood" ? "Blood sample" : t.sample));
  if (/no fasting/i.test(t.prep)) chips.append(h("li", "", "No fasting"));
  else if (/fast/i.test(t.prep)) chips.append(h("li", "fast", "Fasting needed"));
  const hh = h("h3"); hh.append(btn(t.name, "link-btn title-link", () => openDetail(id), "View details for " + t.name));
  const actions = h("div", "card-btns"); actions.append(addBtn(id, "btn btn-p"));
  const body = h("div", "pop-body");
  body.append(h("p", "pop-cat", t.cat), hh, h("p", "card-desc", t.desc), chips, actions);
  c.append(top, body);
  $("#popularGrid").append(c);
});

PACKAGES.forEach((p, i) => {
  if (!$("#pkgGrid")) return;
  const c = h("article", "card reveal offer-pack" + (p.badge ? " feature" : ""));
  c.style.setProperty("--i", i % 4);
  if (p.badge) c.append(h("span", "badge", p.badge));
  const top = h("div", "op-top");
  top.append(h("span", "op-who", p.who || ""));
  const det = h("details");
  det.append(h("summary", "", "See all " + p.tests.length + " tests"));
  const ul = h("ul");
  p.tests.forEach((n) => ul.append(h("li", "", n)));
  det.append(ul);
  c.append(top, h("h3", "", p.name), h("p", "", p.desc),
    det,
    (() => { const a = h("div", "card-btns"); a.append(addBtn(p.id, "btn btn-p")); return a; })());
  $("#pkgGrid").append(c);
});

/* Search: every word typed must appear in the test name, category or plain description,
   so "sugar", "thyroid" or "fever" also find the right tests. Name matches come first. */
function testRank(t, words) {
  const name = t.name.toLowerCase(), all = (name + " " + t.cat + " " + t.desc).toLowerCase();
  if (!words.every((w) => all.includes(w))) return -1;
  if (name.startsWith(words[0])) return 0;
  return words.every((w) => name.includes(w)) ? 1 : 2;
}
function searchTests(q) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return TESTS.slice();
  return TESTS.map((t) => [t, testRank(t, words)]).filter((x) => x[1] >= 0)
    .sort((a, b) => a[1] - b[1] || a[0].name.localeCompare(b[0].name)).map((x) => x[0]);
}

/* Catalogue: category tiles, then a compact list. Search looks through every test. */
const state = { cat: null, q: "", more: false };
const tilesEl = $("#tiles"), headEl = $("#catHead");
Object.entries(CATS).forEach(([key, label]) => {
  const list = TESTS.filter((t) => t.catKey === key);
  const b = h("button", "tile");
  b.type = "button"; b.dataset.cat = key;
  b.append(h("span", "ico", key), h("b", "", label), h("span", "tile-n", list.length + " tests"));
  b.addEventListener("click", () => { setCat(key); $("#tests").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }); });
  tilesEl.append(b);
});
function setCat(key) {
  state.cat = key === "all" ? null : key;
  state.more = false;
  renderCatalogue();
}
function renderCatalogue() {
  const q = state.q.trim().toLowerCase();
  const limit = matchMedia("(max-width:640px)").matches ? 8 : 12;
  const out = $("#results"), count = $("#count");
  out.replaceChildren(); headEl.replaceChildren();
  tilesEl.hidden = !!(q || state.cat);
  headEl.hidden = !(state.cat && !q);
  if (!tilesEl.hidden) { count.textContent = TESTS.length + " tests in " + Object.keys(CATS).length + " categories"; return; }
  const list = (q ? searchTests(q) : TESTS).filter((t) => q || !state.cat || t.catKey === state.cat);
  if (!headEl.hidden) {
    headEl.append(btn("‹ All categories", "btn btn-o back-btn", () => setCat("all")), h("strong", "", CATS[state.cat]));
  }
  count.textContent = list.length + (list.length === 1 ? " test" : " tests") + (q ? " found" : "");
  out.style.animation = "none"; void out.offsetWidth; out.style.animation = "";
  if (!list.length) {
    out.append(h("div", "empty", "No tests match your search. Try a shorter name."));
    return;
  }
  (state.more ? list : list.slice(0, limit)).forEach((t) => {
    const r = h("article", "row");
    const name = h("div", "name");
    name.append(btn(t.name, "link-btn", () => openDetail(t.id), "View details for " + t.name));
    name.append(h("span", "row-desc", t.desc));
    if (q) name.append(h("span", "tag", t.cat));
    r.append(name, addBtn(t.id, "btn btn-o rb"));
    out.append(r);
  });
  if (!state.more && list.length > limit) {
    out.append(btn("Show " + (list.length - limit) + " more", "btn btn-o show-more", () => { state.more = true; renderCatalogue(); }));
  }
}
$("#q").addEventListener("input", (e) => { state.q = e.target.value; state.more = false; renderCatalogue(); });
renderCatalogue();
/* Open the catalogue dropdown and jump to it, optionally with a search term */
function openCatalogue(term) {
  if (term != null) { $("#q").value = term; state.q = term; setCat("all"); }
  $("#tests").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}
$$('a[href="#tests"]').forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); openCatalogue(); }));

/* Hero search: tapping the box lists ALL tests (grouped by category). Typing narrows the list.
   Tapping a test adds it straight to My Tests. */
const heroQ = $("#heroQ"), suggest = $("#heroSuggest");
let sugItems = [], sugActive = -1;
function hideSuggest() {
  suggest.hidden = true; sugActive = -1;
  heroQ.setAttribute("aria-expanded", "false");
  heroQ.removeAttribute("aria-activedescendant");
}
function setActive(i) {
  const lis = $$("li[role=option]", suggest);
  lis.forEach((li, n) => li.setAttribute("aria-selected", String(n === i)));
  sugActive = i;
  if (i >= 0) { heroQ.setAttribute("aria-activedescendant", lis[i].id); lis[i].scrollIntoView({ block: "nearest" }); }
  else heroQ.removeAttribute("aria-activedescendant");
}
function addFromSearch(t, btnEl) { onAddTap(t.id, btnEl); }
function renderSuggest() {
  const q = heroQ.value.trim();
  suggest.replaceChildren();
  sugActive = -1;
  sugItems = searchTests(q);
  suggest.append(h("li", "sg-head", q
    ? sugItems.length + (sugItems.length === 1 ? " test found. Tap it to add." : " tests found. Tap a test to add it.")
    : "All " + TESTS.length + " tests. Tap a test to add it to My Tests."));
  if (!sugItems.length) suggest.append(h("li", "sg-none", "No test matches. Try a shorter word, or tap Browse."));
  let lastCat = "";
  sugItems.forEach((t, i) => {
    if (!q && t.cat !== lastCat) { lastCat = t.cat; suggest.append(h("li", "sg-grp", t.cat)); }
    const li = h("li", "sg-item");
    li.id = "sg-" + i;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", "false");
    const main = h("span", "sg-main"), label = h("span", "sg-name");
    const lq = q.toLowerCase(), at = lq ? t.name.toLowerCase().indexOf(lq) : -1;
    if (at >= 0) label.append(t.name.slice(0, at), h("mark", "", t.name.slice(at, at + lq.length)), t.name.slice(at + lq.length));
    else label.textContent = t.name;
    main.append(label, h("span", "sg-desc", t.desc));
    const add = addBtn(t.id, "sg-add rb");
    add.tabIndex = -1;
    li.append(main, h("span", "sg-cat", q ? t.cat : ""), add);
    li.addEventListener("mousedown", (e) => e.preventDefault());
    li.addEventListener("click", (e) => { if (!e.target.closest("button")) addFromSearch(t, add); });
    add.addEventListener("mousedown", (e) => e.preventDefault());
    suggest.append(li);
  });
  suggest.hidden = false;
  suggest.scrollTop = 0;
  heroQ.setAttribute("aria-expanded", "true");
}
heroQ.addEventListener("input", renderSuggest);
heroQ.addEventListener("focus", renderSuggest);
heroQ.addEventListener("click", () => { if (suggest.hidden) renderSuggest(); });
heroQ.addEventListener("keydown", (e) => {
  const open = !suggest.hidden && sugItems.length;
  if (e.key === "ArrowDown") { e.preventDefault(); if (suggest.hidden) renderSuggest(); else if (open) setActive((sugActive + 1) % sugItems.length); }
  else if (e.key === "ArrowUp" && open) { e.preventDefault(); setActive((sugActive - 1 + sugItems.length) % sugItems.length); }
  else if (e.key === "Tab") hideSuggest();
  else if (e.key === "Escape" && !suggest.hidden) { e.stopPropagation(); hideSuggest(); }
});
document.addEventListener("click", (e) => { if (!e.target.closest("#heroSearch") && !e.target.closest(".hero-chips")) hideSuggest(); });
$("#heroSearch").addEventListener("submit", (e) => {
  e.preventDefault();
  if (sugActive >= 0 && sugItems[sugActive]) { addFromSearch(sugItems[sugActive], $("#sg-" + sugActive + " button")); return; }
  hideSuggest();
  openCatalogue(heroQ.value);
});
$$(".hero-chips button").forEach((b) => b.addEventListener("click", () => { heroQ.value = b.dataset.q; heroQ.focus(); renderSuggest(); }));

/* Popular tests slider: arrows scroll one card at a time */
(function popularSlider() {
  const track = $("#popularGrid"), prev = $("#popPrev"), next = $("#popNext");
  const stepBy = () => { const c = track.firstElementChild; return c ? c.getBoundingClientRect().width + 20 : 300; };
  const sync = () => {
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  prev.addEventListener("click", () => track.scrollBy({ left: -stepBy(), behavior: reduceMotion ? "auto" : "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: stepBy(), behavior: reduceMotion ? "auto" : "smooth" }));
  track.addEventListener("scroll", sync, { passive: true });
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next.click(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev.click(); }
  });
  window.addEventListener("resize", sync);

  /* Auto-scroll: drifts left, pauses on hover, focus or touch, loops back to the start */
  if (!reduceMotion) {
    let pos = 0, paused = false, resumeT = 0, wait = 0, last = 0, vis = true;
    const SPEED = 40; // pixels per second
    const hold = (on) => { paused = on; track.style.scrollSnapType = on ? "" : "none"; if (on) pos = track.scrollLeft; };
    const pause = () => { clearTimeout(resumeT); hold(true); };
    const resume = (d) => { clearTimeout(resumeT); resumeT = setTimeout(() => hold(false), d || 0); };
    track.addEventListener("mouseenter", pause);
    track.addEventListener("mouseleave", () => resume(300));
    track.addEventListener("focusin", pause);
    track.addEventListener("focusout", () => resume(300));
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", () => resume(3000), { passive: true });
    [prev, next].forEach((b) => { b.addEventListener("mouseenter", pause); b.addEventListener("mouseleave", () => resume(300)); b.addEventListener("click", () => { pause(); resume(3500); }); });
    track.addEventListener("scroll", () => { if (paused) pos = track.scrollLeft; }, { passive: true });
    new IntersectionObserver((e) => { vis = e[0].isIntersecting; }, { threshold: 0.1 }).observe(track);
    const tick = (t) => {
      const dt = Math.min(64, t - (last || t)); last = t;
      if (!paused && vis && !document.hidden) {
        const max = track.scrollWidth - track.clientWidth;
        if (wait > 0) { wait -= dt; if (wait <= 0) { pos = 0; track.scrollLeft = 0; wait = 0; } }
        else if (pos >= max - 1) { wait = 1200; }
        else { pos = Math.min(max, pos + SPEED * dt / 1000); track.scrollLeft = pos; }
      }
      requestAnimationFrame(tick);
    };
    hold(false);
    requestAnimationFrame(tick);
  }
  sync();
})();

/* =====================================================================
   FAQ
   ===================================================================== */

(function faqTabs() {
  const tabs = $("#faqTabs"), list = $("#faqList");
  let current = 0;
  function renderList() {
    list.replaceChildren();
    list.setAttribute("aria-labelledby", "faq-tab" + current);
    FAQ_GROUPS[current].items.forEach(([q, a], i) => {
      const item = h("div", "faq-item"), hd = h("h3");
      const trig = h("button", "faq-q", q);
      trig.type = "button"; trig.id = "faq-q" + i;
      trig.setAttribute("aria-expanded", "false"); trig.setAttribute("aria-controls", "faq-p" + i);
      const panel = h("div", "faq-p"), inner = h("div");
      panel.id = "faq-p" + i; panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", trig.id);
      inner.append(h("p", "", a)); panel.append(inner);
      trig.addEventListener("click", () => {
        const open = trig.getAttribute("aria-expanded") === "true";
        trig.setAttribute("aria-expanded", String(!open)); panel.classList.toggle("open", !open);
      });
      hd.append(trig); item.append(hd, panel); list.append(item);
    });
  }
  function select(i, focus) {
    current = i;
    $$("button", tabs).forEach((b, n) => { b.setAttribute("aria-selected", String(n === i)); b.tabIndex = n === i ? 0 : -1; b.classList.toggle("on", n === i); });
    renderList();
    if (focus) $$("button", tabs)[i].focus();
  }
  FAQ_GROUPS.forEach((g, i) => {
    const b = h("button", "faq-tab", g.label);
    b.type = "button"; b.id = "faq-tab" + i; b.setAttribute("role", "tab"); b.setAttribute("aria-controls", "faqList");
    b.addEventListener("click", () => select(i));
    b.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); select((i + 1) % FAQ_GROUPS.length, true); }
      if (e.key === "ArrowLeft") { e.preventDefault(); select((i - 1 + FAQ_GROUPS.length) % FAQ_GROUPS.length, true); }
    });
    tabs.append(b);
  });
  select(0);
})();

/* =====================================================================
   FEEDBACK FORM: emails the message to the lab inbox (via FormSubmit)
   ===================================================================== */
const FEEDBACK_EMAIL = "shivasatvikadiagnostics@gmail.com";
(function feedback() {
  const f = $("#feedbackForm");
  if (!f) return;
  const name = $("#fbName"), msg = $("#fbMsg"), status = $("#fbStatus"), sendBtn = $("#fbSend");
  let lastFb = 0;
  const setErr = (id, text, el) => { $("#e-" + id).textContent = text; el.setAttribute("aria-invalid", text ? "true" : "false"); };
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    setErr("fbname", "", name); setErr("fbmsg", "", msg); status.textContent = "";
    let bad = null;
    if (!name.value.trim()) { setErr("fbname", "Please enter your name.", name); bad = bad || name; }
    if (msg.value.trim().length < 3) { setErr("fbmsg", "Please write your message.", msg); bad = bad || msg; }
    if (bad) { bad.focus(); return; }
    if ($("#fbHoney").value) return;   // spam trap
    if (Date.now() - lastFb < 30000) { status.textContent = "Please wait a few seconds before sending again."; return; }
    lastFb = Date.now();
    const fbName = clean(name.value, 60), fbMsg = cleanLines(msg.value, 1000);
    sendBtn.disabled = true; sendBtn.textContent = "Sending…";
    try {
      const res = await fetch("https://formsubmit.co/ajax/" + FEEDBACK_EMAIL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          name: fbName,
          message: fbMsg,
          _subject: "New feedback from " + fbName + " (website)",
          _template: "table",
          _captcha: "false"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === "false" || data.success === false) throw new Error("send failed");
      f.reset();
      status.textContent = "Thank you! Your feedback has been sent.";
    } catch (err) {
      // fallback: open the visitor's own email app with the message ready
      const body = "Name: " + fbName + "\n\n" + fbMsg;
      status.textContent = "Could not send directly, opening your email app instead.";
      window.location.href = "mailto:" + FEEDBACK_EMAIL + "?subject=" + encodeURIComponent("Website feedback from " + fbName) + "&body=" + encodeURIComponent(body);
    } finally {
      sendBtn.disabled = false; sendBtn.textContent = "Send Feedback";
    }
  });
})();
$("#waFab").addEventListener("click", () => openCart());
   // hidden until a WhatsApp number is set

/* =====================================================================
   NAVIGATION, SCROLL EFFECTS AND ANIMATION
   ===================================================================== */
const nav = $("#mainNav"), menuBtn = $("#menuBtn"), scrim = $("#scrim");
function setMenu(open) {
  nav.classList.toggle("open", open);
  scrim.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
scrim.addEventListener("click", () => setMenu(false));
$$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { setMenu(false); menuBtn.focus(); } });

// Scroll progress, back-to-top and hero parallax share one rAF-throttled handler
const bar = $("#progress"), toTop = $("#toTop"), heroImg = $("#heroImg"), heroArt = $("#heroArt");
/* Hero headline: the words appear one by one (the full text stays readable for screen readers) */
(function heroWords() {
  const hd = $(".hero h1");
  if (!hd || reduceMotion) return;
  const text = hd.textContent.trim();
  hd.setAttribute("aria-label", text);
  hd.textContent = "";
  text.split(/\s+/).forEach((w, i) => {
    const sp = h("span", "hw", w);
    sp.style.setProperty("--w", i); sp.setAttribute("aria-hidden", "true");
    hd.append(sp, document.createTextNode(" "));
  });
})();
// Hero video: hide the SVG fallback once it plays; respect reduced motion
(function heroVideo() {
  const v = heroImg, fig = v.closest(".hero-photo");
  const on = () => { if (v.currentTime > 0 && !v.paused) fig.classList.add("vid-on"); };
  ["playing", "timeupdate"].forEach((ev) => v.addEventListener(ev, on));
  on();
  if (reduceMotion) { v.removeAttribute("autoplay"); v.removeAttribute("loop"); v.pause(); }
  else { v.playbackRate = 0.8; v.play?.().catch(() => {}); }   // slightly slower video
  document.addEventListener("visibilitychange", () => { if (reduceMotion) return; document.hidden ? v.pause() : v.play?.().catch(() => {}); });
})();
let ticking = false;
function onScroll() {
  const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
  toTop.hidden = y < 700;
  if (!reduceMotion) {
    document.documentElement.style.setProperty("--sy", Math.min(y, 2500));
    if (y < 900) { const t = "translateY(" + (y * 0.05) + "px)"; heroImg.style.transform = t; heroArt.style.transform = t; }
  }
  ticking = false;
}
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();
toTop.addEventListener("click", () => { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); $("#home").focus?.(); });

// Active nav link
if ("IntersectionObserver" in window) {
  const links = $$(".nav a");
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  ["home", "tests", "why", "contact"].forEach((id) => { const el = $("#" + id); if (el) spy.observe(el); });
}

// Reveal (staggered via --i) and count-up
function countUp(el) {
  const end = Number(el.dataset.count), suffix = el.dataset.suffix || "";
  if (reduceMotion || !end) { el.textContent = end + suffix; return; }
  const start = performance.now(), dur = 1200;
  (function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}
$$(".sec-h").forEach((el) => el.classList.add("reveal"));
$$(".split > div:first-child, .contact-grid > div:first-child").forEach((el) => el.classList.add("fx-left"));
$$(".split > figure, .form-card").forEach((el) => el.classList.add("fx-right"));
$$(".wide-photo, .banner").forEach((el) => el.classList.add("fx-zoom"));
$$(".lab-tile").forEach((el, i) => { el.style.setProperty("--i", i); el.addEventListener("click", () => { el.classList.remove("tap"); void el.offsetWidth; el.classList.add("tap"); }); });
$$(".steps li").forEach((el, i) => el.style.setProperty("--i", i % 6));
if ("IntersectionObserver" in window && !reduceMotion) {
  const io = new IntersectionObserver((entries, o) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    en.target.classList.add("in");
    o.unobserve(en.target);
  }), { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));
} else {
  $$(".reveal").forEach((el) => el.classList.add("in"));
}

$$(".fb-photo img").forEach((img) => {
  const gone = () => img.remove();
  if (img.complete && img.naturalWidth === 0) gone();
  img.addEventListener("error", gone);
});
/* Hide a photo slot whose file is missing so the instrument art shows through */
$$(".photo img").forEach((img) => {
  const miss = () => img.parentElement.classList.add("nophoto");
  if (img.complete && img.naturalWidth === 0) miss();
  img.addEventListener("error", miss);
});

/* INITIAL RENDER */
renderCatalogue();
/* Premium scroll interactions */
(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const progress = document.getElementById("progress");
  const navLinks = [
    ...document.querySelectorAll("#mainNav a[href^='#']")
  ];

  if (!header) return;

  let ticking = false;

  function updateScrollEffects() {
    const scrollTop = window.scrollY;
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("scrolled", scrollTop > 12);

    if (progress) {
      const percentage =
        maxScroll > 0 ? scrollTop / maxScroll : 0;

      progress.style.transform =
        `scaleX(${Math.min(1, Math.max(0, percentage))})`;
    }

    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScrollEffects);
    }
  }, { passive: true });

  updateScrollEffects();

  // Highlight the current navigation destination.
  const sections = navLinks
    .map(link => {
      const target = document.querySelector(link.getAttribute("href"));
      return target ? { link, target } : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      const current = sections.find(
        section => section.target === visible[0].target
      );

      if (!current) return;

      navLinks.forEach(link => {
        if (link === current.link) {
          link.classList.add("active");
          link.setAttribute("aria-current", "location");
        } else {
          link.classList.remove("active");
          link.removeAttribute("aria-current");
        }
      });
    }, {
      rootMargin: "-20% 0px -60% 0px",
      threshold: [0, 0.25, 0.5]
    });

    sections.forEach(section => observer.observe(section.target));
  }

  // Keep the existing reveal animations, but ensure content
  // remains accessible if IntersectionObserver is unavailable.
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(element => {
      element.classList.add("in");
    });
  }
})();


/* Hero: the "Since 1992" animation is always on. The ring draws and the year counts up once on load. */
(() => {
  const hero = document.getElementById("home");
  if (!hero) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const num = hero.querySelector(".hy-num b");
  const count = () => {
    const t0 = performance.now();
    (function tick(now) {
      const p = Math.min((now - t0) / 1600, 1);
      if (num) num.textContent = String(Math.round(1900 + (SINCE_YEAR - 1900) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  };
  setTimeout(() => { hero.classList.add("yrs-on"); count(); }, 400);
})();

/* Mobile app layer: lock scroll behind the menu, highlight the active tab-bar item */
(() => {
  const nav = document.getElementById("mainNav");
  if (nav) new MutationObserver(() => document.documentElement.classList.toggle("no-scroll", nav.classList.contains("open")))
    .observe(nav, { attributes: true, attributeFilter: ["class"] });
  matchMedia("(min-width:901px)").addEventListener?.("change", (e) => { if (e.matches) setMenu(false); });
  const tabs = [...document.querySelectorAll(".tabbar a[data-sec]")];
  if (!tabs.length || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (en.isIntersecting) tabs.forEach((a) => a.classList.toggle("on", a.dataset.sec === en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  tabs.forEach((a) => { const el = document.getElementById(a.dataset.sec); if (el) io.observe(el); });
})();


/* ===== How-to-book popup ===== */
(function howTo() {
  const dlg = $("#howDialog");
  $("#howFab").addEventListener("click", () => dlg.showModal());
  $("#howClose").addEventListener("click", () => dlg.close());
  $("#howGo").addEventListener("click", () => { dlg.close(); openCatalogue(); });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
})();

/* =====================================================================
   FIRST-VISIT BOOKING GUIDE
   Shown once, only to a new visitor: no earlier visit remembered on this
   device and nothing already in My Tests. Skip, Done, Esc, or adding a
   test yourself all mark it as seen, so it never returns.
   Test it again any time by opening the site with ?guide=1 at the end of
   the address.
   ===================================================================== */
(function bookingGuide() {
  const KEY = "ssdl_guide_seen";
  const forced = /[?&]guide=1(&|$)/.test(location.search);
  let seen = false;
  try { seen = !!localStorage.getItem(KEY); } catch (e) { return; }   // no storage: stay quiet rather than nag every visit
  if (!forced && (seen || cart.length)) return;

  const mobile = matchMedia("(max-width:768px)");
  const visible = (q) => { const e = $(q); return e && e.getBoundingClientRect().width > 0 ? e : null; };
  const STEPS = [
    { t: "1. Pick your test", p: "Type the test name here. Then tap + to add it.",
      target: () => visible("#heroSearch") },
    { t: "2. Open My Tests", p: "Tap here to see the tests you picked.",
      target: () => visible(".tabbar .tb-book") || visible("#cartBtn"), near: true },
    { t: "3. Book your slot", p: "Pick today or tomorrow, fill your details and tap Book. WhatsApp opens. Press Send to finish.",
      target: () => null }
  ];

  let i = 0, card = null, hl = null, timer = null;
  const markSeen = () => { try { localStorage.setItem(KEY, "1"); } catch (e) {} };
  function clearHl() { if (hl) hl.classList.remove("tip-hl"); hl = null; }
  function close() {
    markSeen(); clearHl(); clearTimeout(timer);
    document.removeEventListener("keydown", onKey);
    document.removeEventListener("ssdl:added", close);
    if (!card) return;
    card.classList.remove("show");
    const c = card; card = null;
    setTimeout(() => c.remove(), 350);
  }
  function onKey(e) { if (e.key === "Escape" && !document.querySelector("dialog[open]")) close(); }

  function render() {
    const s = STEPS[i], last = i === STEPS.length - 1;
    clearHl();
    card.replaceChildren();
    const dots = h("div", "tip-dots");
    dots.setAttribute("aria-hidden", "true");
    STEPS.forEach((_, k) => dots.append(h("i", k === i ? "on" : "")));
    const row = h("div", "tip-row");
    row.append(
      btn("Skip", "link-btn tip-skip", close),
      btn(last ? "Done" : "Next", "btn btn-p tip-next", () => { if (last) close(); else { i++; render(); } })
    );
    card.append(dots, h("h3", "", s.t), h("p", "", s.p), row);
    card.setAttribute("aria-label", "How to book, step " + (i + 1) + " of " + STEPS.length);

    // reset placement, then point at the real button
    card.style.top = card.style.right = "";
    const el = s.target();
    if (el) {
      hl = el; el.classList.add("tip-hl");
      if (!mobile.matches && s.near) {
        const r = el.getBoundingClientRect();
        card.style.top = Math.round(r.bottom + 14) + "px";
        card.style.right = Math.max(12, Math.round(innerWidth - r.right)) + "px";
        card.style.bottom = "auto"; card.style.left = "auto";
      } else { card.style.bottom = card.style.left = ""; }
      const r2 = el.getBoundingClientRect();
      if (r2.top < 70 && !s.near || r2.bottom > innerHeight - 90 && !s.near) el.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    } else { card.style.bottom = card.style.left = ""; }
    card.querySelector(".tip-next").focus({ preventScroll: true });
  }

  function show() {
    if (document.querySelector("dialog[open]")) return;   // never interrupt a dialog; they will see it next visit
    card = h("section", "tip");
    card.setAttribute("role", "region");
    card.setAttribute("aria-live", "polite");
    document.body.append(card);
    render();
    requestAnimationFrame(() => card && card.classList.add("show"));
    document.addEventListener("keydown", onKey);
    document.addEventListener("ssdl:added", close);       // they worked it out themselves
  }

  timer = setTimeout(show, forced ? 600 : 3500);
})();

/* Security: a list or form left in another tab, or restored by the Back button, is cleared */
window.addEventListener("storage", (e) => { if (e.key === CART_KEY) { cart = loadCart(); renderCart(); } });
window.addEventListener("pageshow", (e) => {
  if (e.persisted) { cart = loadCart(); if (!cart.length) clearBkForm(); renderCart(); }
});
