import { expect, test } from '@playwright/test'

test('opening, first story beat, and architecture remain visually stable', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveScreenshot('opening.png', { fullPage: true })
  await page.keyboard.press('Space')
  await expect(page.getByRole('heading', { name: 'One alarm is not one cause' })).toBeVisible()
  await expect(page).toHaveScreenshot('first-story-beat.png', { fullPage: true })
  await page.goto('/?act=1&scene=0')
  await expect(page).toHaveScreenshot('architecture.png', { fullPage: true })
  await page.goto('/?act=2&scene=0')
  await expect(page).toHaveScreenshot('live-journey.png', { fullPage: true })
})

test('core controls are keyboard reachable', async ({ page }) => {
  await page.goto('/?act=0&scene=0')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Restart presentation' })).toBeFocused()
})

test('desktop story acts fit one viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'rehearsal-mobile', 'Mobile is a scrollable rehearsal view')
  for (const act of [0, 1, 2, 3, 4]) {
    await page.goto(`/?act=${act}&scene=0`)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
  }
})

test('live journey owns canvas clicks and accumulates returned metrics', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'rehearsal-mobile', 'Mobile rehearsal uses the explicit step buttons')
  await page.route('**/ready', (route) => route.fulfill({ json: { status: 'ready' } }))
  let run = 0
  await page.route('**/api/investigate', (route) => {
    run += 1
    const hardware = run === 1
    return route.fulfill({ json: {
      alarm_id: `alarm-${run}`,
      current_observations_with_tool_provenance: [
        { evidence_id: hardware ? 'hardware-1' : 'openshift_platform-1', scope: 'cause', state: 'present', provenance: 'live-test' },
        { evidence_id: 'network-1', scope: 'network', state: 'present', provenance: 'live-test' },
        { evidence_id: 'control-1', scope: 'control', state: 'absent', provenance: 'live-test' },
      ],
      historical_context_with_source_revision: [{ source_id: 'runbook', source_revision: 'v1' }],
      primary_hypothesis: { cause: hardware ? 'hardware_timing' : 'platform_timing', supporting_evidence_ids: [hardware ? 'hardware-1' : 'openshift_platform-1'] },
      unknowns_and_conflicts: [], next_discriminating_test: 'Compare synchronized events', action_requires_human_approval: true, action_executed: false,
    } })
  })
  await page.goto('/?act=2&scene=0')
  const stage = page.getByTestId('live-click-stage')
  await stage.click({ position: { x: 20, y: 20 } })
  await expect(page.getByText(/Click anywhere to run the next/)).toBeVisible()
  await stage.click({ position: { x: 20, y: 20 } })
  await expect(page.getByText('hardware_timing')).toBeVisible()
  await stage.click({ position: { x: 20, y: 20 } })
  await expect(page.getByText('platform_timing')).toBeVisible()
  await expect(page.getByText('hardware_timing')).toBeVisible()
  await expect(page).toHaveURL(/act=2/)
})
