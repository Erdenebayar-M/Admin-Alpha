'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type Theme } from './ThemeProvider';
import { Button } from './ui/button';

const cycle: Record<Theme, Theme> = { light: 'dark', dark: 'system', system: 'light' };
const labels: Record<Theme, string> = { light: 'Light', dark: 'Dark', system: 'System' };

const Icon = ({ theme }: { theme: Theme }) => {
  if (theme === 'dark') return <Moon className="h-4 w-4" />;
  if (theme === 'light') return <Sun className="h-4 w-4" />;
  return <Monitor className="h-4 w-4" />;
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(cycle[theme])}
      title={`Theme: ${labels[theme]}`}
      aria-label={`Switch theme (current: ${labels[theme]})`}
    >
      <Icon theme={theme} />
    </Button>
  );
}
