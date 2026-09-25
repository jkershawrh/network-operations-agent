import { expect, test } from '@playwright/test'

test('opening, first story beat, and architecture remain visually stable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page).toHaveScreenshot('opening.png', { fullPage: true })
  await page.keyboard.press('Space')
  await expect(page.getByText('PTP synchronization degraded')).toBeVisible()
  await expect(page.getByText('One alarm is not one cause.')).toBeVisible()
  await expect(page.getByText('02:17 · timing alarm · production network')).toBeHidden()
  await expect(page).toHaveScreenshot('first-story-beat.png', { fullPage: true })
  await page.goto('/?act=1&scene=0')
  await expect(page).toHaveScreenshot('architecture.png', { fullPage: true })
  await page.getByRole('button', { name: 'Reveal technical boundary' }).click()
  await expect(page.getByText('Architecture answer')).toBeVisible()
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

test('live journey runs both conditions and accumulates returned evidence', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'rehearsal-mobile', 'Mobile rehearsal uses the explicit step buttons')
  await page.route('**/ready', (route) => route.fulfill({ json: { status: 'ready' } }))
  let run = 0
  await page.route('**/api/investigate', (route) => {
    run += 1
    const hardware = run === 1
    return route.fulfill({ json: {
      investigation_id: `run-${run}`,
      alarm_id: `alarm-${run}`,
      current_observations_with_tool_provenance: [
        { evidence_id: hardware ? 'hardware-1' : 'openshift_platform-1', scope: hardware ? 'hardware' : 'openshift_platform', signal: hardware ? 'nic_timestamp_fault' : 'platform_timing_fault', state: 'present', observed_at: '2026-09-22T08:01:00Z', provenance: 'live-test' },
        { evidence_id: 'network-1', scope: 'network', signal: 'timing_alarm', state: 'present', observed_at: '2026-09-22T08:01:00Z', provenance: 'live-test' },
        { evidence_id: 'control-1', scope: 'control', signal: 'alternate_fault', state: 'absent', observed_at: '2026-09-22T08:01:00Z', provenance: 'live-test' },
      ],
      historical_context_with_source_revision: [{ evidence_id: 'knowledge-1', source_id: 'runbook', source_revision: 'v1', excerpt: 'Compare current timing signals before assigning a cause.' }],
      primary_hypothesis: { cause: hardware ? 'hardware_timing' : 'platform_timing', supporting_evidence_ids: [hardware ? 'hardware-1' : 'openshift_platform-1'] },
      alternate_hypotheses: [hardware ? 'platform_timing' : 'hardware_timing'], unknowns_and_conflicts: [], next_discriminating_test: 'Compare synchronized events', proposed_action: 'Have an operator review the evidence', action_requires_human_approval: true, action_executed: false,
      model_draft: { status: 'unverified_draft_for_human_review', model: 'granite-3.2-8b-tools', runtime: 'Intel Xeon 6767P', evidence_ids: [hardware ? 'hardware-1' : 'openshift_platform-1'] },
    } })
  })
  await page.goto('/?act=2&scene=0')
  await page.waitForTimeout(450)
  const topologyButton = page.getByRole('button', { name: 'Inspect technical topology' })
  const initialTopologyBox = await topologyButton.boundingBox()
  const initialPrimaryBox = await page.locator('.workspace-actions .button-primary').boundingBox()
  const expectActionsAnchored = async () => {
    const topologyBox = await topologyButton.boundingBox()
    const primaryBox = await page.locator('.workspace-actions .button-primary').boundingBox()
    expect(Math.abs(topologyBox!.x - initialTopologyBox!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(topologyBox!.y - initialTopologyBox!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(primaryBox!.y - initialPrimaryBox!.y)).toBeLessThanOrEqual(1)
  }
  await page.getByRole('button', { name: /Run live investigation/ }).click()
  await expect(page.getByText('What did the agent find?')).toBeVisible()
  await expectActionsAnchored()
  await expect(page.getByText('nic timestamp fault · present')).toBeVisible()
  await page.getByRole('button', { name: /Follow the evidence/ }).click()
  await expectActionsAnchored()
  await expect(page.getByText('hardware timing').first()).toBeVisible()
  await expect(page.getByText('INTEL CPU LIVE', { exact: true })).toBeVisible()
  await expect(page.getByText('granite-3.2-8b-tools').first()).toBeVisible()
  await expect(page.getByText('EVIDENCE POLICY')).toBeVisible()
  await page.getByRole('button', { name: 'Inspect technical topology' }).click()
  await expect(page.getByRole('dialog', { name: 'Technical topology detail' })).toBeVisible()
  await expect(page.locator('[data-node="policy"]')).toHaveClass(/focus/)
  await expect(page.locator('[data-node="model"]')).toContainText('granite-3.2-8b-tools')
  await expect(page.locator('[data-node="model"]')).toContainText('Intel Xeon 6767P')
  await expect(page.locator('[data-node="mcp"]')).toContainText('3 live observations')
  await page.getByRole('button', { name: 'Close topology ×' }).click()
  await expect(page.getByRole('dialog', { name: 'Technical topology detail' })).toBeHidden()
  await page.getByRole('button', { name: 'Change the evidence →', exact: true }).click()
  await expect(page.getByText('Measured comparison')).toBeVisible()
  const finalTopologyBox = await topologyButton.boundingBox()
  expect(Math.abs(finalTopologyBox!.x - initialTopologyBox!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs(finalTopologyBox!.y - initialTopologyBox!.y)).toBeLessThanOrEqual(1)
  await expect(page.getByText('platform timing').first()).toBeVisible()
  await expect(page.getByText(/Evidence—not the label—changed the decision/)).toBeVisible()
  await expect(page).toHaveURL(/act=2/)
  await page.goto('/?act=4&scene=0')
  await expect(page.getByText('THE RESULT')).toBeVisible()
  await expect(page.getByText('HUMAN AUTHORITY')).toBeVisible()
  await expect(page.getByText('Zero automated actions')).toBeVisible()
  await expect(page.getByText('INTEL CPU EXPLANATION')).toBeVisible()
  await expect(page.getByText(/wording only · no evidence or action authority/)).toBeVisible()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true)
})
