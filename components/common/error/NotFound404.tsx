"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, RefreshCw, MapPin, Building2, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NotFound404() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-pulse [animation-delay:500ms]" />
      </div>

      <div className="max-w-4xl w-full relative z-10">
        <div className="text-center">
          {/* Animated 404 with GIF-like effect */}
          <div className="mb-8 relative">
            <div className="inline-block">
              <h1 className="text-[12rem] sm:text-[15rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x">
                404
              </h1>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 blur-3xl opacity-30 animate-pulse" />
            </div>
          </div>

          {/* Franchise Icon Animation */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative bg-white dark:bg-gray-800 p-8 rounded-full shadow-2xl border-4 border-blue-200 dark:border-blue-800 animate-bounce">
                <Building2 className="w-24 h-24 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-5xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-4 animate-fade-in">
            Page Not Found
          </h2>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-2">
            Oops! This franchise location doesn't exist
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            The page you're looking for might have been moved, deleted, or doesn't exist in our franchise network.
          </p>

          {/* Franchise Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-3xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-center mb-3">
                <MapPin className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Franchise Locations</div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">10K+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Active Members</div>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="flex items-center justify-center mb-3">
                <TrendingUp className="w-8 h-8 text-pink-600 dark:text-pink-400" />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">98%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => router.back()}
              className="group px-8 py-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
            >
              <ArrowLeft className="w-6 h-6 group-hover:-translate-x-2 transition-transform" />
              Go Back
            </button>

            <Link
              href="/"
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
            >
              <Home className="w-6 h-6" />
              Return Home
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="group px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-lg transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-1 w-full sm:w-auto"
            >
              <RefreshCw className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              Refresh Page
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-12 p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Need Help?</span> Contact our franchise support team or explore our{" "}
              <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                main dashboard
              </Link>
              {" "}to find what you're looking for.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

