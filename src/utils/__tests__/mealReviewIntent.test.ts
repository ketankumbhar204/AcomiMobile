import fs from 'fs';
import path from 'path';
import {
  resolveMealReviewIntent,
  shouldOpenExternalShare,
  shouldPublishMenu,
} from '../mealReviewIntent';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
}

describe('meal review intent', () => {
  it('keeps external sharing off the Save path', () => {
    expect(resolveMealReviewIntent('save')).toBe('save');
    expect(resolveMealReviewIntent('share')).toBe('share');
    expect(resolveMealReviewIntent(undefined)).toBe('share');
    expect(resolveMealReviewIntent('publish')).toBe('share');
    expect(resolveMealReviewIntent('reshare')).toBe('reshare');
    expect(shouldOpenExternalShare('save')).toBe(false);
    expect(shouldOpenExternalShare('share')).toBe(true);
    expect(shouldOpenExternalShare('reshare')).toBe(true);
    expect(shouldPublishMenu('save')).toBe(true);
    expect(shouldPublishMenu('share')).toBe(true);
    expect(shouldPublishMenu('reshare')).toBe(false);
  });

  it('saves the current meal and returns without opening share', () => {
    const editor = source('../../screens/meals/DailyMenuEditScreen.tsx');
    expect(editor).toContain('onSaveDraft={() => void persist()}');
    expect(editor).toContain('onPress={() => void persist()}');
    expect(editor).not.toContain("openMealReview('save')");
    expect(editor).toContain("intent: 'share'");
    expect(editor).toContain('navigation.goBack()');
    expect(editor).toContain("t('meals.success.saved')");
    expect(editor).toContain('saveMenuDraft(spaceId, menuDate, mealType,');
    expect(editor).toContain("label={t('meals.actions.save')}");
    expect(editor).toContain("label={t('meals.actions.share')}");
    expect(editor).toContain("t('meals.actions.deleteDraft')");
    expect(editor).toContain("if (status !== 'DRAFT')");
    expect(editor).toContain("text: t('meals.actions.saveDraft')");
    const footer = source('../../components/meals/ProgressiveMealPlanningFooter.tsx');
    expect(footer).toContain("label: t('meals.actions.save')");
    expect(footer).toContain("label: t('meals.actions.share')");
    expect(footer).toContain('compact');
    expect(footer).toContain('selectedMealsNextExtras');
    expect(footer).toContain('onContinue={onContinueToExtras}');
    expect(footer).not.toContain('continueTitle=');
    expect(footer).not.toContain("t('meals.actions.saveDraft')");
    expect(footer).not.toContain("t('meals.actions.shareMeal')");
  });

  it('publishes and opens polls before the share sheet, and skips the sheet for Save', () => {
    const preview = source('../../screens/meals/MenuSharePreviewScreen.tsx');
    const publishAt = preview.indexOf('publishDraftMenusForTypes(');
    const pollsAt = preview.indexOf('openPollsForMealTypes(');
    const failedPollAt = preview.indexOf('if (opened === 0)');
    const shareGateAt = preview.indexOf('if (externalShare)');
    const shareSheetAt = preview.indexOf('Share.share(');
    expect(publishAt).toBeGreaterThan(-1);
    expect(pollsAt).toBeGreaterThan(publishAt);
    expect(failedPollAt).toBeGreaterThan(pollsAt);
    expect(shareGateAt).toBeGreaterThan(failedPollAt);
    expect(shareSheetAt).toBeGreaterThan(shareGateAt);
    expect(preview).toContain('shouldOpenExternalShare');
    expect(preview).toContain('shouldPublishMenu');
    expect(preview.indexOf('if (publishMenu)')).toBeLessThan(publishAt);
    expect(preview).toContain("t('meals.actions.save')");
    expect(preview).toContain("t('meals.planning.copyMessage')");
    expect(preview).toContain('includePublished: intent === \'reshare\'');
  });

  it('puts Share or Reshare under the meal cards and keeps the secondary links', () => {
    const screen = source('../../screens/meals/MenuPlanningScreen.tsx');
    expect(screen).toContain('resolveDayShareAction(statusSummary)');
    expect(screen).toContain("intent: action === 'reshare' ? 'reshare' : 'save'");
    expect(screen).toContain("navigateMain('MenuLibrary'");
    expect(screen).toContain("navigateMain('DailyMenuToday'");
    expect(screen).toContain("navigateMain('SubscriptionPlans'");
    const overview = source('../../components/meals/MenuPlanningDayOverview.tsx');
    expect(overview.indexOf('styles.mealStrip')).toBeLessThan(overview.indexOf('styles.shareBlock'));
    expect(overview).toContain('meals.planning.dayShare.reshare');
    expect(overview).toContain('meals.planning.dayShare.emptyHint');
    expect(overview).not.toContain('styles.dayShareAction');
  });
});
