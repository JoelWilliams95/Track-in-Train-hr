"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="w-full py-6 px-0 bg-gray-100 text-gray-700 border-t border-gray-200 dark:bg-[#18191a] dark:text-[#b5b5b5] dark:border-[#333] transition-colors text-center text-[15px]">
      <div className="mb-1">
        &copy; {new Date().getFullYear()} Track-N-Train HR. Powered by {" "}
        <a
          href="https://relats.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 underline font-semibold dark:text-blue-300"
        >
          RELATS
        </a>
      </div>
      <div className="text-[13px] opacity-70">
        All rights reserved.
      </div>
    </footer>
  );
} 