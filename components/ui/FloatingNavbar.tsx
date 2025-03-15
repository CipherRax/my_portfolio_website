"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { JSX } from "react/jsx-dev-runtime";

// Type for BuildData and BuildMaterial
// Replace with the actual structure of your data
type BuildData = {
  id: string;
  name: string;
  description?: string;
};

type BuildMaterial = {
  materialId: string;
  materialType: string;
  properties?: Record<string, unknown>; // Change `any` to `unknown` or another more specific type
};

// Type for navItems
type NavItem = {
  name: string;
  link: string;
  icon?: JSX.Element;
};

export const FloatingNav = ({
  navItems,
  className,
  _buildData, // Now with the correct types
  _buildMaterial, // Now with the correct types
}: {
  navItems: NavItem[];
  className?: string;
  _buildData: BuildData; // Correctly typed BuildData
  _buildMaterial: BuildMaterial; // Correctly typed BuildMaterial
}) => {
  const { scrollYProgress } = useScroll();

  const [visible, setVisible] = useState(true);

  // Refactor to just track scroll progress and visibility
  useMotionValueEvent(scrollYProgress, "change", (current) => {
    if (typeof current === "number") {
      const direction = current - scrollYProgress.getPrevious()!;
      if (current < 0.05) {
        setVisible(true);
      } else {
        setVisible(direction < 0); // Hide on scroll down, show on scroll up
      }
    }
  });

  useEffect(() => {
    // Example effect code here
    console.log(_buildData, _buildMaterial); // Use the data as needed
  }, [_buildData, _buildMaterial]); // Add them as dependencies

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 1, y: -100 }}
        animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "flex max-w-fit md:min-w-[70vw] lg:min-w-fit fixed z-[5000] top-10 inset-x-0 mx-auto px-10 py-5 rounded-lg border border-black/.1 shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] items-center justify-center space-x-4",
          className
        )}
        style={{
          backdropFilter: "blur(16px) saturate(180%)",
          backgroundColor: "rgba(17, 25, 40, 0.75)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.125)",
        }}
      >
        {navItems.map((navItem) => (
          <Link
            key={navItem.link} // Use link instead of idx as key for uniqueness
            href={navItem.link}
            className={cn(
              "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500"
            )}
          >
            <span className="block sm:hidden">{navItem.icon}</span>
            <span className=" text-sm !cursor-pointer">{navItem.name}</span>
          </Link>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};
