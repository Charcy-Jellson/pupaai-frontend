"use client";

import { RoleGate } from "@/components/common/role-gate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Key,
  Globe,
  Save
} from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <RoleGate
      allowedRoles={["admin"]}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-muted-foreground max-w-md">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Settings className="w-5 h-5 text-white" />
            </div>
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure system-wide settings and preferences
          </p>
        </div>

        {/* API Configuration */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-violet-400" />
              API Configuration
            </CardTitle>
            <CardDescription>
              Configure external API integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gemini-key">Google Gemini API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="••••••••••••••••"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Configured via environment variables for security
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="openai-key">OpenAI API Key</Label>
              <Input
                id="openai-key"
                type="password"
                placeholder="••••••••••••••••"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Configured via environment variables for security
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-violet-400" />
              Database & Storage
            </CardTitle>
            <CardDescription>
              Supabase configuration and storage settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Supabase URL</Label>
              <Input
                id="supabase-url"
                type="text"
                placeholder="https://your-project.supabase.co"
                disabled
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-cleanup Old Images</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically remove images older than 30 days
                </p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-violet-400" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure system notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  Send email notifications for important events
                </p>
              </div>
              <Switch disabled />
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New User Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Notify admins when new users sign up
                </p>
              </div>
              <Switch disabled />
            </div>
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-violet-400" />
              General
            </CardTitle>
            <CardDescription>
              General system preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Temporarily disable access for non-admin users
                </p>
              </div>
              <Switch disabled />
            </div>
            <Separator className="bg-border/50" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Registration</Label>
                <p className="text-xs text-muted-foreground">
                  Allow new users to sign up
                </p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button variant="gradient" disabled>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Settings management is currently in development. 
          Configure settings via environment variables.
        </p>
      </div>
    </RoleGate>
  );
}


