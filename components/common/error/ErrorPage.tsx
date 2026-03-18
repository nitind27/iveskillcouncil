"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, RefreshCw, AlertCircle, Shield, Lock, Server, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorPageProps {
  statusCode: number;
  title?: string;
  message?: string;
  showHomeButton?: boolean;
  showBackButton?: boolean;
  className?: string;
}

const errorConfig: Record<number, { title: string; message: string; icon: React.ReactNode; color: string }> = {
  400: {
    title: "Bad Request",
    message: "The request you made is invalid. Please check and try again.",
    icon: <AlertCircle className="w-20 h-20" />,
    color: "text-yellow-500",
  },
  401: {
    title: "Unauthorized",
    message: "You need to be authenticated to access this resource. Please log in.",
    icon: <Lock className="w-20 h-20" />,
    color: "text-orange-500",
  },
  403: {
    title: "Forbidden",
    message: "You don't have permission to access this resource.",
    icon: <Shield className="w-20 h-20" />,
    color: "text-red-500",
  },
  404: {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist or has been moved.",
    icon: <Search className="w-20 h-20" />,
    color: "text-blue-500",
  },
  500: {
    title: "Internal Server Error",
    message: "Something went wrong on our end. We're working to fix it.",
    icon: <Server className="w-20 h-20" />,
    color: "text-red-600",
  },
  503: {
    title: "Service Unavailable",
    message: "The service is temporarily unavailable. Please try again later.",
    icon: <Server className="w-20 h-20" />,
    color: "text-orange-600",
  },
};

export default function ErrorPage({
  statusCode,
  title,
  message,
  showHomeButton = true,
  showBackButton = true,
  className,
}: ErrorPageProps) {
  const router = useRouter();
  const config = errorConfig[statusCode] || {
    title: title || "Error",
    message: message || "An error occurred",
    icon: <AlertCircle className="w-20 h-20" />,
    color: "text-gray-500",
  };

  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4", className)}>
      <div className="max-w-2xl w-full text-center">
        {/* Animated Error Code */}
        <div className="mb-8">
          <div className="inline-block relative">
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 animate-pulse">
              {statusCode}
            </h1>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 blur-2xl opacity-20 animate-pulse" />
          </div>
        </div>

        {/* Icon */}
        <div className={cn("mb-6 flex justify-center", config.color)}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-white dark:bg-gray-800 p-6 rounded-full shadow-2xl border-4 border-blue-200 dark:border-blue-800">
              {config.icon}
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {title || config.title}
        </h2>

        {/* Message */}
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto">
          {message || config.message}
        </p>

        {/* Franchise Branding */}
        <div className="mb-8 p-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Franchise Management System
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="group px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
          )}
          
          {showHomeButton && (
            <Link
              href="/"
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Home className="w-5 h-5" />
              Go Home
            </Link>
          )}

          <button
            onClick={() => window.location.reload()}
            className="group px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

