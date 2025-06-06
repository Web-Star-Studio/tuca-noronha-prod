"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { NotificationCenter } from "@/components/ui/notification-center";

interface UserMenuProps {
  isTransparent?: boolean;
}

const UserMenu = ({ isTransparent = true }: UserMenuProps) => {
  return (
    <>
      <SignedOut>
        <SignInButton>
          <Button
            className={`hover:cursor-pointer ${
              isTransparent
                ? "bg-white text-black hover:bg-white/90"
                : "hover:bg-blue-500 bg-blue-700 text-white"
            }`}
            variant="default"
          >
            Login
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-3">
          {/* Notification Center */}
          <NotificationCenter 
            className={`${
              isTransparent
                ? "text-white hover:bg-white/10"
                : "text-gray-900 hover:bg-gray-100"
            }`}
          />
          
          {/* User Button */}
          <UserButton appearance={{
            elements: {
              userPreview: "bg-white rounded-lg shadow-md",
              userButtonPopoverCard: "bg-white rounded-lg shadow-lg border border-gray-200",
              userButtonTrigger: "shadow-sm hover:shadow-md focus:shadow-md transition-shadow",
              userButtonPopoverActions: "p-2",
              userButtonPopoverActionButton: "text-black hover:bg-blue-100 rounded-md transition-colors",
              userButtonPopoverActionButtonIcon: "text-gray-600",
              userButtonPopoverFooter: "border-t border-gray-200",
              userButtonPopoverActionButtonText: "text-sm font-medium",
              avatarBox: "rounded-full border-2 border-white shadow-sm"
            }
          }} />
        </div>
      </SignedIn>
    </>
  );
};

export default UserMenu;
