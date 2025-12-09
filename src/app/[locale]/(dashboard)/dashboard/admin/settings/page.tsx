"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { RoleGate } from "@/components/common/role-gate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Key,
  Globe,
  Save,
  Wand2,
  Loader2,
  Check,
  X,
  Plus,
  Pencil,
  Trash2,
  Image,
  Video,
  FileText
} from "lucide-react";
import * as api from "@/lib/api";
import type { AIModel, TaskType, ProviderType, DefaultModelSetting } from "@/lib/api";

const TASK_TYPE_INFO: Record<TaskType, { label: string; icon: typeof Image; features: string[] }> = {
  image_processing: {
    label: "Image",
    icon: Image,
    features: ["remove_background", "extract_logo", "remove_logo"],
  },
  video_processing: {
    label: "Video",
    icon: Video,
    features: [],
  },
  text_processing: {
    label: "Text",
    icon: FileText,
    features: [],
  },
};

const FEATURE_LABELS: Record<string, string> = {
  remove_background: "Remove Background",
  extract_logo: "Extract Logo",
  remove_logo: "Remove Logo/Watermark",
};

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const pathname = usePathname();
  const t = useTranslations("admin.settings");
  const tc = useTranslations("common");
  
  // Models state
  const [models, setModels] = useState<AIModel[]>([]);
  const [availableProviders, setAvailableProviders] = useState<Record<ProviderType, boolean>>({
    gemini: false,
    openai: false,
  });
  const [defaultModels, setDefaultModels] = useState<DefaultModelSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTaskType, setActiveTaskType] = useState<TaskType>("image_processing");
  
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AIModel | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    provider: "gemini" as ProviderType,
    model_id: "",
    display_name: "",
    description: "",
    is_active: true,
  });

  // Close dialogs when route changes to prevent overlay from getting stuck
  useEffect(() => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  }, [pathname]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [modelsRes, defaultsRes, providersRes] = await Promise.all([
        api.getAIModels(undefined, undefined, false), // Get all models including inactive
        api.getDefaultModels(),
        api.getProvidersStatus(), // Fetch from FastAPI backend
      ]);
      
      if (modelsRes.success && modelsRes.data) {
        setModels(modelsRes.data.models);
      }
      
      if (providersRes.success && providersRes.data) {
        setAvailableProviders(providersRes.data);
      }
      
      if (defaultsRes.success && defaultsRes.data) {
        setDefaultModels(defaultsRes.data.defaults);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleAddModel = async () => {
    if (!formData.model_id || !formData.display_name) {
      toast({
        title: "Validation Error",
        description: "Model ID and Display Name are required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const response = await api.createAIModel({
      ...formData,
      task_type: activeTaskType,
    });

    if (response.success && response.data) {
      setModels((prev) => [...prev, response.data!]);
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Model Added",
        description: `${formData.display_name} has been added.`,
      });
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to add model",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleEditModel = async () => {
    if (!editingModel) return;

    setIsSaving(true);
    const response = await api.updateAIModel(editingModel.id, formData);

    if (response.success && response.data) {
      setModels((prev) =>
        prev.map((m) => (m.id === editingModel.id ? response.data! : m))
      );
      setIsEditDialogOpen(false);
      setEditingModel(null);
      resetForm();
      toast({
        title: "Model Updated",
        description: `${formData.display_name} has been updated.`,
      });
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to update model",
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  const handleDeleteModel = async (model: AIModel) => {
    if (!confirm(`Are you sure you want to delete "${model.display_name}"?`)) {
      return;
    }

    const response = await api.deleteAIModel(model.id);

    if (response.success) {
      setModels((prev) => prev.filter((m) => m.id !== model.id));
      toast({
        title: "Model Deleted",
        description: `${model.display_name} has been deleted.`,
      });
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to delete model",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (feature: string, modelId: string) => {
    const response = await api.setDefaultModel(activeTaskType, feature, modelId);

    if (response.success) {
      // Reload defaults
      const defaultsRes = await api.getDefaultModels();
      if (defaultsRes.success && defaultsRes.data) {
        setDefaultModels(defaultsRes.data.defaults);
      }
      toast({
        title: "Default Updated",
        description: `Default model for ${FEATURE_LABELS[feature]} has been updated.`,
      });
    } else {
      toast({
        title: "Error",
        description: response.error || "Failed to set default model",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (model: AIModel) => {
    setEditingModel(model);
    setFormData({
      provider: model.provider,
      model_id: model.model_id,
      display_name: model.display_name,
      description: model.description || "",
      is_active: model.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      provider: "gemini",
      model_id: "",
      display_name: "",
      description: "",
      is_active: true,
    });
  };

  const filteredModels = models.filter((m) => m.task_type === activeTaskType);
  const taskInfo = TASK_TYPE_INFO[activeTaskType];

  const getDefaultModelForFeature = (feature: string): string | null => {
    const setting = defaultModels.find(
      (d) => d.task_type === activeTaskType && d.feature === feature
    );
    return setting?.model_id || null;
  };

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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Settings className="w-5 h-5 text-white" />
            </div>
            System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure AI models and system preferences
          </p>
        </div>

        {/* AI Model Management */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-violet-400" />
                  AI Model Management
                </CardTitle>
                <CardDescription>
                  Configure and manage AI models for different tasks
                </CardDescription>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider Status */}
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">API Status:</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={availableProviders.gemini ? "default" : "secondary"}
                  className={availableProviders.gemini ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                >
                  {availableProviders.gemini ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <X className="w-3 h-3 mr-1" />
                  )}
                  Gemini
                </Badge>
                <Badge 
                  variant={availableProviders.openai ? "default" : "secondary"}
                  className={availableProviders.openai ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                >
                  {availableProviders.openai ? (
                    <Check className="w-3 h-3 mr-1" />
                  ) : (
                    <X className="w-3 h-3 mr-1" />
                  )}
                  OpenAI
                </Badge>
              </div>
            </div>

            {/* Task Type Tabs */}
            <Tabs value={activeTaskType} onValueChange={(v) => setActiveTaskType(v as TaskType)}>
              <TabsList className="grid w-full grid-cols-3">
                {Object.entries(TASK_TYPE_INFO).map(([type, info]) => {
                  const Icon = info.icon;
                  return (
                    <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {info.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {Object.keys(TASK_TYPE_INFO).map((type) => (
                <TabsContent key={type} value={type} className="space-y-4 mt-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                    </div>
                  ) : (
                    <>
                      {/* Models Table */}
                      <div className="rounded-lg border border-border/50 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Provider</TableHead>
                              <TableHead>Model ID</TableHead>
                              <TableHead>Display Name</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredModels.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                  No models configured for {taskInfo.label.toLowerCase()} processing.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredModels.map((model) => (
                                <TableRow key={model.id}>
                                  <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                      {model.provider}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {model.model_id}
                                  </TableCell>
                                  <TableCell>{model.display_name}</TableCell>
                                  <TableCell>
                                    <Badge variant={model.is_active ? "default" : "secondary"}>
                                      {model.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => openEditDialog(model)}
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDeleteModel(model)}
                                        className="text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Default Models */}
                      {taskInfo.features.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium">Default Models by Feature</h3>
                          <div className="space-y-3">
                            {taskInfo.features.map((feature) => (
                              <div key={feature} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                                <div>
                                  <Label>{FEATURE_LABELS[feature]}</Label>
                                  <p className="text-xs text-muted-foreground">
                                    Default model for {FEATURE_LABELS[feature].toLowerCase()}
                                  </p>
                                </div>
                                <Select
                                  value={getDefaultModelForFeature(feature) || "none"}
                                  onValueChange={(value) => {
                                    if (value !== "none") {
                                      handleSetDefault(feature, value);
                                    }
                                  }}
                                >
                                  <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Select model" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none" disabled>
                                      Select a model
                                    </SelectItem>
                                    {filteredModels.length === 0 ? (
                                      <SelectItem value="no-models" disabled>
                                        No models in database
                                      </SelectItem>
                                    ) : (
                                      filteredModels
                                        .filter((m) => m.is_active)
                                        .map((model) => (
                                          <SelectItem 
                                            key={model.id} 
                                            value={model.id}
                                            disabled={!availableProviders[model.provider]}
                                          >
                                            {model.display_name}
                                            {!availableProviders[model.provider] && " (not configured)"}
                                          </SelectItem>
                                        ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-violet-400" />
              API Configuration
            </CardTitle>
            <CardDescription>
              API keys are configured via environment variables for security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Google Gemini</Label>
                    <p className="text-xs text-muted-foreground">GOOGLE_GEMINI_API_KEY</p>
                  </div>
                  <Badge variant={availableProviders.gemini ? "default" : "secondary"}>
                    {availableProviders.gemini ? "Configured" : "Not Set"}
                  </Badge>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>OpenAI</Label>
                    <p className="text-xs text-muted-foreground">OPENAI_API_KEY</p>
                  </div>
                  <Badge variant={availableProviders.openai ? "default" : "secondary"}>
                    {availableProviders.openai ? "Configured" : "Not Set"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other Settings (collapsed) */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-violet-400" />
                Database
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Supabase configured via environment variables
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-violet-400" />
                General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                System preferences coming soon
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Model Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Model</DialogTitle>
            <DialogDescription>
              Add a new AI model for {taskInfo.label.toLowerCase()} processing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData({ ...formData, provider: v as ProviderType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini" disabled={!availableProviders.gemini}>
                      Gemini {!availableProviders.gemini && "(not configured)"}
                    </SelectItem>
                    <SelectItem value="openai" disabled={!availableProviders.openai}>
                      OpenAI {!availableProviders.openai && "(not configured)"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Model ID</Label>
              <Input
                placeholder="e.g., gemini-2.0-flash-exp or gpt-4o"
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                The actual model identifier used in API calls
              </p>
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                placeholder="e.g., Gemini 2.0 Flash"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                placeholder="Brief description of the model"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddModel} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Model Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Model</DialogTitle>
            <DialogDescription>
              Update the model configuration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData({ ...formData, provider: v as ProviderType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Active</Label>
                <div className="flex items-center h-10">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Model ID</Label>
              <Input
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditModel} disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGate>
  );
}
