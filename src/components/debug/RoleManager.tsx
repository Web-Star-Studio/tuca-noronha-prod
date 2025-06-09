"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Debug component for managing user roles in development
 * Remove this in production
 */
export function RoleManager() {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  const currentUser = useQuery(api.domains.users.queries.getCurrentUser);
  const debugInfo = useQuery(api.domains.debug.queries.getCurrentUserDebugInfo);
  const updateRoleMutation = useMutation(api.domains.debug.mutations.updateCurrentUserRole);
  const grantPermissionMutation = useMutation(api.domains.debug.mutations.grantOrganizationPermission);
  
  const handleUpdateRole = async () => {
    if (!selectedRole) return;
    
    setIsUpdating(true);
    try {
      await updateRoleMutation({
        role: selectedRole as any,
      });
      
      alert(`Role updated to ${selectedRole}! Please refresh the page.`);
      window.location.reload();
    } catch (error) {
      console.error("Error updating role:", error);
      alert("Error updating role. Check console for details.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGrantPermission = async (organizationId: string) => {
    try {
      await grantPermissionMutation({
        organizationId: organizationId as any,
        permissions: ["view", "edit"],
        note: "Debug permission granted"
      });
      
      alert("Permission granted successfully! Please try accessing the dashboard again.");
      window.location.reload();
    } catch (error) {
      console.error("Error granting permission:", error);
      alert("Error granting permission. Check console for details.");
    }
  };
  
  if (!currentUser) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Role Manager (Debug)</CardTitle>
          <CardDescription>Loading user information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Role Manager (Debug)</CardTitle>
        <CardDescription>
          Update user roles for development purposes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Current User:</p>
          <p className="font-medium">{currentUser.name || currentUser.email}</p>
          <Badge variant="outline">
            Role: {currentUser.role || "traveler"}
          </Badge>
        </div>
        
        <Alert>
          <AlertDescription>
            This is a debug tool. Remove in production.
            <br />
            <strong>Immediate solution:</strong> Set role to "partner" to access admin features.
          </AlertDescription>
        </Alert>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Update Role:</label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="traveler">Traveler</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
              <SelectItem value="master">Master</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleUpdateRole}
          disabled={!selectedRole || isUpdating}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Update Role"}
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>User ID: {currentUser._id}</p>
          <p>Clerk ID: {currentUser.clerkId}</p>
        </div>
        
        <Alert>
          <AlertDescription>
            <strong>Next steps:</strong> After updating to "partner", you can create organizations and test the admin dashboard.
          </AlertDescription>
        </Alert>
        
        <Separator />
        
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Debug Information</h4>
          {debugInfo ? (
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-medium">Organization Permissions:</p>
                {debugInfo.organizationPermissions?.length > 0 ? (
                  <div className="space-y-1">
                    {debugInfo.organizationPermissions.map((perm: any) => (
                      <div key={perm._id} className="bg-gray-50 p-2 rounded">
                        <p>Org: {perm.organizationId}</p>
                        <p>Permissions: {perm.permissions?.join(", ") || "view"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No organization permissions found</p>
                )}
              </div>
              
              <div>
                <p className="font-medium">Asset Permissions:</p>
                {debugInfo.assetPermissions?.length > 0 ? (
                  <div className="space-y-1">
                    {debugInfo.assetPermissions.map((perm: any) => (
                      <div key={perm._id} className="bg-gray-50 p-2 rounded">
                        <p>Asset: {perm.assetId} ({perm.assetType})</p>
                        <p>Permissions: {perm.permissions?.join(", ")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No asset permissions found</p>
                )}
              </div>
              
              <div>
                <p className="font-medium">Available Organizations:</p>
                {debugInfo.allOrganizations?.length > 0 ? (
                  <div className="space-y-1">
                    {debugInfo.allOrganizations.map((org: any) => (
                      <div key={org._id} className="bg-blue-50 p-2 rounded flex justify-between items-center">
                        <div>
                          <p>Name: {org.name}</p>
                          <p className="text-xs text-gray-600">ID: {org._id}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGrantPermission(org._id)}
                          className="text-xs"
                        >
                          Grant Access
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No organizations found</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Loading debug info...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 