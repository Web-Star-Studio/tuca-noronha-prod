"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function SwitchDemo() {
  const [switches, setSwitches] = useState({
    default: false,
    primary: false,
    success: false,
    warning: false,
    danger: false,
  });

  const updateSwitch = (key: keyof typeof switches, value: boolean) => {
    setSwitches(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Switch Variants</CardTitle>
        <CardDescription>
          Diferentes variantes visuais para switches com cores distintas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="default-switch">Default (Verde)</Label>
          <Switch
            id="default-switch"
            variant="default"
            checked={switches.default}
            onCheckedChange={(checked) => updateSwitch("default", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="primary-switch">Primary (Azul)</Label>
          <Switch
            id="primary-switch"
            variant="primary"
            checked={switches.primary}
            onCheckedChange={(checked) => updateSwitch("primary", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="success-switch">Success (Verde)</Label>
          <Switch
            id="success-switch"
            variant="success"
            checked={switches.success}
            onCheckedChange={(checked) => updateSwitch("success", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="warning-switch">Warning (Amarelo)</Label>
          <Switch
            id="warning-switch"
            variant="warning"
            checked={switches.warning}
            onCheckedChange={(checked) => updateSwitch("warning", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="danger-switch">Danger (Vermelho)</Label>
          <Switch
            id="danger-switch"
            variant="danger"
            checked={switches.danger}
            onCheckedChange={(checked) => updateSwitch("danger", checked)}
          />
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">Estados atuais:</h4>
          <div className="text-xs space-y-1">
            {Object.entries(switches).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="capitalize">{key}:</span>
                <span className={value ? "text-green-600" : "text-gray-400"}>
                  {value ? "Ativo" : "Inativo"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 