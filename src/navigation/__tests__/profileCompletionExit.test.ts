import fs from 'fs';
import path from 'path';
import {
  backTargetAfterProfileCompletion,
  profileCompletionExitStack,
} from '../profileCompletionExit';

describe('profile completion exit navigation', () => {
  it('opens Profile with home behind it and drops the onboarding form', () => {
    const stack = profileCompletionExitStack();

    expect(stack.routes[stack.index]?.name).toBe('Profile');
    expect(stack.routes.map(route => route.name)).not.toContain('CompleteProfile');
    expect(backTargetAfterProfileCompletion(stack)).toBe('MemberTabs');
  });

  it('does not treat the finished form as the back target', () => {
    const stack = profileCompletionExitStack();
    expect(backTargetAfterProfileCompletion(stack)).not.toBe('CompleteProfile');
  });

  it('resets only after a successful onboarding submit', () => {
    const screen = fs.readFileSync(
      path.join(__dirname, '../../screens/onboarding/CompleteProfileScreen.tsx'),
      'utf8',
    );
    expect(screen).toContain('if (isEditMode)');
    expect(screen).toContain('navigation.goBack()');
    expect(screen).toContain('if (success)');
    expect(screen).toContain('resetAfterProfileCompletion()');
    const successAt = screen.indexOf('if (success)');
    const editAt = screen.indexOf('if (isEditMode)', successAt);
    const resetAt = screen.indexOf('resetAfterProfileCompletion()', successAt);
    expect(editAt).toBeGreaterThan(successAt);
    expect(resetAt).toBeGreaterThan(editAt);
  });
});
