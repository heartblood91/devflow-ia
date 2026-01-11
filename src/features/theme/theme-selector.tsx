"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <RadioGroup value={theme} onValueChange={setTheme}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="light" id="light" />
          <Label
            htmlFor="light"
            className="flex cursor-pointer items-center gap-2"
          >
            <Sun className="size-4" />
            Light
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="dark" id="dark" />
          <Label
            htmlFor="dark"
            className="flex cursor-pointer items-center gap-2"
          >
            <Moon className="size-4" />
            Dark
          </Label>
        </div>
        <div className="flex items-center space-x-3">
          <RadioGroupItem value="system" id="system" />
          <Label
            htmlFor="system"
            className="flex cursor-pointer items-center gap-2"
          >
            <Monitor className="size-4" />
            System
          </Label>
        </div>
      </div>
    </RadioGroup>
  );
};
