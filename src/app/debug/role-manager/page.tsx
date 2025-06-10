"use client";

import { RoleManager } from "@/components/debug/RoleManager";

export default function RoleManagerPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Debug: Role Manager
          </h1>
          <p className="text-gray-600">
            Update user roles for development and testing purposes
          </p>
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md text-sm text-yellow-800">
            <strong>Development Only:</strong> This page is only available in development mode.
          </div>
        </div>
        
        <RoleManager />
        
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Quick Start Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Set your role to <strong>"partner"</strong> to access admin dashboard features</li>
            <li>Refresh the page after role update</li>
            <li>Go to <code>/admin/dashboard</code> to test admin features</li>
            <li>Create organizations and assign permissions to employees</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 