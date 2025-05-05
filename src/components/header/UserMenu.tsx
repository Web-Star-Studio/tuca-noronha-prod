"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

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
      </SignedIn>
    </>
  );
};

export default UserMenu;
