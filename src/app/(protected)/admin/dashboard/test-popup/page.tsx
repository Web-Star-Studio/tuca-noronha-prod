"use client";

import { useState } from "react";
import { GuideSubscriptionPopup } from "@/components/guide/GuideSubscriptionPopup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, RotateCcw, Info } from "lucide-react";

/**
 * Admin page to preview and test the Guide Subscription Popup
 * Access at: /admin/dashboard/test-popup
 */
export default function TestPopupPage() {
  const [showPopup, setShowPopup] = useState(false);

  const handleReset = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("guide_popup_shown");
      localStorage.removeItem("guide_popup_dismissed_at");
      alert("✅ Popup state reset! The popup will appear on the home page after 3 seconds.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            Guide Subscription Popup - Test Panel
          </h1>
          <p className="text-gray-600">
            Preview and test the conversion popup for the Fernando de Noronha guide
          </p>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Test and manage the popup behavior
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Button
                onClick={() => setShowPopup(true)}
                className="w-full"
                size="lg"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Popup
              </Button>
              
              <Button
                onClick={handleReset}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Popup State
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-900 mb-2">ℹ️ How it works:</p>
              <ul className="space-y-1 text-blue-800">
                <li>• Appears on home page after 3 seconds</li>
                <li>• Shows only to users without active subscription</li>
                <li>• Once per session (won&apos;t show again on navigation)</li>
                <li>• 7-day cooldown after dismissal</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Design Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Left Side - Content</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Animated header with gradient text</li>
                  <li>✓ Social proof stats (500+ users, 4.9 rating)</li>
                  <li>✓ Interactive tabs (Benefits/Content/Reviews)</li>
                  <li>✓ Smooth Framer Motion transitions</li>
                  <li>✓ Gradient benefit cards</li>
                  <li>✓ Real customer testimonials</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900">Right Side - CTA</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✓ Bold gradient background</li>
                  <li>✓ Large price display (R$ 99,90/year)</li>
                  <li>✓ Monthly breakdown (menos de R$ 8,50/month)</li>
                  <li>✓ Feature list with emojis</li>
                  <li>✓ Prominent CTA button</li>
                  <li>✓ Trust badges and urgency elements</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Details */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Components:</h4>
                <ul className="text-sm text-gray-600 font-mono space-y-1">
                  <li>• /src/components/guide/GuideSubscriptionPopup.tsx</li>
                  <li>• /src/components/guide/GuidePopupManager.tsx</li>
                  <li>• /src/app/page.tsx (integration)</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Browser Console Commands:</h4>
                <ul className="text-sm text-gray-600 font-mono space-y-1">
                  <li>• window.testGuidePopup.show() - Force show popup</li>
                  <li>• window.testGuidePopup.reset() - Reset all state</li>
                  <li>• window.testGuidePopup.getState() - Check current state</li>
                  <li>• window.testGuidePopup.dismiss() - Simulate dismissal</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Storage Keys:</h4>
                <ul className="text-sm text-gray-600 font-mono space-y-1">
                  <li>• sessionStorage: &ldquo;guide_popup_shown&rdquo;</li>
                  <li>• localStorage: &ldquo;guide_popup_dismissed_at&rdquo;</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Elements */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Optimizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">🎯 Trust Signals</h4>
                <p className="text-sm text-gray-600">
                  500+ satisfied travelers • 4.9/5 rating • 95% success rate • Mercado Pago security
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💬 Social Proof</h4>
                <p className="text-sm text-gray-600">
                  3 customer testimonials with 5-star ratings and specific benefits mentioned
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">⚡ Urgency Elements</h4>
                <p className="text-sm text-gray-600">
                  &ldquo;100+ people accessed this week&rdquo; • &ldquo;Don&apos;t wait until last minute&rdquo; messaging
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">💎 Value Proposition</h4>
                <p className="text-sm text-gray-600">
                  Clear annual pricing • Monthly breakdown • 6 key features • Free updates for 6 months
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design System */}
        <Card>
          <CardHeader>
            <CardTitle>Design System - Fusion Aesthetics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Color Gradients:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <div className="h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500" />
                    <p className="text-xs text-gray-600">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500" />
                    <p className="text-xs text-gray-600">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 rounded-lg bg-gradient-to-r from-orange-500 to-red-500" />
                    <p className="text-xs text-gray-600">Accent</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500" />
                    <p className="text-xs text-gray-600">Success</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Design Elements:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Asymmetric split layout (60/40 ratio)</li>
                  <li>• Glassmorphism effects with backdrop blur</li>
                  <li>• Floating particle decorations</li>
                  <li>• Smooth Framer Motion animations</li>
                  <li>• Hover states with scale transforms</li>
                  <li>• Non-centered, dynamic composition</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The Popup */}
      <GuideSubscriptionPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
      />
    </div>
  );
}
