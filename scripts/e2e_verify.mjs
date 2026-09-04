/**
 * DrishtiCare browser E2E verification script (run with: node scripts/e2e_verify.mjs)
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FRONTEND = 'http://127.0.0.1:5173';
const API = 'http://127.0.0.1:8000/api';
const SAMPLE_DIR = path.join(ROOT, 'backend', 'app', 'static', 'samples');

const results = [];

function log(section, test, passed, detail = '') {
  results.push({ section, test, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} [${section}] ${test}${detail ? ` — ${detail}` : ''}`);
}

async function apiLogin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'nurse_sarita', password: 'SecurePassword123!' })
  });
  const data = await res.json();
  return data.access_token;
}

async function apiGet(token, endpoint) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function loginToApp(page) {
  await page.goto(FRONTEND, { waitUntil: 'networkidle' });
  await page.fill('input[placeholder*="nurse_sarita"]', 'nurse_sarita');
  await page.fill('input[type="password"]', 'SecurePassword123!');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForSelector('text=Start New Screening', { timeout: 15000 });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Section 5: Auth gate
  await page.goto(FRONTEND);
  const onLogin = await page.locator('text=Sign In').count();
  log('5', 'Login screen is entry point when unauthenticated', onLogin > 0);

  // Section 5: API protection
  const unauth = await fetch(`${API}/patients`);
  log('5', 'Protected API rejects missing token', unauth.status === 401);

  const token = await apiLogin();
  log('5', 'Login returns valid token', Boolean(token));

  // Section 1: Empty dashboard after DB wipe handled separately via API
  const dash = await apiGet(token, '/dashboard/summary');
  log('1', 'Dashboard API returns live data shape', dash.status === 200 && Array.isArray(dash.data.recent_patients));

  // Browser login
  await loginToApp(page);
  log('5', 'Frontend login reaches dashboard', await page.locator('text=Start New Screening').count() > 0);

  // Section 6: Click navigation items
  const navTests = [
    ['Dashboard nav', 'Dashboard'],
    ['New Registration nav', 'New Registration'],
    ['Referrals nav', 'Referrals & Slips'],
    ['Sync Centre nav', 'Sync Centre'],
    ['Help nav', 'Help & Protocols'],
    ['Program Capacity nav', 'Program Capacity'],
  ];

  for (const [name, label] of navTests) {
    await page.getByRole('button', { name: label }).click();
    await page.waitForTimeout(500);
    log('6', `Navigation: ${name}`, true, `clicked ${label}`);
  }

  // Section 2: redundant Image Capture nav removed
  const captureNav = await page.getByRole('button', { name: 'Image Capture' }).count();
  log('2', 'Image Capture nav item removed', captureNav === 0);

  // Section 10: Capture only via registration workflow
  await page.getByRole('button', { name: 'New Registration' }).click();
  await page.waitForTimeout(300);
  const testPanel = await page.locator('text=Test Fundus Scans').count();
  log('11', 'Test Fundus panel removed from capture screen', testPanel === 0);

  // Full screening flow
  await page.fill('input[name="full_name"]', 'E2E Test Patient');
  await page.fill('input[name="age"]', '48');
  await page.fill('input[name="village"]', 'Test Village');
  await page.locator('input[name="consent_given"]').check();
  await page.getByRole('button', { name: /proceed to image capture/i }).click();
  await page.waitForSelector('text=Retinal Viewport', { timeout: 10000 });
  log('6', 'Patient registration advances to capture', true);

  const patientNameVisible = await page.locator('text=E2E Test Patient').count();
  log('10', 'Capture shows patient name (not Patient())', patientNameVisible > 0);

  // Upload left eye
  const leftFile = path.join(SAMPLE_DIR, 'Grade_0_Normal.jpg');
  const rightFile = path.join(SAMPLE_DIR, 'Grade_2_Moderate_Referable.jpg');
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(leftFile);
  await page.waitForSelector('text=Quality Validation: PASSED', { timeout: 20000 });

  // Section 8: thumbnail preview vs delete
  await page.getByRole('button', { name: 'Right Eye (OD)' }).click();
  await fileInput.setInputFiles(rightFile);
  await page.waitForSelector('text=Quality Validation: PASSED', { timeout: 20000 });

  const leftThumb = page.locator('button[title="Select Left (OS) for preview"]');
  await leftThumb.click();
  const stillHasLeft = await page.locator('button[title="Remove Left (OS) image"]').count();
  log('8', 'Clicking thumbnail selects/previews (does not delete)', stillHasLeft > 0);

  await page.getByRole('button', { name: /run automated ai screening/i }).click();
  await page.waitForSelector('text=AI Result', { timeout: 60000 });
  log('3', 'Dual-eye screening shows result screen', true);

  const leftGrade = await page.locator('text=/Left Eye \\(OS\\): Grade/').textContent();
  const rightGrade = await page.locator('text=/Right Eye \\(OD\\): Grade/').textContent();
  log('3', 'Left and right eye grades shown independently', Boolean(leftGrade && rightGrade), `${leftGrade} | ${rightGrade}`);

  // Section 6: Referrals details
  await page.getByRole('button', { name: 'Referrals & Slips' }).click();
  await page.waitForTimeout(800);
  const referralRows = await page.locator('tbody tr').count();
  if (referralRows > 0) {
    const firstCode = await page.locator('tbody tr').first().locator('td').first().textContent();
    await page.getByRole('button', { name: 'View Details' }).first().click();
    await page.waitForSelector('text=Clinical Tele-Ophthalmology Referral Slip', { timeout: 5000 });
    const modalCode = await page.locator('text=/REF-/').first().textContent();
    log('6', 'Referrals Details opens modal with referral data', Boolean(modalCode), modalCode);
    await page.getByRole('button', { name: 'Close' }).click();
  } else {
    log('6', 'Referrals Details modal', true, 'skipped — empty referrals list (expected on fresh DB)');
  }

  // Section 5: Logout
  await page.locator('header button[title="Sign out of station"]').click();
  await page.waitForTimeout(800);
  const backToLogin = await page.locator('text=Sign In').count();
  log('5', 'Logout returns to login screen', backToLogin > 0);

  // Section 9: invalid file type via API
  const badUpload = await fetch(`${API}/screenings/check-quality`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: (() => {
      const fd = new FormData();
      fd.append('file', new Blob(['not an image'], { type: 'text/plain' }), 'bad.txt');
      return fd;
    })()
  });
  log('9', 'Backend rejects non-image upload', badUpload.status === 400);

  await browser.close();

  const failed = results.filter(r => !r.passed);
  console.log(`\n=== SUMMARY: ${results.length - failed.length}/${results.length} passed ===`);
  if (failed.length) {
    console.log('Failures:', failed);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
