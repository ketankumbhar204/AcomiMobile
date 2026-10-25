import fs from 'fs';
import path from 'path';
import { shouldBlockMealShareExit } from '../mealShareExit';

jest.mock('@react-navigation/native', () => ({
  StackActions: {
    popTo: (name: string, params?: object) => ({ type: 'POP_TO', name, params }),
  },
}));

describe('meal share exit', () => {
  it('blocks system and header back only while saving', () => {
    expect(shouldBlockMealShareExit({ type: 'GO_BACK' }, true)).toBe(true);
    expect(shouldBlockMealShareExit({ type: 'POP' }, true)).toBe(true);
    expect(shouldBlockMealShareExit({ type: 'POP_TO_TOP' }, true)).toBe(true);
    expect(shouldBlockMealShareExit({ type: 'GO_BACK' }, false)).toBe(false);
    expect(shouldBlockMealShareExit({ type: 'POP_TO' }, true)).toBe(false);
    expect(shouldBlockMealShareExit({ type: 'REPLACE' }, true)).toBe(false);
  });

  it('leaves Meals in place of the finished share screen', () => {
    const screen = fs.readFileSync(
      path.join(__dirname, '../../screens/meals/MenuSharePreviewScreen.tsx'),
      'utf8',
    );
    expect(screen).toContain('mealShareExitAction({ spaceId, menuDate })');
    expect(screen).toContain('shouldBlockMealShareExit');
    expect(screen).not.toContain("navigation.navigate('MenuPlanning'");
    const exit = fs.readFileSync(path.join(__dirname, '../mealShareExit.ts'), 'utf8');
    expect(exit).toContain("StackActions.popTo('MenuPlanning'");
  });
});
