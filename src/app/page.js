"use client";
import React from "react";
import AvatarManager from '../components/AvatarManager';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="relative z-10">
        <AvatarManager />
      </div>
    </div>
  );
}
